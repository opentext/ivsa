const readline = require('readline')
const fs = require('fs')

module.exports = {
  console(prompt, muted) {
    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      rl.askPrompt = `${prompt}: `
      // rl.outStream = fs.createWriteStream('./ask.txt');
      rl.stdoutMuted = muted

      rl.question(rl.askPrompt, function (reply) {
        rl.output.write('\n')
        rl.close()
        // rl.outStream.end();
        resolve(reply)
      })

      // TODO:BDT 7/25/2025 - CODE LOOKS INACTIVE
      /*
      rl._writeToOutput = function _writeToOutput(stringToWrite) {
        // rl.outStream.write(stringToWrite + '\n');
        if (rl.stdoutMuted) {
          const outChars = []
          const promptIX = stringToWrite.indexOf(rl.askPrompt)
          if (promptIX === 0) {
            const repLen = stringToWrite.length - rl.askPrompt.length
            if (repLen > 0) {
              for (let i = 0; i < repLen; i += 1) {
                outChars.push('*')
              }
            }
            rl.output.write(`${rl.askPrompt}${outChars.join('')}`)
          } else {
            rl.output.write('*')
          }
        } else {
          rl.output.write(stringToWrite)
        }
      }
      */
    })
  }
}
