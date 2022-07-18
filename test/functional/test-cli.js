/* eslint-env mocha */

const childProcess = require('child_process')
const path = require('path')

/**
 * [isWindowsPlatform description]
 * @type {Boolean}
 */
const isWindowsPlatform = (require('os').platform() === 'win32')

/**
 * [command description]
 * @type {String}
 */
const callee = (
  isWindowsPlatform
    ? 'node .\\bin\\cli.js'
    : './bin/cli.js'
)

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
  return new Promise((resolve, reject) => {
    const output = {
      stdout: [],
      stderr: []
    }

    const proc = childProcess.spawn(
      cmd,
      {
        cwd: process.cwd(),
        shell: true
      }
    )

    proc.stdout.on('data', (data) => {
      console.log(data.toString()) // this is to indicate actual progress as the tests are running
      output.stdout.push(data)
    })

    proc.stderr.on('data', (data) => {
      console.error(data.toString()) // (same)
      output.stderr.push(data)
    })

    proc.on('exit', (code, signal) => {
      output.code = code
      resolve(output)
    })
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
        isWindowsPlatform
          ? `type ${pathToValidSampleXmlFile} | ${callee}`
          : `cat ${pathToValidSampleXmlFile} | ${callee}`
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

      return runChildProcess(`${callee} ${pathToInvalidSampleXmlFile}`)
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
      const expected = `Validating XML from path "${pathToInvalidSampleXmlFile}"...

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
