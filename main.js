const debug = require('debug')('w3c-xml-validator')
const FormData = require('form-data')
const htmlParser = require('node-html-parser')

const validationUri = new URL('https://validator.w3.org/check')

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

    form.append('fragment', src)
    form.append('prefill', '0')
    form.append('doctype', 'Inline')
    form.append('prefill_doctype', 'html401')
    form.append('group', '0')

    debug('Submitting form to %s...', validationUri)
    const startTime = Date.now()

    form.submit(
      {
        protocol: validationUri.protocol,
        host: validationUri.host,
        path: validationUri.pathname,
        headers: {
          referrer: validationUri.origin
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
