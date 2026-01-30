import { readFile } from 'node:fs/promises'
import { Given } from '@cucumber/cucumber'

Given(
  'an empty value',
  function () {
    this.inputValues = [undefined, null, '']
  }
)

Given(
  'a value that is not markup',
  function () {
    this.inputValues = [42, 'string that is not markup']
  }
)

Given(
  'a value that does not start with the expected XML declaration',
  function () {
    this.inputValues = ['<sentence>This is just a sentence.</sentence>']
  }
)

Given(
  'a value that is valid XML but does not contain a DTD reference',
  function () {
    this.inputValues = ['<?xml version="1.0" encoding="utf-8"?><sentence>This is just a sentence.</sentence>']
  }
)

Given(
  'a value that is valid XML, and contains a DTD reference, but is not publicly accessible',
  function () {
    this.inputValues = ['<?xml version="1.0" encoding="utf-8"?><!DOCTYPE XML SYSTEM "doesnotexist.dtd"><sentence>This is just a sentence.</sentence>']
  }
)

Given(
  'a value that is valid XML',
  async function () {
    const fileContents = await (
      readFile(
        new URL('./xml-samples/valid.xml', import.meta.url),
        'utf-8'
      )
    )

    this.inputValues = [fileContents]
  }
)
