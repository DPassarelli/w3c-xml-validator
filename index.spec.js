/* eslint-env mocha */

const nock = require('nock')
const path = require('path')

/**
 * Code under test.
 * @type {any}
 */
const T = require('./index.js')

describe('the "w3c-xml-validator" module', function () {
  it('must return a function', function () {
    const expected = 'function'
    const actual = typeof T

    expect(actual).to.equal(expected)
  })

  describe('the value returned by the function', function () {
    it('must be a Promise', function () {
      const returnValue = T()
      expect(returnValue).to.be.a('promise')
    })
  })

  describe('the returned promise', function () {
    const ERR_MESSAGE = 'The XML input is required and must be a non-empty string value (or buffer).'

    it('must be rejected if the input parameter is missing', function () {
      const promise = T()
      return expect(promise).to.be.rejectedWith(ERR_MESSAGE)
    })

    it('must be rejected if the input parameter is `null`', function () {
      const promise = T(null)
      return expect(promise).to.be.rejectedWith(ERR_MESSAGE)
    })

    it('must be rejected if the input parameter is an empty string', function () {
      const promise = T('')
      return expect(promise).to.be.rejectedWith(ERR_MESSAGE)
    })

    it('must be rejected if the input parameter is not a string', function () {
      const promise = T(new Date())
      return expect(promise).to.be.rejectedWith(ERR_MESSAGE)
    })

    it.skip('must be rejected if the remote server is unreachable', function () {
      const promise = T('%%TIMEOUT%%')
      return expect(promise).to.be.rejectedWith(/ECONNREFUSED/)
    })

    it('must be rejected if the remote server replies with a 3xx status code', function () {
      nock('https://validator.w3.org')
        .post('/check')
        .reply(302)

      const promise = T('<?xml version="1.0" encoding="utf-8"?>')

      return expect(promise).to.be.rejectedWith('The W3C server replied with a 302 status code.')
    })

    it('must be rejected if the remote server replies with a 4xx status code', function () {
      nock('https://validator.w3.org')
        .post('/check')
        .reply(400, 'Bad request')

      const promise = T('<?xml version="1.0" encoding="utf-8"?>')

      return expect(promise).to.be.rejectedWith('The W3C server replied with a 400 status code.')
    })

    it('must be rejected if the remote server replies with a 5xx status code', function () {
      nock('https://validator.w3.org')
        .post('/check')
        .reply(503)

      const promise = T('<?xml version="1.0" encoding="utf-8"?>')

      return expect(promise).to.be.rejectedWith('The W3C server replied with a 503 status code.')
    })

    describe('the fulfilled value', function () {
      context('for a successful validation', function () {
        /**
         * The value returned by the exported function.
         * @type {Promise}
         */
        let actual = null

        /**
         * The expected fulfillment value.
         * @type {Object}
         */
        const expected = Object.freeze({
          doctype: 'http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd',
          isValid: true,
          warnings: [
            'No Character encoding declared at document level',
            'Using Direct Input mode: UTF-8 character encoding assumed'
          ],
          errors: []
        })

        before(() => {
          nock('https://validator.w3.org')
            .post('/check')
            .replyWithFile(200, path.join(__dirname, './test/samples/success.html'))
            .persist()
        })

        after(() => {
          nock.cleanAll()
        })

        context('of a string', function () {
          before(async function () {
            // the value passed to T() can be anything that resembles XML, since
            // the response is mocked (and therefore not dependent on the input)
            actual = await T('<?xml version="1.0" encoding="utf-8"?>')
          })

          it('must return the expected value', function () {
            expect(actual).to.deep.equal(expected)
          })
        })

        context('of a buffer', function () {
          before(async function () {
            // the value passed to T() can be anything that resembles XML, since
            // the response is mocked (and therefore not dependent on the input)
            actual = await T(Buffer.from('<?xml version="1.0" encoding="utf-8"?>'))
          })

          it('must return the expected value', function () {
            expect(actual).to.deep.equal(expected)
          })
        })
      })

      context('for a validation with a single error', function () {
        /**
         * The value returned by the exported function.
         * @type {Promise}
         */
        let actual = null

        /**
         * The expected fulfillment value.
         * @type {Object}
         */
        const expected = Object.freeze({
          doctype: 'http://xml.cxml.org/schemas/cXML/1.2.015/cXML.dtd',
          isValid: false,
          warnings: [
            'Using Direct Input mode: UTF-8 character encoding assumed'
          ],
          errors: [
            'Line 46: end tag for "PunchOutOrderMessage" omitted, but OMITTAG NO was specified'
          ]
        })

        before(async function () {
          nock('https://validator.w3.org')
            .post('/check')
            .replyWithFile(200, path.join(__dirname, './test/samples/single-error.html'))

          // the value passed to T() can be anything that resembles XML, since
          // the response is mocked (and therefore not dependent on the input)
          actual = await T('<?xml version="1.0" encoding="utf-8"?>')
        })

        it('must return the expected value', function () {
          expect(actual).to.deep.equal(expected)
        })
      })
    })
  })
})
