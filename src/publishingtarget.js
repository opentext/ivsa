require('dotenv').config()

const getPublishingTarget = (tid) => {
  const plugin = process.env.FILESTORE_PLUGIN
  let publishingTarget = process.env.PUBLISHING_TARGET
  if (publishingTarget) {
    publishingTarget = publishingTarget.replace(/\$tid/g, tid)
  } else {
    switch (plugin) {
      case 'httpurl':
        publishingTarget = ''
        break
      case 'cssv2':
        publishingTarget = process.env.CSS_AUTHORITY + '/v2/tenant/' + tid + '/content'
        break
      case 'cssv3':
        publishingTarget = 'css-v3://upload?authzPolicy=delegateToSource'
        break
      default:
        break
    }
  }
  return publishingTarget
}

module.exports = {
  getPublishingTarget
}
