const authapi = require('./authapi')
const router = require('express').Router()
const getIntegrationHtml = require('./getIntegrationHtml')
const getV1 = require('./getV1')

router.get('/', getIntegrationHtml)

router.get('/ivsa/api/v1', getV1), router.get('/ivsa/api/v1/refreshToken', authapi.refreshToken)

module.exports = router
