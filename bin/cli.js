#!/usr/bin/env node

const path = require('path')
const fs = require('fs').promises
const log = console.log
const validate = require('../index.js')

/**
 * [validateStdIn description]
 * @return {Promise}
 */
function validateStdIn () {
  log('Validating XML from stdin...')

  return new Promise((resolve, reject) => {
    /**
     * A list of {Buffer}s read from standard input.
     * @type {Array}
     */
    const input = []

    process.stdin.on('readable', () => {
      const data = process.stdin.read()
      if (data != null) input.push(data)
    })

    process.stdin.on('error', (err) => {
      reject(err)
    })

    process.stdin.on('end', () => {
      validate(input.join(''))
        .then(resolve)
    })
  })
}

/**
 * [validateFile description]
 * @param  {[type]} resolvedPath [description]
 * @return {Promise}
 */
function validateFile (resolvedPath) {
  log('Validating XML from path "%s"...', resolvedPath)

  return fs.readFile(resolvedPath)
    .then((contents) => {
      return validate(contents.toString())
    })
}

/**
 * [displayResult description]
 * @param  {[type]} result [description]
 * @return {undefined}
 */
function logStatusOfValidation (status) {
  log('')

  if (status.errors.length === 0) {
    log('Congratulations, the provided XML is well-formed and valid, according to the DTD at "%s"', status.dtd)

    if (status.warnings.length > 0) {
      log('')
      log('However, please note the following warnings:')
      status.warnings.forEach((msg) => { log('  -', msg) })
    }
  } else {
    log('Unfortunately, the provided XML does not validate according to the DTD at "%s"', status.dtd)
    log('')
    log('The following errors were reported:')

    status.errors.forEach((msg) => { log('  ✘', msg) })

    if (status.warnings.length > 0) {
      log('')
      log('Also, please note the following warnings:')
      status.warnings.forEach((msg) => { log('  -', msg) })
    }
  }
}

/**
 * Entry point.
 * @return {undefined}
 */
async function main () {
  let validationResult = null
  const args = process.argv.slice(2)

  try {
    if (args.length === 0) {
      validationResult = await validateStdIn()
    } else {
      const resolvedPath = path.resolve(args[0])
      validationResult = await validateFile(resolvedPath)
    }

    logStatusOfValidation({
      dtd: validationResult.doctype,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    })

    if (validationResult.errors.length > 0) {
      process.exit(1)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
