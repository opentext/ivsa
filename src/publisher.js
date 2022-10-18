require('dotenv').config()
const fs = require('fs')
const fsp = require('fs').promises
const axios = require('axios')
const args = require('./args')
const { publicationDB } = require('./publicationdb')
const fileStore = require(`./plugins/${process.env.FILESTORE_PLUGIN}`)

const files = {}

const hashIt = (s) =>
  s.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)
const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const createPublicationRequest = ({ policy, tags, sources, target, featureSettings }) => {
  const sourceTargetSettings = [
    {
      feature: { namespace: 'opentext.publishing.sources', name: 'LoadSources' },
      path: '/documents',
      value: sources //[{ url: cssfile.downloadLink, formatHint: formatHint, filenameHint: 'hint' }]
    }
  ]
  if (target) {
    sourceTargetSettings.push({
      feature: { namespace: 'opentext.publishing.execution', name: 'SetPublishingTarget' },
      path: '/publishingTarget',
      value: target
    })
  }

  return {
    publicationVersion: '1.0.0',
    policy,
    tags,
    featureSettings: [...sourceTargetSettings, ...featureSettings]
  }
}

const getPublication = async (token, pid) => {
  let publication = {}
  try {
    const resp = await axios({
      method: 'GET',
      url: `${process.env.PUBLICATION_AUTHORITY}/publication/api/v1/publications/${pid}?embed=page_links`,
      headers: {
        authorization: token
      }
    })
    publication = resp.data
  } catch (exc) {
    console.log(`Unable to get publication: ${pid}: ${exc}`)
    throw new Error(`Exception encountered trying to get a publication: ${pid}`, { cause: exc })
  }

  return publication
}

// get publication artifact content
const getPAContent = (publication) => {
  return (
    publication._embedded &&
    publication._embedded['pa:get_publication_artifacts'] &&
    publication._embedded['pa:get_publication_artifacts'].length &&
    publication._embedded['pa:get_publication_artifacts'][0] &&
    publication._embedded['pa:get_publication_artifacts'].find((e) => e.name === 'svg') &&
    publication._embedded['pa:get_publication_artifacts'].find((e) => e.name === 'svg')._embedded[
      'ac:get_artifact_content'
    ]
  )
}

// exported only for unit testing only
const monitorPublication = async (token, _id, publication, publicationConfigs) => {
  let count = 0
  let total = 0

  if (publication && publication.id) {
    try {
      while (
        publication.status &&
        publication.status !== 'Complete' &&
        publication.status !== 'Failed'
      ) {
        const paContent = getPAContent(publication)
        if (paContent) {
          count = paContent.count
          total = paContent.total
        }
        console.log(
          `Publication monitor(interval), id: ${publication.id} status: ${publication.status} pageCount: ${count} pageTotal: ${total}`
        )
        await timeout(2000)
        publication = await getPublication(token, publication.id)
      }
    } catch (exc) {
      console.log(
        'Exception encountered in publication monitor. Eating the exception and proceeding to cleanPublicationSource',
        exc
      )
    }

    const paContent = getPAContent(publication)
    if (paContent) {
      count = paContent.count
      total = paContent.total
    }
    console.log(
      `Publication monitor(final), id: ${publication.id} status: ${publication.status} pageCount: ${count} pageTotal: ${total}`
    )
    if (publication.status === 'Failed') {
      console.log(
        `Publication monitor, id: ${publication.id} failureMessage:`,
        publication.failureMessage
      )
      console.log(`Publication monitor, id: ${publication.id} errors:`, publication.errors)
      console.log(`Publication monitor, id: ${publication.id} warnings:`, publication.warnings)
    }
  }

  try {
    await publicationDB.update({ _id }, { $set: { status: publication.status } })
  } catch (exc) {
    console.log('Exception encountered trying to update publication status', exc)
  }

  try {
    fileStore.cleanPublicationSource(token, publicationConfigs)
  } catch (exc) {
    console.log('Exception encountered in publication monitor. Eating the exception', exc)
  }

  return
}

const getReqHeaders = (token) => {
  const headers = {
    authorization: token
  }
  if (process.env.FILESTORE_PLUGIN === 'cssv3') {
    const testTenant = 'cfc6aeb1-628a-478b-b9d6-e77ac2d18d60'
    const jwt = token && token.replace('Bearer ', '')
    const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
    headers[`X-Tenant-Id`] = jwtPayload.tid || testTenant
  }

  return headers
}

