const debug = require('debug')('w3c-xml-validator')
const htmlParser = require('node-html-parser')
const request = require('got')

/**
 * Throws an exception if the provided value does not pass validation.
 *
 * @param  {any}   input   The value to check.
 *
 * @return {undefined}
 */
function validateInput (input) {
  if (Buffer.isBuffer(input)) return

  if (typeof input !== 'string' || input.length === 0) {
    throw new Error('The XML input is required and must be a non-empty string value (or buffer).')
  }
}

/**
 * Returns an object that contains a properly formatted "multipart/form-data"
 * request payload, and the boundary value used in that payload.
 *
 * @param  {String}  xml   The XML to submit to W3C. It must reference a
 *                         publicly-available DTD.
 *
 * @return {Object}
 */
function createPayloadForW3C (xml) {
  const now = new Date()

  /**
   * [boundary description]
   * @type {[type]}
   */
  const boundary = `W3CFormBoundary_${now.getTime()}`

  /**
   * [lines description]
   * @type {Array}
   */
  const lines = []

  /**
   * [fields description]
   * @type {Object}
   */
  const fields = {
    fragment: xml,
    prefill: '0',
    doctype: 'Inline',
    prefill_doctype: 'html401',
    group: '0'
  }

  lines.push('')

  Object.keys(fields).forEach((field) => {
    lines.push(`--${boundary}`)
    lines.push(`Content-Disposition: form-data; name="${field}"`)
    lines.push('')
    lines.push(fields[field])
  })

  lines.push(`--${boundary}--`)

  return {
    boundary: boundary,
    data: lines.join('\r\n')
  }
}

/**
 * [submitFormToW3C description]
 * @param  {[type]} form [description]
 * @return {[type]}      [description]
 */
async function submitRequestToW3C (payload) {
  /**
   * This is the web address that the form data will be submitted to.
   * @type {String}
   */
  const w3cValidatorUrl = 'https://validator.w3.org/check'

  debug('Request body: %s', payload.data)

  debug('Submitting to %s...', w3cValidatorUrl)

  return request(
    {
      url: w3cValidatorUrl,
      method: 'POST',
      headers: {
        'content-type': `multipart/form-data; boundary=${payload.boundary}`,
        'user-agent': 'w3c-xml-validator'
      },
      body: payload.data,
      throwHttpErrors: false
    }
  )
}

/**
 * [findDoctype description]
 * @param  {[type]} htmlDocument [description]
 * @return {[type]}              [description]
 */
function getDoctypeFromResponse (htmlDocument) {
  /**
   * Currently, the reported DOCTYPE that W3C assumed is reported in an
   * H2 element near the top of the page.
   */
  const resultsElem = htmlDocument.querySelector('#results_container').childNodes[4]

  /**
   * The following two lines are necessary to extract the DOCTYPE from
   * the sentence that contains it.
   */
  const sentence = resultsElem
    .childNodes[0]
    .rawText
    .replace(/\s+/g, ' ')
    .replace(/!$/, '')

  return sentence.substring(sentence.lastIndexOf(' ') + 1)
}

/**
 * [getWarnings description]
 * @param  {[type]} htmlDocument [description]
 * @return {[type]}              [description]
 */
function getWarningsFromResponse (htmlDocument) {
  /**
   * Warnings and errors are contained in separate OL elements futher
   * down the page. Fortunately, they have unique identifiers.
   */
  const warningsElem = htmlDocument.querySelector('#warnings')
  const result = []

  warningsElem.childNodes.forEach((child) => {
    if (child.nodeType === 1) {
      result.push(child.childNodes[0].childNodes[2].rawText)
    }
  })

  return result
}

/**
 * [getErrors description]
 * @param  {[type]} htmlDocument [description]
 * @return {[type]}              [description]
 */
function getErrorsFromResponse (htmlDocument) {
  const errorsParentElement = htmlDocument.querySelector('#error_loop')

  if (errorsParentElement == null) {
    return []
  }

  return errorsParentElement.childNodes
    .map((child) => {
      if (child.nodeType === 1 && child.classNames.indexOf('msg_err') > -1) {
        const line = child.childNodes[3]
        const msg = child.childNodes[5]
        return `${line.text.substring(0, line.text.indexOf(','))}: ${msg.text}`
      }

      return null
    })
    .filter((item) => {
      return (item !== null)
    })
}

/**
 * The exported function (entry point for this module).
 *
 * @param  {String}  input   The XML to validate. It must reference a publicly-
 *                           available DTD.
 *
 * @return {Promise}
 */
async function exported (input) {
  validateInput(input)

  const payload = createPayloadForW3C(input)
  const response = await submitRequestToW3C(payload)

  debug('  - recevied response in %d sec', (response.timings.phases.total / 1000))
  debug('  - status: %d', response.statusCode)
  debug('  - headers: %o', response.headers)

  /**
   * Anything other than a 200 indicates a problem with the underlying
   * HTTP transmission. In that case, abort!
   *
   * NOTE: this has nothing to do with whether or not the XML is valid.
   * W3C actually understands how to use HTTP response codes correctly.
   */
  if (response.statusCode !== 200) {
    throw new Error(`The W3C server replied with a ${response.statusCode} status code.`)
  }

  /**
   * The returned HTML, represented as a basic DOM. This makes it easier
   * to parse the results and find the data of interest.
   * @type {Object}
   */
  const htmlDocument = htmlParser.parse(response.body)

  /**
   * [errors description]
   * @type {Array}
   */
  const errors = getErrorsFromResponse(htmlDocument)

  return {
    doctype: getDoctypeFromResponse(htmlDocument),
    errors: errors,
    isValid: (errors.length === 0),
    warnings: getWarningsFromResponse(htmlDocument)
  }
}

module.exports = exported
