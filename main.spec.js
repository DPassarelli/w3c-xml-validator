/* eslint-env mocha */

const nock = require('nock')
const path = require('path')

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

  describe('the value returned by the function', function () {
    it('must be a Promise', function () {
      const promise = T().catch(e => { /* do nothing */ })
      expect(promise).to.have.property('then')
    })
  })

  describe('the returned promise', function () {
    const ERR_MESSAGE = 'The input parameter is required and must be a non-empty string value.'

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

    describe('the fulfilled value', function () {
      context('for a successful validation', function () {
        let promise = null

        before(function () {
          nock('https://validator.w3.org')
            .post('/check')
            .replyWithFile(200, path.join(__dirname, './test/samples/success.html'))
            .persist()
        })

        after(function () {
          nock.cleanAll()
        })

        beforeEach(function () {
          promise = T('<?xml version="1.0" encoding="utf-8"?>')
        })

        it('must be an object', function () {
          return promise
            .then(function (response) {
              const expected = 'object'
              const actual = typeof response

              expect(actual).to.equal(expected)
            })
        })

        it('must have a property called "isValid" with the correct value', function () {
          return promise
            .then(function (response) {
              const expected = true
              const actual = response.isValid

              expect(actual).to.equal(expected)
            })
        })

        it('must have a property called "warnings" with the correct value', function () {
          return promise
            .then(function (response) {
              const expected = [
                'No Character encoding declared at document level',
                'Using Direct Input mode: UTF-8 character encoding assumed'
              ]
              const actual = response.warnings

              expect(actual).to.deep.equal(expected)
            })
        })

        it('must have a property called "errors" with the correct value', function () {
          return promise
            .then(function (response) {
              const expected = []
              const actual = response.errors

              expect(actual).to.deep.equal(expected)
            })
        })
      })

      context('for a validation with a single error', function () {
        let promise = null

        before(function () {
          nock('https://validator.w3.org')
            .post('/check')
            .replyWithFile(200, path.join(__dirname, './test/samples/single-error.html'))
            .persist()
        })

        after(function () {
          nock.cleanAll()
        })

        beforeEach(function () {
          promise = T('<?xml version="1.0" encoding="utf-8"?>')
        })

        it('must be an object', function () {
          return promise
            .then(function (response) {
              const expected = 'object'
              const actual = typeof response

              expect(actual).to.equal(expected)
            })
        })

        it.skip('must have a property called "isValid" with the correct value', function () {
          return promise
            .then(function (response) {
              const expected = false
              const actual = response.isValid

              expect(actual).to.equal(expected)
            })
        })

        it('must have a property called "warnings" with the correct value', function () {
          return promise
            .then(function (response) {
              const expected = [
                'Using Direct Input mode: UTF-8 character encoding assumed'
              ]
              const actual = response.warnings

              expect(actual).to.deep.equal(expected)
            })
        })

        it.skip('must have a property called "errors" with the correct value', function () {
          return promise
            .then(function (response) {
              const expected = [
                'end tag for &quot;PunchOutOrderMessage&quot; omitted, but OMITTAG NO was specified'
              ]
              const actual = response.errors

              expect(actual).to.deep.equal(expected)
            })
        })
      })
    })
  })
})
