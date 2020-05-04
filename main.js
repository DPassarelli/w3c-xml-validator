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

        const responseData = []
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

          if (response.statusCode !== 200) {
            debug('    body: %s', body)
            reject(new Error(`The remote server replied with a ${response.statusCode} status code.`))
            return
          }

          const htmlDocument = htmlParser.parse(body)

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

                const target = child.childNodes[5]
                debug('   sixth grandchild node %o', target)
                validationResult.errors.push(target.rawText)
              }
            })
          }

          resolve(validationResult)
        })

        response.resume()
      }
    )
  })
}

module.exports = submitValidation
