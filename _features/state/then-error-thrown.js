import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'
// import { isMatch } from 'matcher'

Then(
  'it should throw an error stating',
  function (docString) {
    // this.inputValue && this.returnValue (single)
    //
    // returnValue(s) can be literal data or an instance of <Error>
    //
    // assemble an array of objects to compare:
    // [{
    //  input:
    //  expected:
    //  actual:
    // }]
    const listOfExpectedValues = []
    const listOfActualValues = []

    this.returnValues.forEach((val, idx) => {
      listOfExpectedValues.push({
        input: this.inputValues[idx],
        output: new Error(docString)
      })

      // if (docString.indexOf('%%') > -1) {
      // }

      listOfActualValues.push({
        input: this.inputValues[idx],
        output: val
      })
    })

    expect(listOfActualValues).to.deep.equal(listOfExpectedValues)
  }
  // if (this.error == null || !this.returnValues.some((val) => val instanceof Error)) {
  //   throw new Error('The exported function did not throw an error')
  // }

  //   if (this.errors.length === 1) {
  //     if (docString.indexOf('%%') > -1) {
  //       const pattern = docString.replace(/%%\w+%%/g, '*')
  //       const result = isMatch(this.errors[0].message, pattern)

  //       expect(result).to.equal(true, `the string "${this.errors[0].message}" does not match pattern "${pattern}"`)
  //     } else {
  //       expect(this.errors[0].message).to.equal(docString)
  //     }

  //     return
  //   }

  //   const actual = this.errors.map((err) => err.message)
  //   const expected = this.errors.map(() => docString)

  //   expect(actual).to.deep.equal(expected)
  // }
)
