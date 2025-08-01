const debug = require('debug')('w3c-xml-validator')
const htmlParser = require('node-html-parser')
const request = require('got')

/**
 * Throws an exception if the value provided to this library is the wrong data
 * type or empty.
 *
 * @param  {any}   input   The value to check.
 *
 * @return {undefined}
 */
function validateInput (input) {
  if (Buffer.isBuffer(input)) {
    debug('input value is a buffer')
    return
  }

  if (typeof input !== 'string' || input.length === 0) {
    throw new Error('The XML input is required and must be a non-empty string value (or buffer).')
  }

  debug('input value is a non-zero length string')
}

/**
 * Returns an object that contains a properly formatted "multipart/form-data"
 * request payload, and the boundary value used in that payload.
 *
 * @param  {Buffer|String}   xml   The XML to submit to W3C. It must reference a
 *                                 publicly-available DTD.
 *
 * @return {Object}
 */
function createPayloadForW3C (xml) {
  const now = new Date()

  /**
   * The multipart/form-data boundary value (sans preceeding hyphen characters).
   * See https://www.rfc-editor.org/rfc/rfc2046#section-5.1 for more info.
   * @type {String}
   */
  const boundary = `W3CFormBoundary_${now.getTime()}`

  /**
   * The set of lines that comprise the entire request payload.
   * @type {Array}
   */
  const lines = []

  /**
   * The set of fields (and corresponding values) that must be included in the
   * request payload. The was determined by inspecting a request submitted
   * manually via the W3C web site).
   * @type {Object}
   */
  const payload = {
    fragment: xml,
    prefill: '0',
    doctype: 'Inline',
    prefill_doctype: 'html401',
    group: '0'
  }

  lines.push('')

  debug('creating payload for multipart HTTP request...')

  Object.keys(payload).forEach((field) => {
    debug(`  - adding value for "${field}"`)

    lines.push(`--${boundary}`)
    lines.push(`Content-Disposition: form-data; name="${field}"`)
    lines.push('')
    lines.push(payload[field])
  })

  lines.push(`--${boundary}--`)

  debug(`payload is comprised of ${lines.length} lines`)

  return {
    boundary: boundary,
    data: lines.join('\r\n')
  }
}

/**
 * Submits an HTTP request to W3C and returns the reponse.
 *
 * @param  {Object}   payload   A dictionary containing the keys `boundary`
 *                              (the multipart boundary value, sans hyphens) and
 *                              `data` (the assembled multipart request body).
 *
 * @return {Promise}
 */
function submitRequestToW3C (payload) {
  /**
   * This is the web address that the form data will be submitted to.
   * @type {String}
   */
  const w3cValidatorUrl = 'https://validator.w3.org/check'

  debug('submitting request to "%s"...', w3cValidatorUrl)

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
 * Parses the returned HTML document to determine which DTD was identified by
 * W3C.
 *
 * @param  {Object}   htmlDOM   The HTML returned from W3C, represented as a
 *                              basic DOM.
 *
 * @return {String}             The identified DTD.
 */
function getDoctypeFromResponse (htmlDocument) {
  /**
   * The DOM element containing the DTD (as text). This was determined by
   * manually inspecting a returned HTML document.
   * @type {Object}
   */
  const resultsElem = htmlDocument.querySelector('#results_container').childNodes[4]

  // Collapse extra whitespace and remove the trailing punctuation mark.
  const sentence = resultsElem
    .childNodes[0]
    .rawText
    .replace(/\s+/g, ' ')
    .replace(/!$/, '')

  // Return the last word in the sentence.
  return sentence.substring(sentence.lastIndexOf(' ') + 1)
}

/**
 * Parses the returned HTML document to determine which warnings were
 * identified by W3C.
 *
 * @param  {Object}   htmlDOM   The HTML returned from W3C, represented as a
 *                              basic DOM.
 *
 * @return {Array}              List of strings (each of which describes a
 *                              single warning).
 */
function getWarningsFromResponse (htmlDocument) {
  /**
   * Warnings and errors are contained in separate OL elements on the page.
   * Fortunately, each list has a unique identifier.
   */
  const warningsElem = htmlDocument.querySelector('#warnings')

  return warningsElem.childNodes
    .filter((child) => {
      // for the list of node type values, see https://github.com/taoqf/node-html-parser/blob/8f4cedfb0ac1b58da4f72af2f8bb01123c119df4/src/nodes/type.ts
      return (child.nodeType === 1)
    })
    .map((child) => {
      return child.childNodes[0].childNodes[2].rawText
    })
}

/**
 * Parses the returned HTML document to determine which errors were identified
 * by W3C.
 *
 * @param  {Object}   htmlDOM   The HTML returned from W3C, represented as a
 *                              basic DOM.
 *
 * @return {Array}              List of strings (each of which describes a
 *                              single error).
 */
function getErrorsFromResponse (htmlDocument) {
  /**
   * Warnings and errors are contained in separate OL elements on the page.
   * Fortunately, each list has a unique identifier.
   */
  const errorsParentElement = htmlDocument.querySelector('#error_loop')

  if (errorsParentElement == null) {
    debug('when parsing the returned HTML for error messages, the parent container could not be found')
    return []
  }

  return errorsParentElement.childNodes
    .filter((child) => {
      return (child.nodeType === 1 && child.classNames.indexOf('msg_err') > -1)
    })
    .map((child) => {
      const line = child.childNodes[3]
      const msg = child.childNodes[5]
      return `${line.text.substring(0, line.text.indexOf(','))}: ${msg.text}`
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
   * NOTE: this has nothing to do with whether or not the submitted XML is
   * valid. IMO, W3C actually understands how to use HTTP response codes
   * correctly.
   */
  if (response.statusCode !== 200) {
    throw new Error(`The W3C server replied with a ${response.statusCode} status code.`)
  }

  /**
   * The returned HTML, represented as a basic DOM. This makes it easier
   * to parse the results and find the data of interest.
   * @type {Object}
   */
  const htmlDOM = htmlParser.parse(response.body)

  /**
   * The list of errors (for the submitted XML) reported by W3C. "Valid XML" for
   * this library means "no reported errors".
   * @type {Array}
   */
  const errors = getErrorsFromResponse(htmlDOM)

  return {
    doctype: getDoctypeFromResponse(htmlDOM),
    errors: errors,
    isValid: (errors.length === 0),
    warnings: getWarningsFromResponse(htmlDOM)
  }
}

module.exports = exported
