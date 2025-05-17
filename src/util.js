const fs = require('fs')
const path = require('path')
const util = require('util')
const archiver = require('archiver')

function formatBedrockAuth(res) {
  return ['authorization', `XBL3.0 x=${res.userHash};${res.XSTSToken}`]
}

async function createZip(sourceDir, outputZipPath) {
  const mkdir = util.promisify(fs.mkdir)
  await mkdir(path.dirname(outputZipPath), { recursive: true })

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}


module.exports = {
  formatBedrockAuth,
  createZip
}