const postPublication = async (token, data) => {
  let publication = {}
  try {
    const resp = await axios({
      method: 'POST',
      url: `${process.env.PUBLICATION_AUTHORITY}/publication/api/v1/publications`,
      data,
      headers: getReqHeaders(token)
    })
    publication = resp.data
  } catch (exc) {
    console.log('Unable to publish file', exc)
    throw new Error('Exception encountered trying to publish a file', { cause: exc })
  }

  return publication
}

const publishFile = async (token, filePath) => {
  const _id = hashIt(filePath)
  let publicationResponse = {}
  let publicationConfig = {}

  if (!args.options.forcepub) {
    try {
      const publicationResult = await publicationDB.findOne({ _id })
      if (publicationResult) {
        return {
          publicationResponse: JSON.parse(publicationResult.publication),
          publicationConfig: JSON.parse(publicationResult.publicationConfig)
        }
      }
    } catch (exc) {
      // do not re-throw, let the publication process proceed
      console.log(
        'DB exception encountered querying for publication data. Proceeding to create publication',
        exc
      )
    }
  }

  try {
    publicationConfig = await fileStore.stagePublicationSource(token, filePath)
    const publicationRequest = createPublicationRequest({
      publicationVersion: '1.0.0',
      policy: {
        namespace: 'opentext.publishing.brava',
        name: 'ComparableBravaView',
        version: '1.x'
      },
      tags: [{ origin: 'ivsa' }],
      sources: [
        {
          url: encodeURI(publicationConfig.url),
          formatHint: publicationConfig.formatHint,
          filenameHint: publicationConfig.filenameHint
        }
      ],
      ...publicationConfig.publishingTarget,
      featureSettings: [
        {
          feature: {
            namespace: 'opentext.publishing.content',
            name: 'SetVectorDisplay',
            version: '1.x'
          },
          path: '/useLineWeightForWidth',
          value: false
        },
        {
          feature: { namespace: 'opentext.publishing.renditions', name: 'ExportSvg' },
          path: '/measure',
          value: { filename: 'measure' }
        }
      ]
    })
    publicationResponse = await postPublication(token, publicationRequest)

    try {
      await publicationDB.update(
        { _id },
        {
          _id,
          filePath,
          status: publicationResponse.status,
          publication: JSON.stringify(publicationResponse),
          publicationConfig: JSON.stringify(publicationConfig)
        },
        { upsert: true }
      )
    } catch (exc) {
      console.log('DB exception encountered inserting publication data', exc)
      throw new Error('Exception encountered trying to insert publication data', { cause: exc })
    }
  } catch (exc) {
    console.log('Unable to publish file', exc)
    throw new Error('Exception encountered trying to publish a file', { cause: exc })
  } finally {
    monitorPublication(token, _id, publicationResponse, [publicationConfig])
  }

  return { publicationResponse, publicationConfig }
}

