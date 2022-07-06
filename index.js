const debug = require('debug')('w3c-xml-validator')
const FormData = require('form-data')
const htmlParser = require('node-html-parser')

/**
 * `URL` only became available in Node v10. This is included to support Node v8.
 */
const URL = (global.URL || require('whatwg-url').URL)

/**
 * Submits the provided XML to the W3C online validation tool. Returns the
 * provided result.
 *
 * @param  {String}  src   The XML to validate. It should reference a publicly-
 *                         available DTD.
 *
 * @return {Promise}
 */
async function submitValidation (src) {
  return new Promise((resolve, reject) => {
    src = src || ''

    if (src === '') {
      reject(new Error('The input parameter is required and must be a non-empty string value.'))
      return
    }

    const form = new FormData()

    /**
     * These values were determined empirically, by analyzing a request that was
     * submitted manually with a web browser.
     */
    form.append('fragment', src)
    form.append('prefill', '0')
    form.append('doctype', 'Inline')
    form.append('prefill_doctype', 'html401')
    form.append('group', '0')

    /**
     * This is the web address that the form data will be submitted to. If the
     * special parameter value '%%TIMEOUT%%' is used, this will cause the code
     * to query an unreachable host (thus testing the behavior in the case of
     * ECONNREFUSED).
     */
    const dest = (
      src === '%%TIMEOUT%%'
        ? new URL('http://localhost:65001')
        : new URL('https://validator.w3.org/check') // this is the normal target
    )

    debug('Submitting form to %s...', dest)
    const startTime = Date.now()

    form.submit(
      {
        protocol: dest.protocol,
        host: dest.host,
        path: dest.pathname,
        headers: {
          referrer: dest.origin
        }
      },
      (err, response) => {
        debug('...done!')

        if (err) {
          reject(err)
          return
        }

        /**
         * This is the data received back from W3C.
         * @type {Array}
         */
        const responseData = []

        /**
         * This is the value that will eventually be returned by this promise.
         * @type {Object}
         */
        const validationResult = {
          isValid: true,
          warnings: [],
          errors: []
        }

        response.on('data', (chunk) => {
          responseData.push(chunk.toString())
        })

        response.on('end', () => {
          const endTime = Date.now()
          debug('    recevied response in %d sec', ((endTime - startTime) / 1000))
          debug('    code: %d', response.statusCode)
          debug('    headers: %o', response.headers)

          const body = responseData.join('')
          debug('    length: %d', body.length)

          /**
           * Anything other than a 200 indicates a problem with the underlying
           * HTTP transmission. In that case, abort!
           *
           * NOTE: this has nothing to do with whether or not the XML is valid.
           * W3C actually understands how to use HTTP response codes correctly.
           */
          if (response.statusCode !== 200) {
            debug('    body: %s', body)
            reject(new Error(`The remote server replied with a ${response.statusCode} status code.`))
            return
          }

          /**
           * The returned HTML, represented as a basic DOM. This makes it easier
           * to parse the results and find the data of interest.
           * @type {Object}
           */
          const htmlDocument = htmlParser.parse(body)

          /**
           * Currently, the reported DOCTYPE that W3C assumed is reported in an
           * H2 element near the top of the page.
           */
          const resultsHeading = htmlDocument.querySelector('#results_container').childNodes[4]

          debug('Found results heading node %o', resultsHeading) // these are present to help troubleshoot in case the structure of the HTML changes

          /**
           * The following two lines are necessary to extract the DOCTYPE from
           * the sentence that contains it.
           */
          validationResult.doctype = resultsHeading
            .childNodes[0]
            .rawText
            .replace(/\s+/g, ' ')
            .replace(/!$/, '')

          validationResult.doctype = validationResult.doctype.substring(validationResult.doctype.lastIndexOf(' ') + 1)

          /**
           * Warnings and errors are contained in separate OL elements futher
           * down the page. Fortunately, they have unique identifiers.
           */
          const warnings = htmlDocument.querySelector('#warnings')

          warnings.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
              debug('Found warning: %s', child.structure)

              const target = child.childNodes[0].childNodes[2]
              debug('   third great-grandchild node %o', target)
              validationResult.warnings.push(target.rawText)
            }
          })

          const errors = htmlDocument.querySelector('#error_loop')

          if (errors) {
            validationResult.isValid = false

            errors.childNodes.forEach((child) => {
              if (child.nodeType === 1 && child.classNames.indexOf('msg_err') > -1) {
                debug('Found error: %s', child.structure)

                const line = child.childNodes[3]
                const msg = child.childNodes[5]
                debug('   third grandchild node %o', line)
                debug('   sixth grandchild node %o', msg)

                validationResult.errors.push(`${line.text.substring(0, line.text.indexOf(','))}: ${msg.text}`)
              }
            })
          }

          resolve(validationResult)
        })

        response.resume() // it's important to setup the event handlers before doing this
      }
    )
  })
}

module.exports = submitValidation
