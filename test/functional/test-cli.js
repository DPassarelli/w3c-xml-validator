/* eslint-env mocha */

const childProcess = require('child_process')
const os = require('os')
const path = require('path')

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
        cwd: path.join(__dirname, '../..'), // this should be the project root
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

const pathToValidSampleXmlFile = './test/samples/valid.xml'
const pathToInvalidSampleXmlFile = './test/samples/invalid.xml'

describe('the command-line interface', function () {
  context('when piping valid input', function () {
    let result = null

    before(function () {
      this.timeout(8000) // sometimes the request to W3C takes a bit longer than the default timeout of 2 sec

      const cmd = (
        os.platform() === 'win32'
          ? `echo ${pathToValidSampleXmlFile} | ./bin/cli.js`
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
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when referring to valid input as an argument', function () {
    let result = null

    before(function () {
      this.timeout(8000)
      return runChildProcess(`./bin/cli.js ${pathToValidSampleXmlFile}`)
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
      const resolvedPath = path.resolve(pathToValidSampleXmlFile)

      const expected = `
Validating XML from path ${resolvedPath}...

Congratulations, the provided XML is well-formed and valid, according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd

However, please note the following warnings:
  - Using Direct Input mode: UTF-8 character encoding assumed
`
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when piping invalid input', function () {
    let result = null

    before(function () {
      this.timeout(8000)

      const cmd = (
        os.platform() === 'win32'
          ? `echo ${pathToInvalidSampleXmlFile} | ./bin/cli.js`
          : `cat ${pathToInvalidSampleXmlFile} | ./bin/cli.js`
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
Validating XML from stdin...

Unfortunately, the provided XML does not validate according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd

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

  context('when referring to invalid input as an argument', function () {
    let result = null

    before(function () {
      this.timeout(8000)
      return runChildProcess(`./bin/cli.js ${pathToInvalidSampleXmlFile}`)
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
      const resolvedPath = path.resolve(pathToInvalidSampleXmlFile)

      const expected = `
Validating XML from path ${resolvedPath}...

Unfortunately, the provided XML does not validate according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd

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

  context('when an error occurs', function () {
    const pathToSpecialFile = './test/samples/timeout'
    let result = null

    before(function () {
      this.timeout(8000)

      /**
       * It's necessary to turn off debugging here, because that will output
       * extraneous information to stderr and cause a false failure.
       */
      const cmd = (
        os.platform() === 'win32'
          ? `SET DEBUG=off && ./bin/cli.js ${pathToSpecialFile}`
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
      const resolvedPath = path.resolve(pathToSpecialFile)

      const expected = {
        stdout: `
Validating XML from path ${resolvedPath}...
`,
        stderr: 'ERROR: getaddrinfo ENOTFOUND'
      }

      const actual = {
        stdout: result.stdout.join(''),
        stderr: result.stderr.join('').substring(0, expected.stderr.length)
      }

      expect(actual).to.deep.equal(expected)
    })
  })
})