// exported only for unit testing
const publishXRLFiles = async (
  token,
  docLink,
  docMimeType,
  docFileName,
  XRLFilePaths,
  XRLMarkupsDirPath
) => {
  let hashString = ''
  XRLFilePaths.forEach(function (file) {
    hashString = hashString + file
  })
  const _id = hashIt(hashString)
  let publicationResponse = {}
  let stagePublicationSources = []
  let publicationConfigs = []

  if (!args.options.forcepub) {
    try {
      const publicationResult = await publicationDB.findOne({ _id })
      if (publicationResult) {
        return {
          publicationResponse: JSON.parse(publicationResult.publication)
        }
      }
    } catch (exc) {
      // do not re-throw, let the publication process proceed
      console.log(
        'DB exception encountered querying for publication data. Proceeding to create publication',
        exc
      )
    }
  }

  try {
    XRLFilePaths.forEach(function (filePath) {
      stagePublicationSources.push(fileStore.stagePublicationSource(token, filePath))
    })
    publicationConfigs = await Promise.all(stagePublicationSources)

    const XRLMarkups = publicationConfigs.reduce((acc, pubConfig) => {
      return [...acc, { name: pubConfig.filenameHint, content: pubConfig.url }]
    }, [])
    const XRLMarkupsNames = publicationConfigs.reduce((acc, pubConfig) => {
      return [...acc, { markupName: pubConfig.filenameHint }]
    }, [])

    const publicationRequest = createPublicationRequest({
      publicationVersion: '1.0.0',
      policy: {
        namespace: 'opentext.publishing.brava',
        name: 'ComparableBravaView',
        version: '1.x'
      },
      tags: [{ origin: 'ivsa' }],
      sources: [
        {
          url: encodeURI(docLink),
          formatHint: docMimeType,
          filenameHint: docFileName
        }
      ],
      ...publicationConfigs[0].publishingTarget,
      featureSettings: [
        {
          feature: {
            namespace: 'opentext.publishing.content',
            name: 'SetVectorDisplay',
            version: '1.x'
          },
          path: '/useLineWeightForWidth',
          value: false
        },
        {
          feature: { namespace: 'opentext.publishing.renditions', name: 'ExportSvg' },
          path: '/measure',
          value: { filename: 'measure' }
        },
        {
          feature: {
            namespace: 'opentext.publishing.content',
            name: 'ApplyMarkups',
            version: '1.x'
          },
          path: '/markups',
          value: XRLMarkups
        },
        {
          feature: {
            namespace: 'opentext.publishing.content',
            name: 'ApplyMarkups',
            version: '1.x'
          },
          path: '/toAll',
          value: XRLMarkupsNames
        },
        {
          feature: {
            namespace: 'opentext.publishing.reports',
            name: 'ReportJsonMarkup',
            version: '1.x'
          },
          path: '/sourceId',
          value: docLink
        },
        {
          feature: {
            namespace: 'opentext.publishing.execution',
            name: 'StoreMarkup',
            version: '1.x'
          }
        }
      ]
    })
    publicationResponse = await postPublication(token, publicationRequest)

    try {
      await publicationDB.update(
        { _id },
        {
          _id,
          filePath: XRLMarkupsDirPath,
          status: publicationResponse.status,
          publication: JSON.stringify(publicationResponse)
        },
        { upsert: true }
      )
    } catch (exc) {
      console.log('DB exception encountered inserting publication data', exc)
      throw new Error('Exception encountered trying to insert publication data', { cause: exc })
    }
  } catch (exc) {
    console.log('Unable to publish file', exc)
    throw new Error('Exception encountered trying to publish a file', { cause: exc })
  } finally {
    monitorPublication(token, _id, publicationResponse, publicationConfigs)
  }

  return publicationResponse
}

// publishes files in the given directory only, does not recursively process sub-directories
const publishDirectory = async (token, dirPath) => {
  const publishFiles = []
  let publications = []
  try {
    const files = await fsp.readdir(dirPath)
    files.forEach(function (file) {
      const filePath = `${dirPath}/${file}`
      if (!fs.lstatSync(filePath).isDirectory()) {
        publishFiles.push(publishFile(token, filePath))
      }
    })

    const publicationsComplete = await Promise.all(publishFiles)
    publications = publicationsComplete.map((pc) => pc.publicationResponse)
  } catch (exc) {
    console.log('Unable to publish directory', exc)
    throw new Error('Exception encountered trying to publish a directory', { cause: exc })
  }

  return publications
}

const publishXRLMarkups = async (token, docLink, docMimeType, docFileName, XRLMarkupsDirPath) => {
  const XRLFilePaths = []
  let publications = []
  try {
    const files = await fs.readdirSync(XRLMarkupsDirPath)
    files.forEach(function (file) {
      const filePath = `${XRLMarkupsDirPath}/${file}`
      if (!fs.lstatSync(filePath).isDirectory()) {
        XRLFilePaths.push(filePath)
      }
    })

    publications = await publishXRLFiles(
      token,
      docLink,
      docMimeType,
      docFileName,
      XRLFilePaths,
      XRLMarkupsDirPath
    )
  } catch (exc) {
    console.log('Unable to publish directory', exc)
    throw new Error('Exception encountered trying to publish a directory of XRL files', {
      cause: exc
    })
  }

  return publications
}

