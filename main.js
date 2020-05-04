const debug = require('debug')('w3c-xml-validator')
const FormData = require('form-data')
const htmlParser = require('node-html-parser')

const VALIDATION_URI = 'https://validator.w3.org/check'

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
    const result = {
      isValid: true,
      warnings: [],
      errors: []
    }

    form.append('fragment', '')
    form.append('prefill', '0')
    form.append('doctype', 'Inline')
    form.append('prefill_doctype', 'html401')
    form.append('group', '0')

    debug('Submitting form to %s...', VALIDATION_URI)

    form.submit(VALIDATION_URI, (err, response) => {
      debug('...done!')

      if (err) {
        reject(err)
        return
      }

      const responseChunks = []

      response.on('data', (chunk) => {
        responseChunks.push(chunk.toString())
      })

      response.on('end', () => {
        const responseBody = responseChunks.join('')
        const htmlDocument = htmlParser.parse(responseBody)

        const warningsNode = htmlDocument.querySelector('#warnings')

        warningsNode.childNodes.forEach((child) => {
          if (child.nodeType === 1) {
            debug('Found warning: %s', child.structure)

            const target = child.childNodes[0].childNodes[2]
            debug('   third grandchild node %o', target)
            result.warnings.push(target.rawText)
          }
        })

        resolve(result)
      })

      response.resume()
    })
  })
}

module.exports = submitValidation
