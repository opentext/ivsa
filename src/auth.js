require('dotenv').config()
const endpoints = require('./endpoints')
const fs = require('fs')
const axios = require('axios')
const ask = require('./ask')

let tokenCache = {}

const getLoginUser = async (user) => {
  if (user) {
    return user
  }

  return ask.console('Login User', false)
}

const getPassword = async (password) => {
  if (password) {
    return password
  }

  return ask.console('Password', true)
}

const getUserCreds = async (user, password) => {
  const creds = {}
  creds.grant = 'password'
  creds.cid = process.env.OAUTH_CLIENT
  creds.username = await getLoginUser(user)
  creds.password = await getPassword(password)
  return creds
}

const getClientCreds = async (cid, secret) => {
  const creds = {}
  creds.grant = 'client_credentials'
  creds.cid = process.env.OAUTH_CLIENT
  creds.secret = process.env.OAUTH_SECRET
  return creds
}

const setWindowToken = (otdsToken) => {
  tokenCache = otdsToken
  const windowToken = {
    access_token: `${otdsToken.token_type} ${otdsToken.access_token}`,
    expires: otdsToken.expires_in
  }

  fs.writeFileSync(
    `${process.cwd()}/src/public/auth.js`,
    `window.accessToken="${windowToken.access_token}"\n` +
      `window.accessTokenExpires="${windowToken.expires}"`
  )

  return windowToken
}

const refreshToken = async (token) => {
  const rawToken = token.replace('Bearer ', '')
  if (rawToken !== tokenCache.access_token) {
    console.log('Unable to refresh token due to token missmatch')
    throw new Error('Unable to refresh token due to token missmatch')
  }

  let windowToken = {}
  if (process.env.OAUTH_SECRET) {
    const creds = await getClientCreds()
    const token = await getToken(creds)
    windowToken = setWindowToken(token)
  } else {
    try {
      const resp = await axios({
        method: 'POST',
        url: `${process.env.OTDS_ORIGIN}${endpoints.tokenPath}`,
        data: `grant_type=refresh_token&client_id=${process.env.OAUTH_CLIENT}&refresh_token=${tokenCache.refresh_token}`,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      windowToken = setWindowToken(resp.data)
    } catch (exc) {
      console.log('Unable to refresh OTDS token', exc)
      throw new Error(
        `Exception encountered trying to refresh OTDS token: ${exc.message || 'Unexpected error'}`
      )
    }
  }

  return windowToken
}

const getToken = async (creds) => {
  let token = {}

  try {
    const params =
      creds.grant === 'password'
        ? `&client_id=${encodeURIComponent(creds.cid)}&username=${encodeURIComponent(
            creds.username
          )}&password=${encodeURIComponent(creds.password)}`
        : `&client_id=${encodeURIComponent(creds.cid)}&client_secret=${encodeURIComponent(
            creds.secret
          )}`

    const resp = await axios({
      method: 'POST',
      url: `${process.env.OTDS_ORIGIN}${endpoints.authorizePath}`,
      data: `grant_type=${encodeURIComponent(creds.grant)}${params}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    token = resp.data
  } catch (exc) {
    console.log('Unable to authenticate', exc)
    throw new Error(
      `Exception encountered trying to authenticate with OTDS: ${exc.message || 'Unexpected error'}`
    )
  }

  return token
}

const login = async (user, password) => {
  let creds
  if (process.env.OAUTH_SECRET) {
    creds = await getClientCreds()
  } else {
    creds = await getUserCreds(user, password)
  }
  console.log(`Authenticating with ${creds.grant} grant`)
  tokenCache = await getToken(creds)
  return setWindowToken(tokenCache)
}

module.exports = {
  login,
  refreshToken
}
