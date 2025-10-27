const path = require('path')

const handler = (req, res) => {
  console.log("requested integration.html", req.path)
  req.path === '/ivview' ?
  res.sendFile(path.join(__dirname, '..', 'public', 'integrationIVView.html'))
  : res.sendFile(path.join(__dirname, '..', 'public', 'integration.html'))
}

module.exports = handler
