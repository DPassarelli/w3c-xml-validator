/**
 * The common error message provided when basic sanity checks on the input fail.
 * @type {Error}
 */
const inputValidationError = new Error(
  'The function exported by "w3c-xml-validator" expects to called with valid markup, including an XML declaration that is publicly accessible. Missing or invalid data provided.'
)

/**
 * Send the provided XML to W3C and report any issues found.
 *
 * @param  {any}   input          The XML to validate.
 *
 * @param  {Object}   mockFetch   ONLY USED FOR TESTING PURPOSES
 *
 * @return {Promise<Object>}
 */
export default async function validateXmlAgainstDtdUsingW3C (input, mockFetch) {
  validateInput(input)
  verifyPubliclyAccessibleDTD(input)

  const fetcher = mockFetch || fetch

  try {
    await fetcher('http://example.com')
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`The W3C validation service cannot be reached (${err.code || err.message}).`)
    }
  }
}

/**
 * Perform a basic "duck test" to determine whether the provided value seems to
 * be valid XML.
 *
 * @param  {any}   input   The provided "XML" value.
 *
 * @return {undefined}     An error will be thrown if any aspect of the test
 *                         fails.
 */
function validateInput (input) {
  if (!(typeof input === 'string') || input.length === 0) {
    throw inputValidationError
  }

  // input = input.trim()

  if (!input.startsWith('<?xml')) throw inputValidationError
  if (!input.includes('<!DOCTYPE')) throw inputValidationError
}

/**
 * Perform a basic "does this XML reference a publicly accessible DTD?" test.
 *
 * @param  {String}   input   The provided duck-checked XML.
 *
 * @return {undefined}        An error will be thrown if any aspect of the test
 *                            fails.
 */
function verifyPubliclyAccessibleDTD (input) {
  const dtdStartingIndex = input.search('<!DOCTYPE')
  const dtdTag = input.substring(
    dtdStartingIndex,
    input.indexOf('>', dtdStartingIndex) + 1
  )

  const uriRegex = /"http(s)?:\/\/\S+"/
  if (!uriRegex.test(dtdTag)) throw inputValidationError
}
