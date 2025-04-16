
function formatBedrockAuth(res) {
  return ['authorization', `XBL3.0 x=${res.userHash};${res.XSTSToken}`]
}

module.exports = {
  formatBedrockAuth
}
