/* eslint-env mocha */

const os = require('os')
const path = require('path')

const exec = require('execa')
const finder = require('then-recursively-search')

/**
 * Spawns a child process to run the CLI command given. The return code, and
 * output of `stdout` and `stderr` are captured for later analysis by the tests.
 *
 * @param  {String}   cmd   The command to run, which will be executed in a
 *                          shell context.
 *
 * @return {Promise}
 */
function runChildProcess (cmd) {
  return finder(__dirname, 'package.json')
    .then(function (fullPath) {
      return exec.command(
        cmd, {
          cwd: path.dirname(fullPath),
          reject: false,
          shell: true,
          stripFinalNewline: false
        })
    })
    .then(function (result) {
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.exitCode
      }
    })
}

const pathToValidSampleXmlFile = path.resolve('./test/samples/valid.xml')
const pathToInvalidSampleXmlFile = path.resolve('./test/samples/invalid.xml')

describe('the command-line interface', function () {
  context('when piping valid input', function () {
    let result = null

    before(function () {
      this.timeout(8000) // sometimes the request to W3C takes a bit longer than the default timeout of 2 sec

      const cmd = (
        os.platform() === 'win32'
          ? `type ${pathToValidSampleXmlFile} | node .\\bin\\cli.js`
          : `cat ${pathToValidSampleXmlFile} | ./bin/cli.js`
      )

      return runChildProcess(cmd)
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
      const expected = `
Validating XML from stdin...

Congratulations, the provided XML is well-formed and valid, according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd

However, please note the following warnings:
  - Using Direct Input mode: UTF-8 character encoding assumed
`
      const actual = result.stdout

      expect(actual).to.equal(expected)
    })
  })

  context('when referring to invalid input as an argument', function () {
    let result = null

    before(function () {
      this.timeout(8000)

      const cmd = (
        os.platform() === 'win32'
          ? `node .\\bin\\cli.js ${pathToInvalidSampleXmlFile}`
          : `./bin/cli.js ${pathToInvalidSampleXmlFile}`
      )

      return runChildProcess(cmd)
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
      const expected = `
Validating XML from path ${pathToInvalidSampleXmlFile}...

Unfortunately, the provided XML does not validate according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd

The following errors were reported:
  ✘ Line 3: required attribute "payloadID" not specified
  ✘ Line 46: end tag for "PunchOutOrderMessage" omitted, but OMITTAG NO was specified

Also, please note the following warnings:
  - Using Direct Input mode: UTF-8 character encoding assumed
`
      const actual = result.stdout

      expect(actual).to.equal(expected)
    })
  })

  context('when an error occurs', function () {
    const pathToSpecialFile = path.resolve('./test/samples/timeout')
    let result = null

    before(function () {
      this.timeout(8000)

      /**
       * It's necessary to turn off debugging here, because that will output
       * extraneous information to stderr and cause a false failure.
       */
      const cmd = (
        os.platform() === 'win32'
          ? `SET DEBUG=off && node .\\bin\\cli.js ${pathToSpecialFile}`
          : `DEBUG=off ./bin/cli.js ${pathToSpecialFile}`
      )

      return runChildProcess(cmd)
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
      const expected = {
        stdout: `
Validating XML from path ${pathToSpecialFile}...
`,
        stderr: 'ERROR: getaddrinfo ENOTFOUND'
      }

      const actual = {
        stdout: result.stdout,
        stderr: result.stderr.substring(0, expected.stderr.length)
      }

      expect(actual).to.deep.equal(expected)
    })
  })
})
