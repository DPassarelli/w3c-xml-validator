#!/usr/bin/env node

const path = require('path')
const fs = require('fs').promises
const log = console.log
const validateFn = require('../index.js')

/**
 * Returns the data piped into this process on stdin.
 *
 * @return {Promise}
 */
function captureInputFromStdIn () {
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
      resolve(input.join(''))
    })
  })
}

/**
 * Returns the contents of the specified file.
 *
 * @param  {String}   p   The path to the file.
 *
 * @return {Promise}
 */
function captureInputFromFile (p) {
  const resolvedPath = path.resolve(p)

  log('Validating the file at "%s"...', resolvedPath)
  return fs.readFile(resolvedPath)
}

/**
 * Outputs the results of the XML validation to the log.
 *
 * @return {undefined}
 */
function logResultOfXmlValidation (dtd, warnings, errors) {
  log('')

  if (errors.length === 0) {
    log('Congratulations, the provided XML is well-formed and valid, according to the DTD at "%s"', dtd)

    if (warnings.length > 0) {
      log('')
      log('However, please note the following warnings:')
      warnings.forEach((msg) => { log('  -', msg) })
    }
  } else {
    log('Unfortunately, the provided XML does not validate according to the DTD at "%s"', dtd)
    log('')
    log('The following errors were reported:')

    errors.forEach((msg) => { log('  ✘', msg) })

    if (warnings.length > 0) {
      log('')
      log('Also, please note the following warnings:')
      warnings.forEach((msg) => { log('  -', msg) })
    }
  }
}

/**
 * Entry point.
 * @return {undefined}
 */
async function main () {
  let xml = ''
  const args = process.argv.slice(2)

  try {
    if (args.length === 0) {
      xml = await captureInputFromStdIn()
    } else {
      xml = await captureInputFromFile(args[0])
    }

    const validationResult = await validateFn(xml)

    logResultOfXmlValidation(
      validationResult.doctype,
      validationResult.warnings,
      validationResult.errors
    )

    if (validationResult.errors.length > 0) {
      process.exit(1)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
