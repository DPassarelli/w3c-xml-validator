/* eslint-env mocha */

const path = require('path')
const cliRunner = require('./cli-runner.js')

/**
 * A flag indicating whether the current OS is based on MS Windows.
 * @type {Boolean}
 */
const isWindowsOS = require('os').platform().startsWith('win')

/**
 * The appropriate way to call the CLI, depending on the detected OS type.
 * @type {String}
 */
const cli = (
  isWindowsOS
    ? 'node .\\bin\\cli.js'
    : './bin/cli.js'
)

const pathToValidSampleXmlFile = path.resolve('./test/samples/valid.xml')
const pathToInvalidSampleXmlFile = path.resolve('./test/samples/invalid.xml')

describe('the command-line interface', function () {
  context('when piping valid input', function () {
    let result = null

    before(function () {
      this.timeout(8000) // sometimes the request to W3C takes a bit longer than the default timeout of 2 sec

      const cmd = (
        isWindowsOS
          ? `type ${pathToValidSampleXmlFile} | ${cli}`
          : `cat ${pathToValidSampleXmlFile} | ${cli}`
      )

      return cliRunner(cmd)
        .then(function (output) {
          result = output
        })
    })

    it('must return a zero exit code', function () {
      const expected = 0
      const actual = result.code

      expect(actual).to.equal(expected)
    })

    it('must output the expected text', function () {
      const expected = `Validating XML from stdin...

Congratulations, the provided XML is well-formed and valid, according to the DTD at "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd"

However, please note the following warnings:
  - Using Direct Input mode: UTF-8 character encoding assumed
`
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when referring to invalid input as an argument', function () {
    let result = null

    before(function () {
      this.timeout(8000)

      return cliRunner(`${cli} ${pathToInvalidSampleXmlFile}`)
        .then(function (output) {
          result = output
        })
    })

    it('must return a non-zero exit code', function () {
      const expected = 1
      const actual = result.code

      expect(actual).to.equal(expected)
    })

    it('must output the expected text', function () {
      const expected = `Validating the file at "${pathToInvalidSampleXmlFile}"...

Unfortunately, the provided XML does not validate according to the DTD at "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd"

The following errors were reported:
  ✘ Line 3: required attribute "payloadID" not specified
  ✘ Line 46: end tag for "PunchOutOrderMessage" omitted, but OMITTAG NO was specified

Also, please note the following warnings:
  - Using Direct Input mode: UTF-8 character encoding assumed
`
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when a timeout occurs', function () {
    // TODO
  })
})
