export default async function (input, mockFetchImpl) {
  if (!(typeof input === 'string') || input.length === 0) {
    throw new Error('The function exported by `w3c-xml-validator` expects to called with valid markup, including an XML declaration that is publicly accessible. Missing or invalid data provided.')
  }

  const fetcher = mockFetchImpl || fetch

  try {
    await fetcher('http://example.com')
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`The W3C validation service cannot be reached (${err.code || err.message}).`)
    }
  }
}