const getFileWithXRLMarkupsFilePaths = (dirPath) => {
  let publishDocumentFilePath
  let publishXRLMarkupDirFilePath

  const files = fs.readdirSync(dirPath)
  files.forEach(function (file) {
    const filePath = `${dirPath}/${file}`
    if (!fs.lstatSync(filePath).isDirectory()) {
      publishDocumentFilePath = filePath
    } else {
      publishXRLMarkupDirFilePath = filePath
    }
  })
  return {
    publishDocumentFilePath,
    publishXRLMarkupDirFilePath
  }
}

const publishFileWithXRLMarkups = async (token, dirPath) => {
  let publication

  try {
    const fileWithXRLMarkupsFilePaths = getFileWithXRLMarkupsFilePaths(dirPath)

    // This document may already be in the Object (Publication) Store.
    const publicationAndConfig = await publishFile(
      token,
      fileWithXRLMarkupsFilePaths.publishDocumentFilePath
    )
    publication = publicationAndConfig.publicationResponse
    const publicationConfig = publicationAndConfig.publicationConfig

    const docLink = publicationConfig.url
    const docMimeType = publicationConfig.formatHint
    const docFileName = publicationConfig.filenameHint

    // NOTE: WE DO NOT WANT TO ADD THIS XRL to JSON PUBLICATION TO THE LIST OF PUBLICATIONS RETURNED
    await publishXRLMarkups(
      token,
      docLink,
      docMimeType,
      docFileName,
      fileWithXRLMarkupsFilePaths.publishXRLMarkupDirFilePath
    )
  } catch (exc) {
    console.log('Unable to publish file with XRL markup files', exc)
    throw new Error('Exception encountered trying to publish a file with XRL markup files', {
      cause: exc
    })
  }
  // NOTE: We do not return publicationConfig for this type of publication, since it is not needed
  // for any other dependent publication, unlike the publishFile().
  return publication
}

// publishes multiple HTTP file URLs provided in the command line args input
const publishHttpFile = async (token, filePath) => {
  const publishFiles = []
  let publications = []
  try {
    filePath.forEach((httpFileURL) => {
      publishFiles.push(publishFile(token, httpFileURL))
    })
    const publicationsComplete = await Promise.all(publishFiles)
    publications = publicationsComplete.map((pc) => pc.publicationResponse)
  } catch (exc) {
    console.log('Unable to publish http file URL', exc)
    throw new Error('Exception encountered trying to publish a http file URL', { cause: exc })
  }
  return publications
}

const cleanPublicationDB = async () => {
  try {
    return await publicationDB.remove({}, { multi: true }).then(() => {
      publicationDB.compactDatafile()
    })
  } catch (error) {
    console.log('Unable to clean publications.db', error)
  }
}

const publish = async (token, filePath) => {
  let publications = []
  if (args.options.cleanpub) {
    const isCleaned = await cleanPublicationDB()
  }

  const trimmedPaths = filePath.map((element) => {
    return element.trim()
  })

  if (trimmedPaths[0].startsWith('http')) {
    publications = await publishHttpFile(token, trimmedPaths)
  } else if (fs.lstatSync(trimmedPaths[0]).isDirectory()) {
    const files = await fsp.readdir(trimmedPaths[0])

    const dirXRLMarkupsPresent =
      files.includes('XRLmarkups') || files.includes('XRLMarkups') || files.includes('xrlmarkups')
    if (files.length === 2 && dirXRLMarkupsPresent) {
      // NOTE: It is assumed the document with XRL Markups publishing is done with this file hierarchy:
      // directoryDocumentWithXRLMarkups
      // |
      // |-- document
      // |-- XRLMarkups
      //     |
      //     |-- XRLMarkup1.xrl
      //     |-- XRLMarkup2.xrl
      publications.push(await publishFileWithXRLMarkups(token, trimmedPaths[0]))
    } else {
      publications = await publishDirectory(token, trimmedPaths[0])
    }
  } else {
    const publicationComplete = await publishFile(token, trimmedPaths[0])
    const publication = publicationComplete.publicationResponse
    publications = [publication]
  }

  return publications
}

module.exports = {
  publishFile,
  publishDirectory,
  publishFileWithXRLMarkups,
  publishHttpFile,
  publish,
  monitorPublication,
  publishXRLFiles
}
