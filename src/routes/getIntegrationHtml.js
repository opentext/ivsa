const path = require('path')

const handler = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'integration.html'))
}

module.exports = handler
