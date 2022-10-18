const fs = require('fs')
const FormData = require('form-data')
const path = require('path')
const mime = require('mime')
const axios = require('axios')
const pt = require('../publishingtarget')

const testTenant = 'cfc6aeb1-628a-478b-b9d6-e77ac2d18d60'

const stagePublicationSource = async (token, filePath) => {
  const stats = fs.statSync(filePath)
  const mimeType = mime.lookup(filePath)
  const parsedPath = path.parse(filePath)
  const jwt = token && token.replace('Bearer ', '')
  const form = new FormData()
  const data = {
    filepath: path.resolve(filePath),
    contentType: mimeType,
    knownLength: stats.size
  }
  form.append('file', fs.createReadStream(filePath), data)

  const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  const tid = jwtPayload.tid || testTenant

  let entry
  try {
    const resp = await axios({
      method: 'POST',
      url: `${process.env.CSS_AUTHORITY}/v2/tenant/${tid}/content`,
      data: form,
      headers: {
        ...form.getHeaders(),
        authorization: token,
        'Content-Length': form.getLengthSync()
      },
      maxContentLength: 500 * 1024 * 1024 * 1024, // 500 GB
      maxBodyLength: 500 * 1024 * 1024 * 1024 //500 GB
    })

    entry = resp.data.entries[0]
  } catch (exc) {
    console.log('Unable to upload file to CSSv2', exc)
    throw new Error('Exception encountered trying to upload a file to cssv2', { cause: exc })
  }

  return {
    id: entry.id,
    url: entry._links.download.href,
    formatHint: mime.extension(entry.mimeType),
    filenameHint: parsedPath.name,
    publishingTarget: {
      target: pt.getPublishingTarget(tid)
    }
  }
}

const cleanPublicationSource = async (token, publicationConfigs) => {
  // THIS LOOKS LIKE A TODO BEFORE I GOT HERE
  // if (publicationConfig && !publicationConfig.url) {
  //   return
  // }

  // try {
  //   await axios({
  //     method: 'DELETE',
  //     url: publicationConfig.url,
  //     headers: {
  //       authorization: token,
  //     }
  //   })
  // } catch(exc) {
  //   console.log('Unable to delete file from CSS', exc)
  // }

  return
}

module.exports = {
  stagePublicationSource,
  cleanPublicationSource
}
