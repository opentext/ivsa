const router = require('express').Router()

const admin = require('./admin')
const filestore = require('./filestore')

router.get('/filesvr/api/v1/version', admin.getVersion)
router.post('/filesvr/api/v1/content', filestore.upload)
router.get('/filesvr/api/v1/content/:fileName', filestore.download)
router.head('/filesvr/api/v1/content/:fileName', filestore.access)

module.exports = router
