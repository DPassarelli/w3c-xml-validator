#!/usr/bin/env node

const path = require('path')
const util = require('util')
const readFileAsync = util.promisify(require('fs').readFile)

const validate = require('../main.js')

const args = process.argv.slice(2)

/**
 * Sends the results to the console, with additional verbiage to provide visual
 * feedback and enhance usability.
 *
 * @param  {Object}   result   The value returned by the main module in this
 *                             library.
 *
 * @return {undefined}
 */
function outputResults (result) {
  if (result.isValid) {
    console.log('Congratulations, the provided XML is well-formed and valid, according to the DTD at %s', result.doctype)

    if (result.warnings.length > 0) {
      console.log('However, please note the following warnings:')
      result.warnings.forEach((msg) => { console.log('  * %s', msg) })
    }

    process.exit()
  }

  console.log('Unfortunately, the provided XML does not validate according to the DTD at %s', result.doctype)
  console.log('The following errors were reported:')

  result.errors.forEach((msg) => { console.log('  * %s', msg) })

  if (result.warnings.length > 0) {
    console.log('Also, please note the following warnings:')
    result.warnings.forEach((msg) => { console.log('  * %s', msg) })
  }

  process.exit(1)
}

/**
 * MAIN ALGORITHM
 */
if (args.length === 0) {
  console.log('Validating XML from stdin...')

  /**
   * A list of {Buffer}s read from standard input.
   * @type {Array}
   */
  const input = []

  process.stdin.on('readable', () => {
    const data = process.stdin.read()
    if (data != null) input.push(data)
  })

  process.stdin.on('end', () => {
    validate(input.join(''))
      .then(outputResults)
      .catch((err) => {
        console.error(`ERROR: ${err.message}`)
        process.exit(1)
      })
  })
} else {
  console.log('Validating XML from path %s...', path.resolve(args[0]))

  readFileAsync(path.resolve(args[0]))
    .then((contents) => {
      return validate(contents.toString())
    })
    .then(outputResults)
    .catch((err) => {
      console.error(`ERROR: ${err.message}`)
      process.exit(1)
    })
}
