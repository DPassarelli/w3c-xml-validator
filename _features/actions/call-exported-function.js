import { When } from '@cucumber/cucumber'

import sut from '../../src/index.js'

When(
  'the exported function is called',
  async function () {
    this.results = []
    this.errors = []

    if (!Array.isArray(this.inputs)) {
      this.inputs = [this.input]
    }

    for (const value of this.inputs) {
      try {
        this.results.push(await sut(value))
      } catch (err) {
        this.errors.push(err)
      }
    }
  }
)
