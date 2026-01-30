import { When } from '@cucumber/cucumber'

import sut from '../../src/index.js'

When(
  'the exported function is called',
  async function () {
    this.returnValues = []

    for (let i = 0; i < this.inputValues.length; i++) {
      try {
        this.returnValues.push(await sut(this.inputValues[i], this.mockImplementationOfFetch))
      } catch (err) {
        this.returnValues.push(err)
      }
    }
  }
)
