const fs = require('fs')
const FormData = require('form-data')
const path = require('path')
const mime = require('mime')
const axios = require('axios')
const pt = require('../publishingtarget')

const testTenant = 'cfc6aeb1-628a-478b-b9d6-e77ac2d18d60'

const stagePublicationSourceForQV = async (token, filePath) => {
  const jwt = token && token.replace('Bearer ', '')
  const stats = fs.statSync(filePath)
  const mimetype = mime.lookup(filePath)
  const parsedPath = path.parse(filePath)
  const form = new FormData()
  const data = {
    filepath: path.resolve(filePath),
    contentType: mimetype,
    knownLength: stats.size
  }
  form.append('file', fs.createReadStream(filePath), data)

  const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  const tid = jwtPayload.tid || jwtPayload.tenant_id || testTenant
  const cid = jwtPayload.cid
  const publishingTarget = pt.getPublishingTarget(tid)
  let entry
  try {
    const cssResp = await axios({
      method: 'POST',
      url: `${process.env.CSS_AUTHORITY}/v3/files/fromStream?tenant=${tid}`,
      data: form,
      headers: {
        ...form.getHeaders(),
        authorization: token,
        'Content-Length': form.getLengthSync()
      },
      maxContentLength: 500 * 1024 * 1024 * 1024, // 500 GB
      maxBodyLength: 500 * 1024 * 1024 * 1024 //500 GB
    })
    entry = cssResp.data
  } catch (exc) {
    console.log('Unable to upload file to CSSv3', exc)
    throw new Error('Exception encountered trying to upload a file to cssv3', { cause: exc })
  }

  const accessPolicy = {
    resource: `/v3/files/${entry.id}`,
    clientAccess: {
      roleAssignments: [
        { principal: { cid }, role: 'resource.owner' },
        { principal: { cid: 'blazon-publication-service' }, role: 'resource.reader' },
        { principal: { cid: 'blazon-publisher' }, role: 'resource.reader' },
        { principal: { grp: 'role_service@otds.admin' }, role: 'resource.reader' }
      ]
    }
  }

  await axios({
    method: 'PATCH',
    url: `${process.env.RAS_AUTHORITY}/v1/namespaces/files/resourceAccessPolicy?resource=/v3/files/${entry.id}`,
    data: accessPolicy,
    headers: {
      authorization: token,
      Accept: '*/*',
      'Content-Type': 'application/merge-patch+json'
    }
  })

  return {
    id: entry.id,
    mimeType: entry.mimeType,
    fileName: entry.originalFileName,
    _links: { download: { href: `${process.env.CSS_AUTHORITY}/v3/files/${entry.id}/stream` } }
  }
}

const stagePublicationSource = async (token, filePath) => {
  const jwt = token && token.replace('Bearer ', '')
  const stats = fs.statSync(filePath)
  const mimetype = mime.lookup(filePath)
  const parsedPath = path.parse(filePath)
  const form = new FormData()
  const data = {
    filepath: path.resolve(filePath),
    contentType: mimetype,
    knownLength: stats.size
  }
  form.append('file', fs.createReadStream(filePath), data)

  const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  const tid = jwtPayload.tid || jwtPayload.tenant_id || testTenant
  const cid = jwtPayload.cid
  const publishingTarget = pt.getPublishingTarget(tid)
  let entry
  try {
    const cssResp = await axios({
      method: 'POST',
      url: `${process.env.CSS_AUTHORITY}/v3/files/fromStream?tenant=${tid}`,
      data: form,
      headers: {
        ...form.getHeaders(),
        authorization: token,
        'Content-Length': form.getLengthSync()
      },
      maxContentLength: 500 * 1024 * 1024 * 1024, // 500 GB
      maxBodyLength: 500 * 1024 * 1024 * 1024 //500 GB
    })
    entry = cssResp.data
  } catch (exc) {
    console.log('Unable to upload file to CSSv3', exc)
    throw new Error('Exception encountered trying to upload a file to cssv3', { cause: exc })
  }

  const accessPolicy = {
    resource: `/v3/files/${entry.id}`,
    clientAccess: {
      roleAssignments: [
        { principal: { cid }, role: 'resource.owner' },
        { principal: { cid: 'blazon-publication-service' }, role: 'resource.reader' },
        { principal: { cid: 'blazon-publisher' }, role: 'resource.reader' },
        { principal: { grp: 'role_service@otds.admin' }, role: 'resource.reader' }
      ]
    }
  }

  await axios({
    method: 'PATCH',
    url: `${process.env.RAS_AUTHORITY}/v1/namespaces/files/resourceAccessPolicy?resource=/v3/files/${entry.id}`,
    data: accessPolicy,
    headers: {
      authorization: token,
      Accept: '*/*',
      'Content-Type': 'application/merge-patch+json'
    }
  })

  return {
    id: entry.id,
    url: `${process.env.CSS_AUTHORITY}/v3/files/${entry.id}/stream`,
    formatHint: mime.extension(entry.mimeType),
    filenameHint: parsedPath.name,
    publishingTarget: {
      target: publishingTarget
    }
  }
}

const cleanPublicationSource = async (token, publicationConfigs) => {
  // if (publicationConfigs) {
  //   publicationConfigs.forEach(async (pc) => {
  //     if (pc.url) {
  //       try {
  //         await axios({
  //           method: 'DELETE',
  //           url: pc.url,
  //           headers: {
  //             authorization: token
  //           }
  //         })
  //       } catch (exc) {
  //         console.log('Unable to delete file from CSS', exc)
  //       }
  //     }
  //   })
  // }

  return
}

module.exports = {
  stagePublicationSourceForQV,
  stagePublicationSource,
  cleanPublicationSource
}
