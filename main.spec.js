/* eslint-env mocha */

/**
 * Code under test.
 * @type {any}
 */
const T = require('./main.js')

describe('the "w3c-xml-validator" module', function () {
  it('must return a function', function () {
    const expected = 'function'
    const actual = typeof T

    expect(actual).to.equal(expected)
  })

  describe('the returned function', function () {
    it('must be a thenable', function () {
      const result = T()
      return expect(result).to.be.rejected
    })
  })
})
