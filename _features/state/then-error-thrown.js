import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'

Then(
  'it should throw an error stating',
  function (docString) {
    if (this.errors.length === 0) {
      throw new Error('The exported function did not throw an error')
    }

    if (this.errors.length === 1) {
      expect(this.errors[0].message).to.equal(docString)
      return
    }

    const actual = this.errors.map((err) => err.message)
    const expected = this.errors.map(() => docString)

    expect(actual).to.deep.equal(expected)
  }
)
