# w3c-xml-validator

[![Code Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://standardjs.com/)
[![Linux Build Status](https://img.shields.io/travis/DPassarelli/w3c-xml-validator/master?label=Linux%20build&logo=travis)](https://travis-ci.org/DPassarelli/w3c-xml-validator)
[![Windows Build Status](https://img.shields.io/appveyor/build/DPassarelli/w3c-xml-validator/master?label=Windows%20build&logo=appveyor)](https://ci.appveyor.com/project/DPassarelli/w3c-xml-validator?branch=master)
 
**A Node.js library for programmatically confirming whether a given XML document is both well-formed and valid according to the specified DTD.**

![Supported Node Versions](https://img.shields.io/node/v/w3c-xml-validator?color=informational)

## Why?

I was frustrated by the lack of programmatic options for validating XML with JavaScript...in particular, when validating against a public DTD, and without requiring something like [libxml](http://www.xmlsoft.org) to be installed locally.

There are one or two other modules that come close, but they either don't meet those requirements, or aren't cross-platform. This one is!

## W3C

This library relies on the [online validator provided by W3C](https://validator.w3.org). **Please consider donating to the W3C if you find this library useful, because without their tools, this one wouldn't exist.** Click on the logo below:

[![Donate to W3C](https://www.w3.org/QA/Tools/I_heart_validator_lg)](http://w3.org/support/donate/)

## Programmatic Use

This module exports a function that accepts a single value: the XML to be validated. **The XML must contain a `!DOCTYPE` element with an publicly-accessible DTD.** The return value is a `Promise` that will be fulfilled or rejected with the values described below.

_Example:_

```javascript
const validate = require('w3c-xml-validator')
const xml = '<?xml version="1.0" encoding="utf-8"?>...'

validate(xml)
    .then(function (response) {
        // the response will contain a basic is/is not valid flag, plus warnings and errors (if present)
    })
    .catch(function (err) {
        // the promise may be rejected for any of the reasons listed below
    })
```

### Fulfillment

When the promise is fulfilled, the returned value will be a plain object with the following properties:

| Key | Data type | Notes |
|-----|-----------|-------|
| `doctype` | {String} | The DTD that the validator used. |
| `isValid` | {Boolean} | A simple yes/no based on the results from the W3C validation tool. |
| `warnings` | {Array} of {String} | This is a list of the entries under "Notes and Potential Issues". Each value is the entry title, not the verbose description. |
| `errors` | {Array} of {String} | This is a list of the entries under "Validation Output: # Error(s)". Each value is the entry title that appears in bold, not the verbose description. |

`isValid` will have the same value as `(errors.length === 0)`. `warnings` may have entries, even if the validation is successful.

### Rejection

The promise may be rejected for any of the following reasons:

* The input parameter is `undefined`, `null`, or an empty string.
* The input parameter is not markup (meaning, not XML or HTML or anything else that the validator cannot parse). In this case, there will be an error message `The remote server replied with a 307 status code.` (Personally, I think it should really be a `400` code, but 🤷)
* The W3C web site is not reachable.
* The HTTP response code is something other than `200`.

Check the `message` property of the error object to find out more information about the source of the problem. If you feel there is an issue with the code in this project, please [submit a ticket on GitHub](https://github.com/DPassarelli/w3c-xml-validator/issues) for help.

## Command Line Use

This library can also be called from the command line. The XML to validate can either be piped into the library:

(Linux or macOS)
```bash
$ cat file-to-validate.xml | npx w3c-xml-validator
```

(Windows)
```cmd
PS> type file-to-validate.xml | npx w3c-xml-validator
```

or the file name provided as an argument:

(Linux/Windows/macOS)
```bash 
$ npx w3c-xml-validator file-to-validate.xml
```

The exit code will be non-zero if `isValid === false`. Any rejections will be output to `stderr`.

## License

Please refer to `LICENSE`.
