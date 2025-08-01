const childProcess = require('child_process')

/**
 * Spawns a child process to run the given CLI command. The return code, and
 * outputs of `stdout` and `stderr`, are captured for later analysis.
 *
 * @param  {String}   cmd   The command to run, which will be executed in a
 *                          shell context.
 *
 * @return {Promise}        Resolving to an object with properties `code`,
 *                          `stdin` and `stderr`.
 */
function exported (cmd) {
  return new Promise((resolve, reject) => {
    const output = {
      stdout: [],
      stderr: []
    }

    const proc = childProcess.spawn(cmd, { cwd: process.cwd(), shell: true })

    proc.stdout.on('data', (data) => {
      const stringValue = data.toString()
      console.log(stringValue) // this is to indicate actual progress as the tests are running
      output.stdout.push(stringValue)
    })

    proc.stderr.on('data', (data) => {
      const stringValue = data.toString()
      console.error(stringValue) // (same)
      output.stderr.push(stringValue)
    })

    proc.on('error', (err) => {
      reject(err)
    })

    proc.on('exit', (code, signal) => {
      output.code = code
      resolve(output)
    })
  })
}

module.exports = exported
