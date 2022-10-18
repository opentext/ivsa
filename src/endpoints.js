require('dotenv').config()

/* istanbul ignore next */
module.exports = {
  tokenPath: process.env.OTDS_TOKEN_PATH || '/otdsws/oauth2/token',
  authorizePath: process.env.OTDS_AUTHORIZE_PATH || '/otdsws/login',
  revokePath: process.env.OTDS_REVOKE_PATH || '/otdsws/oauth2/revoke',
  apiPath: process.env.OTDS_API_PATH || '/otdsws/rest'
}
