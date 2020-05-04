/* eslint-env mocha */

const childProcess = require('child_process')
const path = require('path')

describe('the command-line interface', function () {
  context('when piping the input', function () {
    it('must return a zero exit code if the XML is valid', function (done) {
      const proc = childProcess.spawn(
        'cat ./test/samples/valid.xml | w3c-xml-validator',
        {
          stdio: 'inherit',
          shell: true,
          cwd: path.join(__dirname, '../..')
        }
      )

      proc.on('exit', (code, signal) => {
        try {
          const expected = 0
          const actual = code

          expect(actual).to.equal(expected)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  context('when referring to the input as an argument', function () {

  })
})
