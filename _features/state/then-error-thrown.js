import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import { isMatch } from 'matcher'

Then(
  'it should throw an error stating',
  function (docString) {
    const listOfExpectedValues = []
    const listOfActualValues = []

    this.returnValues.forEach((err, idx) => {
      listOfExpectedValues.push({
        input: this.inputValues[idx],
        output: new Error(docString)
      })

      if (docString.indexOf('%%') > -1) {
        const pattern = docString.replace(/%%\w+%%/g, '*')
        if (isMatch(err.message, pattern)) {
          listOfActualValues.push({
            input: this.inputValues[idx],
            output: new Error(docString)
          })

          return
        }
      }

      listOfActualValues.push({
        input: this.inputValues[idx],
        output: err
      })
    })

    expect(listOfActualValues).to.deep.equal(listOfExpectedValues)
  }
)
