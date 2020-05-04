# w3c-xml-validator

[![Linux Build Status](https://img.shields.io/travis/DPassarelli/w3c-xml-validator/master?label=Linux%20build&logo=travis)](https://travis-ci.org/DPassarelli/w3c-xml-validator)
[![Windows Build Status](https://img.shields.io/appveyor/build/DPassarelli/w3c-xml-validator/master?label=Windows%20build&logo=appveyor)](https://ci.appveyor.com/project/DPassarelli/w3c-xml-validator)
[![Coverage Status](https://img.shields.io/coveralls/github/DPassarelli/w3c-xml-validator/master?logo=coveralls)](https://coveralls.io/github/DPassarelli/w3c-xml-validator?branch=master)

**A Node.js library for programmatically confirming whether a given XML document is both well-formed and valid according to the specified DTD.**

This project adheres to the `standard` coding style (click below for more information):

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard#javascript-standard-style)

## Why?

I was frustrated by the lack of programmatic options for validating XML with JavaScript...in particular, for validating against a public DTD. I realize that there may not be a big need for this across the Node.js community as a whole, but nonetheless it is something I required, so I built this.

## W3C

This library relies on the [online validator provided by W3C](https://validator.w3.org). **Please consider donating to the W3C if you find this library useful, because without their tools, this one wouldn't exist.** Click on the logo below:

[![Donate to W3C Dev Tools](https://www.w3.org/QA/Tools/I_heart_validator_lg)](http://w3.org/support/donate/?recipient=w3cdevs)

## Use

This module exports a function that accepts a single value: the XML to be validated. **The XML must contain a `!DOCTYPE` element with an publicly-accessible DTD.** The return value is a `Promise` that will be fulfilled or rejected with the values described below.

_Example:_

```(javascript)
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

The fulfillment value is a plain object with the following properties:

| Key | Data type | Notes |
|-----|-----------|-------|
| `isValid` | {Boolean} | A simple yes/no based on the results from the W3C validation tool. |
| `warnings` | {Array} of {String} | This is a list of the entries under "Notes and Potential Issues". Each value is the entry title, not the verbose description. |
| `errors` | {Array} of {String} | This is a list of the entries under "Validation Output: # Error(s)". Each value is the entry title that appears in bold, not the verbose description. |

`isValid` will have the same value as `(errors.length === 0)`. `warnings` may have entries, even if the validation is successful.

### Rejection

The promise may be rejected for any of the following reasons:

* The input parameter is `undefined`, `null`, or an empty string.
* The W3C web site is not reachable.
* The W3C web site is not functioning (for example, returns a 5xx HTTP status code).
* The code in this library has a bug that causes the W3C web site to return a 3xx or 4xx HTTP status code.

Check the `message` property of the error object to find out more information about the source of the problem. If you feel there is an issue with the code in this project, please [submit a ticket on GitHub](https://github.com/DPassarelli/w3c-xml-validator/issues) for help.

## License

Please refer to `LICENSE`.
