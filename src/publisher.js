require('dotenv').config()
const fs = require('fs')
const fsp = require('fs').promises
const axios = require('axios')
const args = require('./args')
const { publicationDB } = require('./publicationdb')
const fileStore = require(`./plugins/${process.env.FILESTORE_PLUGIN}`)
const { additionalFeatureSettings } = require('./featuresettings')

const files = {}

// Encoding for RFC3986 makes square brackets reserved (for IPv6)
const encodeRFC3986URI = str => {
  return encodeURI(str)
    .replace(/%5B/, '[')
    .replace(/%5D/, ']')
    .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

const hashIt = s =>
  s.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)
const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const createPublicationRequest = ({ publicationVersion, policy, tags, sources, target, featureSettings }) => {
  publicationVersion = publicationVersion || '1.x'
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
    publicationVersion: publicationVersion,
    policy,
    tags,
    featureSettings: [...sourceTargetSettings, ...featureSettings, ...additionalFeatureSettings]
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
const getPAContent = publication => {
  return (
    publication._embedded &&
    publication._embedded['pa:get_publication_artifacts'] &&
    publication._embedded['pa:get_publication_artifacts'].length &&
    publication._embedded['pa:get_publication_artifacts'][0] &&
    publication._embedded['pa:get_publication_artifacts'].find(e => e.name === 'svg') &&
    publication._embedded['pa:get_publication_artifacts'].find(e => e.name === 'svg')._embedded[
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
      while (publication.status && publication.status !== 'Complete' && publication.status !== 'Failed') {
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
      console.log(`Publication monitor, id: ${publication.id} failureMessage:`, publication.failureMessage)
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

const getReqHeaders = token => {
  const headers = {
    authorization: token
  }
  if (process.env.FILESTORE_PLUGIN === 'cssv3') {
    const testTenant = 'cfc6aeb1-628a-478b-b9d6-e77ac2d18d60'
    const jwt = token && token.replace('Bearer ', '')
    const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
    headers[`X-Tenant-Id`] = jwtPayload.tid || jwtPayload.tenant_id || testTenant
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

const publishFile = async (token, filePath, forcedPolicyName = '') => {
  const _id = hashIt(filePath)
  let publicationResponse = {}
  let publicationConfig = {}

  const policyName = forcedPolicyName
    ? forcedPolicyName
    : args.options.policyname
    ? args.options.policyname
    : 'ComparableBravaView'

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
      console.log('DB exception encountered querying for publication data. Proceeding to create publication', exc)
    }
  }

  try {
    publicationConfig = await fileStore.stagePublicationSource(token, filePath)
    const publicationRequest = createPublicationRequest({
      publicationVersion: '1.x',
      policy: {
        namespace: 'opentext.publishing.brava',
        name: policyName,
        version: '1.x'
      },
      tags: [{ origin: 'ivsa' }],
      sources: [
        {
          url: encodeRFC3986URI(publicationConfig.url),
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

const uploadOnlyFile = async (token, filePath) => {
  const _id = hashIt(filePath)
  let publicationResponse = {}
  let publicationConfig = {}

  try {
    publicationConfig = await fileStore.stagePublicationSourceForQV(token, filePath)
    publicationResponse = publicationConfig
  } catch (exc) {
    console.log('Unable to upload file', exc)
    throw new Error('Exception encountered trying to upload a file', { cause: exc })
  }

  return { publicationResponse, publicationConfig }
}

// exported only for unit testing
const publishXRLFiles = async (token, docLink, docMimeType, docFileName, XRLFilePaths, XRLMarkupsDirPath) => {
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
      console.log('DB exception encountered querying for publication data. Proceeding to create publication', exc)
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
      publicationVersion: '1.x',
      policy: {
        namespace: 'opentext.publishing.brava',
        name: 'ComparableBravaView',
        version: '1.x'
      },
      tags: [{ origin: 'ivsa' }],
      sources: [
        {
          url: encodeRFC3986URI(docLink),
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

// get all the files in the given directory and recursively process sub-directories
const getFilesInDirectoryRecursive = async (dirPath, filesArray = []) => {
  try {
    const files = fs.readdirSync(dirPath)
    files.forEach(async function (file) {
      const filePath = `${dirPath}/${file}`
      if (!fs.lstatSync(filePath).isDirectory()) {
        // Add the file to the array
        filesArray.push(filePath)
      } else if (process.env.INCLUDE_SUBDIRS === 'true') {
        // Recursively get files in subdirectories
        getFilesInDirectoryRecursive(filePath, filesArray)
      }
    })
  } catch (error) {
    console.log('Unable to get Files directory', error)
    throw new Error('Exception encountered trying to get files in a directory', { cause: error })
  }
  return filesArray
}

// get all the files in the given directory and recursively process sub-directories
const getFilesInDirectoryNonRecursive = async dirPath => {
  let filesArray = []
  try {
    const files = fs.readdirSync(dirPath)
    files.forEach(async function (file) {
      const filePath = `${dirPath}/${file}`
      if (!fs.lstatSync(filePath).isDirectory()) {
        // Add the file to the array
        filesArray.push(filePath)
      }
    })
  } catch (error) {
    console.log('Unable to get Files directory', error)
    throw new Error('Exception encountered trying to get files in a directory', { cause: error })
  }
  return filesArray
}

// publishes files in the given directory only, does not recursively process sub-directories
const publishDirectory = async (token, dirPath, forcedPolicyName = '') => {
  const publishFiles = []

  const filePaths = await Promise.resolve(
    forcedPolicyName ? getFilesInDirectoryNonRecursive(dirPath) : getFilesInDirectoryRecursive(dirPath)
  )
  console.log('Publishing files', filePaths.length)
  console.log(filePaths)
  let publications = []
  try {
    filePaths.forEach(file => {
      if (!fs.lstatSync(file).isDirectory()) {
        publishFiles.push(publishFile(token, file, forcedPolicyName))
      }
    })
    const publicationsComplete = await Promise.all(publishFiles)
    publications = publicationsComplete.map(pc => pc.publicationResponse)
  } catch (exc) {
    console.log('Unable to publish directory', exc)
    throw new Error('Exception encountered trying to publish a directory', { cause: exc })
  }

  return publications
}

// uploads (for client-side rendering) files in the given directory only, does not recursively process sub-directories
const uploadOnlyDirectory = async (token, dirPath) => {
  const uploadFiles = []

  const filePaths = await Promise.resolve(getFilesInDirectoryNonRecursive(dirPath))
  console.log('Uploading files', filePaths.length)
  console.log(filePaths)
  let publications = []
  try {
    filePaths.forEach(file => {
      if (!fs.lstatSync(file).isDirectory()) {
        uploadFiles.push(uploadOnlyFile(token, file))
      }
    })
    const publicationsComplete = await Promise.all(uploadFiles)
    publications = publicationsComplete.map(pc => pc.publicationResponse)
  } catch (exc) {
    console.log('Unable to upload directory', exc)
    throw new Error('Exception encountered trying to uploadOnly a directory', { cause: exc })
  }

  return publications
}

const publishDirectoryMixed = async (token, dirPath) => {
  const publicationsSvg = await publishDirectory(token, dirPath, 'ComparableBravaView')
  const publicationsBdl = await publishDirectory(token, dirPath + '/bdl', 'WebAssemblyView')
  return [...publicationsSvg, ...publicationsBdl]
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

    publications = await publishXRLFiles(token, docLink, docMimeType, docFileName, XRLFilePaths, XRLMarkupsDirPath)
  } catch (exc) {
    console.log('Unable to publish directory', exc)
    throw new Error('Exception encountered trying to publish a directory of XRL files', {
      cause: exc
    })
  }

  return publications
}

const getFileWithXRLMarkupsFilePaths = dirPath => {
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
    const publicationAndConfig = await publishFile(token, fileWithXRLMarkupsFilePaths.publishDocumentFilePath)
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
    filePath.forEach(httpFileURL => {
      publishFiles.push(publishFile(token, httpFileURL))
    })

    const publicationsComplete = await Promise.all(publishFiles)
    publications = publicationsComplete.map(pc => pc.publicationResponse)
  } catch (exc) {
    console.log('Unable to publish http file URL', exc)
    throw new Error('Exception encountered trying to publish a http file URL', { cause: exc })
  }
  return publications
}

// uploadOnlys multiple HTTP file URLs provided in the command line args input
const uploadOnlyHttpFile = async (token, filePath) => {
  const publishFiles = []
  let publications = []
  try {
    filePath.forEach(httpFileURL => {
      publishFiles.push(uploadOnlyFile(token, httpFileURL))
    })

    const publicationsComplete = await Promise.all(publishFiles)
    publications = publicationsComplete.map(pc => pc.publicationResponse)
  } catch (exc) {
    console.log('Unable to publish http file URL', exc)
    throw new Error('Exception encountered trying to upload a http file URL', { cause: exc })
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

  const trimmedPaths = filePath.map(element => {
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
      const dirBDLPresent = files.includes('bdl')
      if (dirBDLPresent) {
        // NOTE: It is assumed the mixed formats documents publishing is done with this file hierarchy:
        // directoryDocumentsMixedFormats
        // |
        // |-- document1ToSVG
        // |-- document2ToSVG
        // |-- bdl
        //     |
        //     |-- document3ToBDL
        //     |-- document4ToBDL
        // NOTE2: This structure does not support recursive sub-directory publishing. All SVGs at one level. All BDLs at one level.
        publications = await publishDirectoryMixed(token, trimmedPaths[0])
      } else {
        publications = await publishDirectory(token, trimmedPaths[0])
      }
    }
  } else {
    const publicationComplete = await publishFile(token, trimmedPaths[0])
    const publication = publicationComplete.publicationResponse
    publications = [publication]
  }

  return publications
}

const uploadOnly = async (token, filePath) => {
  let publications = []

  const trimmedPaths = filePath.map(element => {
    return element.trim()
  })

  if (trimmedPaths[0].startsWith('http')) {
    publications = await uploadOnlyHttpFile(token, trimmedPaths)
  } else if (fs.lstatSync(trimmedPaths[0]).isDirectory()) {
    publications = await uploadOnlyDirectory(token, trimmedPaths[0])
  } else {
    const publicationComplete = await uploadOnlyFile(token, trimmedPaths[0])
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
  publishXRLFiles,
  publishDirectoryMixed,
  uploadOnly,
  uploadOnlyHttpFile
}
