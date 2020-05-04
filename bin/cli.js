#!/usr/bin/env node

const path = require('path')
const util = require('util')
const readFileAsync = util.promisify(require('fs').readFile)

const validate = require('../main.js')

const args = process.argv.slice(2)

/**
 * [outputResults description]
 * @param  {[type]} result [description]
 * @return {undefined}
 */
function outputResults (result) {
  if (result.isValid) {
    console.log('Congratulations, the provided XML is well-formed and valid, according to the DTD at %s', result.doctype)
    console.log('')

    if (result.warnings.length > 0) {
      console.log('However, please note the following warnings:')
      result.warnings.forEach((msg) => { console.log(' * %s', msg) })
    }

    console.log('')

    process.exit()
  }

  console.log('Unfortunately, the provided XML does not validate according to the DTD at %s', result.doctype)
  console.log('')
  console.log('The following errors were reported:')

  result.errors.forEach((msg) => { console.log(' * %s', msg) })

  if (result.warnings.length > 0) {
    console.log('')
    console.log('Also, please note the following warnings:')
    result.warnings.forEach((msg) => { console.log(' * %s', msg) })
  }

  console.log('')

  process.exit(1)
}

/**
 * MAIN ALGORITHM
 */
if (args.length === 0) {
  console.log('Validating XML from stdin...')
  console.log('')

  const input = []

  process.stdin.on('readable', () => {
    const data = process.stdin.read()
    if (data != null) input.push(data)
  })

  process.stdin.on('end', () => {
    validate(input.join(''))
      .then(outputResults)
      .catch((err) => {
        console.log(err)
        process.exit()
      })
  })
} else {
  console.log('Validating XML from path %s...', path.resolve(args[0]))
  console.log('')

  readFileAsync(path.resolve(args[0]))
    .then((contents) => {
      return validate(contents.toString())
    })
    .then(outputResults)
    .catch((err) => {
      console.log(err)
      process.exit()
    })
}
