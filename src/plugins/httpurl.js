const mime = require('mime')
const args = require('../args')
const pt = require('../publishingtarget')

const testTenant = 'cfc6aeb1-628a-478b-b9d6-e77ac2d18d60'

const stagePublicationSourceForQV = async (token, httpFileURL) => {
  var fileName = args.options.filenamehint
    ? args.options.filenamehint
    : httpFileURL.substring(httpFileURL.lastIndexOf('/') + 1)
  const mimeType = mime.lookup(fileName)
  const name = fileName.split('.')[0]
  const jwt = token && token.replace('Bearer ', '')
  const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  const tid = jwtPayload.tid || testTenant

  return {
    id: httpFileURL,
    mimeType: mimeType,
    fileName: name,
    _links: {
      download: { href: httpFileURL }
    }
  }
}

const stagePublicationSource = async (token, httpFileURL) => {
  var fileName = args.options.filenamehint
    ? args.options.filenamehint
    : httpFileURL.substring(httpFileURL.lastIndexOf('/') + 1)
  const mimeType = mime.lookup(fileName)
  const name = fileName.split('.')[0]
  const jwt = token && token.replace('Bearer ', '')
  const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  const tid = jwtPayload.tid || testTenant

  return {
    id: httpFileURL,
    url: httpFileURL,
    formatHint: mime.extension(mimeType),
    filenameHint: name,
    publishingTarget: {
      target: pt.getPublishingTarget(tid)
    }
  }
}

const cleanPublicationSource = async (token, publicationConfig) => {}

module.exports = {
  stagePublicationSourceForQV,
  stagePublicationSource,
  cleanPublicationSource
}
