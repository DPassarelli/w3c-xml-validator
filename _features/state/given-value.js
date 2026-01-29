import { Given } from '@cucumber/cucumber'

Given(
  'an empty value',
  function () {
    this.inputs = [undefined, null, '']
  }
)

Given(
  'a value that is not markup',
  function () {
    this.inputs = [42, 'This is just a sentence.']
  }
)

Given(
  'a value that does not start with the expected XML declaration',
  function () {
    this.input = '<sentence>This is just a sentence.</sentence>'
  }
)

Given(
  'a value that is valid XML but does not contain a DTD reference',
  function () {
    this.input = '<?xml version="1.0" encoding="utf-8"?><sentence>This is just a sentence.</sentence>'
  }
)

// Given(
//   'a value that is valid XML, and contains a DTD reference, but is not publicly accessible',
//   function () {
//     this.input = '<sentence>This is just a sentence.</sentence>'
//   }
// )
