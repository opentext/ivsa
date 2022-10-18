const pkg = require('../../package.json')

const getVersion = (req, res) => {
  const semVer = pkg.version.split('.')
  res.type('application/hal+json').json({
    version: pkg.version,
    major: semVer[0],
    minor: semVer[1],
    patch: semVer[2],
    _links: {
      self: { href: `${req.protocol}://${req.headers.host}/filesvr/api/v1/version` }
    }
  })
}

module.exports = {
  getVersion
}
