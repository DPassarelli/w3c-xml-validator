import { Given } from '@cucumber/cucumber'

Given(
  'an empty input',
  function () {
    this.inputs = [undefined, null, '']
  }
)
