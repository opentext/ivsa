const fs = require('fs')
const FormData = require('form-data')
const path = require('path')
const mime = require('mime')
const axios = require('axios')

const stagePublicationSourceForQV = async (token, filePath) => {
  const stats = fs.statSync(filePath)
  const mimeType = mime.lookup(filePath)
  const parsedPath = path.parse(filePath)
  const form = new FormData()
  const data = {
    filepath: path.resolve(filePath),
    contentType: mimeType,
    knownLength: stats.size
  }
  form.append('file', fs.createReadStream(filePath), data)

  let uplfile = ''
  try {
    const resp = await axios({
      method: 'POST',
      url: `${process.env.FILESVR_AUTHORITY}/filesvr/api/v1/content`,
      data: form,
      headers: {
        ...form.getHeaders(),
        authorization: token,
        'Content-Length': form.getLengthSync()
      },
      maxContentLength: 500 * 1024 * 1024 * 1024, // 500 GB
      maxBodyLength: 500 * 1024 * 1024 * 1024 //500 GB
    })
    uplfile = resp.data.filename
  } catch (exc) {
    console.log('Unable to upload file to filesvr', exc)
    throw new Error('Exception encountered trying to upload a file to filesvr', { cause: exc })
  }

  return {
    id: parsedPath.base,
    mimeType: mimeType,
    fileName: filePath,
    _links: {
      download: { href: `${process.env.FILESVR_AUTHORITY}/filesvr/api/v1/content/${uplfile}` }
    }
  }
}

const stagePublicationSource = async (token, filePath) => {
  const stats = fs.statSync(filePath)
  const mimeType = mime.lookup(filePath)
  const parsedPath = path.parse(filePath)
  const form = new FormData()
  const data = {
    filepath: path.resolve(filePath),
    contentType: mimeType,
    knownLength: stats.size
  }
  form.append('file', fs.createReadStream(filePath), data)

  let uplfile = ''
  try {
    const resp = await axios({
      method: 'POST',
      url: `${process.env.FILESVR_AUTHORITY}/filesvr/api/v1/content`,
      data: form,
      headers: {
        ...form.getHeaders(),
        authorization: token,
        'Content-Length': form.getLengthSync()
      },
      maxContentLength: 500 * 1024 * 1024 * 1024, // 500 GB
      maxBodyLength: 500 * 1024 * 1024 * 1024 //500 GB
    })
    uplfile = resp.data.filename
  } catch (exc) {
    console.log('Unable to upload file to filesvr', exc)
    throw new Error('Exception encountered trying to upload a file to filesvr', { cause: exc })
  }

  return {
    id: parsedPath.base,
    url: `${process.env.FILESVR_AUTHORITY}/filesvr/api/v1/content/${uplfile}`,
    formatHint: parsedPath.ext.substring(1),
    filenameHint: parsedPath.name,
    publishingTarget: {}
  }
}

const cleanPublicationSource = async (token, publicationConfigs) => {}

module.exports = {
  stagePublicationSourceForQV,
  stagePublicationSource,
  cleanPublicationSource
}
