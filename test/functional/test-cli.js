/* eslint-env mocha */

const childProcess = require('child_process')
const os = require('os')
const path = require('path')

function runChildProcess (cmd) {
  return new Promise((resolve, reject) => {
    const output = {
      stdout: [],
      stderr: []
    }

    const proc = childProcess.spawn(
      cmd,
      {
        cwd: path.join(__dirname, '../..'),
        shell: true
      }
    )

    proc.stdout.on('data', (data) => {
      console.log(data.toString()) // this is to indicate actual progress
      output.stdout.push(data)
    })

    proc.stderr.on('data', (data) => {
      console.error(data.toString()) // this is to indicate actual progress
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
      this.timeout(5000)

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
      const expected = 'Validating XML from stdin...\nCongratulations, the provided XML is well-formed and valid, according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd\nHowever, please note the following warnings:\n  * Using Direct Input mode: UTF-8 character encoding assumed\n'
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when referring to valid input as an argument', function () {
    let result = null

    before(function () {
      this.timeout(5000)
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

      const expected = `Validating XML from path ${resolvedPath}...\nCongratulations, the provided XML is well-formed and valid, according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd\nHowever, please note the following warnings:\n  * Using Direct Input mode: UTF-8 character encoding assumed\n`
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when piping invalid input', function () {
    let result = null

    before(function () {
      this.timeout(5000)

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
      const expected = 'Validating XML from stdin...\nUnfortunately, the provided XML does not validate according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd\nThe following errors were reported:\n  * required attribute &quot;payloadID&quot; not specified\n  * end tag for &quot;PunchOutOrderMessage&quot; omitted, but OMITTAG NO was specified\nAlso, please note the following warnings:\n  * Using Direct Input mode: UTF-8 character encoding assumed\n'
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when referring to invalid input as an argument', function () {
    let result = null

    before(function () {
      this.timeout(5000)
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

      const expected = `Validating XML from path ${resolvedPath}...\nUnfortunately, the provided XML does not validate according to the DTD at http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd\nThe following errors were reported:\n  * required attribute &quot;payloadID&quot; not specified\n  * end tag for &quot;PunchOutOrderMessage&quot; omitted, but OMITTAG NO was specified\nAlso, please note the following warnings:\n  * Using Direct Input mode: UTF-8 character encoding assumed\n`
      const actual = result.stdout.join('')

      expect(actual).to.equal(expected)
    })
  })

  context('when an error occurs', function () {
    const pathToSpecialFile = './test/samples/timeout'
    let result = null

    before(function () {
      this.timeout(5000)

      /**
       * It's necessary to turn off debugging here, because that will output
       * extraneous information to stderr.
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
        stdout: `Validating XML from path ${resolvedPath}...\n`,
        stderr: 'ERROR: getaddrinfo ENOTFOUND localhost:65001\n'
      }

      const actual = {
        stdout: result.stdout.join(''),
        stderr: result.stderr.join('')
      }

      expect(actual).to.deep.equal(expected)
    })
  })
})
