const auth = require('../auth')

const refreshToken = async (req, res) => {
  try {
    const token = await auth.refreshToken(req.headers.authorization)
    return res.json(token)
  } catch (exc) {
    console.log('Token refresh failed', exc)
    return res.status(500).json({ message: `Token refresh failed: ${exc.message}` })
  }
}

module.exports = {
  refreshToken
}
