/* eslint-env mocha */

const fs = require('fs')
const path = require('path')

/**
 * Code under test.
 * @type {any}
 */
const T = require(path.join(__dirname, '../../main.js'))

const VALID_XML = fs.readFileSync(path.join(__dirname, '../samples/valid.xml'))
const INVALID_XML = fs.readFileSync(path.join(__dirname, '../samples/invalid.xml'))

describe('an actual submission to W3C', function () {
  context('with a valid document', function () {
    it('must return the expected result', function () {
      this.timeout(5000)

      const expected = {
        doctype: 'http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd',
        isValid: true,
        warnings: [
          'Using Direct Input mode: UTF-8 character encoding assumed'
        ],
        errors: []
      }

      return T(VALID_XML)
        .then((actual) => {
          expect(actual).to.deep.equal(expected)
        })
    })
  })

  context('with an invalid document', function () {
    it('must return the expected result', function () {
      this.timeout(5000)

      const expected = {
        doctype: 'http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd',
        isValid: false,
        warnings: [
          'Using Direct Input mode: UTF-8 character encoding assumed'
        ],
        errors: [
          'required attribute &quot;payloadID&quot; not specified',
          'end tag for &quot;PunchOutOrderMessage&quot; omitted, but OMITTAG NO was specified'
        ]
      }

      return T(INVALID_XML)
        .then((actual) => {
          expect(actual).to.deep.equal(expected)
        })
    })
  })
})
