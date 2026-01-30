import { Given } from '@cucumber/cucumber'

Given(
  'the remote server is unreachable',
  function () {
    this.mockImplementationOfFetch = async function () {
      throw new TypeError('UNREACHABLE')
    }
  }
)
