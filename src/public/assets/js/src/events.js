import { logEvent } from './utils/log'

export const waitForViewer = () => {
  return new Promise((resolve) => {
    window.addEventListener('bravaReady', ({ detail: viewerName }) => {
      logEvent('Viewer loaded:', viewerName)
      resolve(viewerName)
    })
  })
}

export const downloadExportedFile = (e) => {
  const loadSourcesProp = Object.keys(e.detail._embedded['otc:get_configs_id'].features).filter(
    (property) => {
      return property.startsWith('opentext.publishing.sources@LoadSources@')
    }
  )

  const loadSources = Object.values(
    e.detail._embedded['otc:get_configs_id'].features[loadSourcesProp].documents
  )

  const sourceDocName = loadSources[0].filenameHint

  const artifact = e.detail._embedded['pa:get_publication_artifacts'].find(
    (e) => e._embedded['ac:get_artifact_content'].urlTemplate
  )._embedded['ac:get_artifact_content']

  const exportType = artifact.acceptHint
    ? artifact.acceptHint === 'application/pdf'
      ? 'pdf'
      : 'tiff'
    : ''

  const urlTemplate = artifact.urlTemplate

  const content = artifact.contentLinks[0]
  const url = urlTemplate
    .replace('{id}', content.id)
    .replace('{name}', content.name)
    .replace('{type}', content.type)
    .replace('{file}', content.file)
  return fetch(url, {
    method: 'GET',
    responseType: 'arraybuffer',
    headers: {
      authorization: window.accessToken
    }
  })
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const file = new Blob([buffer], { type: 'application/octet-stream' })
      const fileURL = window.URL.createObjectURL(file)
      const link = window.document.createElement('a')
      link.href = fileURL
      link.download = content.file ? content.file : sourceDocName + '.' + exportType
      link.click()
      window.URL.revokeObjectURL(fileURL)
    })
}

/* istanbul ignore next */
export const setupEventListeners = (viewerKey) => {
  //#region Viewer Events

  window.addEventListener(viewerKey + '-close', (e) => logEvent('Close request received', e.detail))

  window.addEventListener(viewerKey + '-pageRender', (e) =>
    logEvent('Page rendered successfully:', e.detail)
  )

  window.addEventListener(viewerKey + '-exportButtonClick', (e) =>
    logEvent('Export button clicked', e.detail)
  )

  window.addEventListener(viewerKey + '-compareLayoutUpdated', (e) =>
    logEvent('Compare layout updated', e.detail)
  )

  window.addEventListener(viewerKey + '-publicationIssues', (e) =>
    logEvent('Publication issues occurred', e.detail)
  )

  window.addEventListener(viewerKey + '-modalOpened', (e) => logEvent('Modal opened', e.detail))

  window.addEventListener(viewerKey + '-modalClosed', (e) => logEvent('Modal opened', e.detail))

  window.addEventListener(viewerKey + '-searchResults', (e) => logEvent('Search results', e.detail))

  /* Add custom Button / Dropdown / Pane Events per custom element */

  //#endregion
  //#region Annotation Events

  window.addEventListener(viewerKey + '-markupAdded', (e) =>
    logEvent('New annotation added:', e.detail)
  )

  window.addEventListener(viewerKey + '-markupFeaturesAvailable', (e) =>
    logEvent('Annotation features available:', e.detail)
  )

  window.addEventListener(viewerKey + '-markupStoreComplete', (e) =>
    logEvent('Annotation store complete:', e.detail)
  )

  window.addEventListener(viewerKey + '-markupsLoaded', (e) =>
    logEvent('Annotations loaded:', e.detail)
  )

  window.addEventListener(viewerKey + '-markupsDirty', (e) =>
    logEvent('Annotations dirty:', e.detail)
  )

  window.addEventListener(viewerKey + '-redactionReasonSet', (e) =>
    logEvent('Redaction reason set:', e.detail)
  )

  window.addEventListener(viewerKey + '-requestRedactionReasons', (e) =>
    logEvent('Redaction reasons request:', e.detail)
  )

  window.addEventListener(viewerKey + '-setSelection', (e) =>
    logEvent('Annotation selection changed:', e.detail)
  )

  window.addEventListener(viewerKey + '-stampsLoaded', (e) => logEvent('Stamps loaded:', e.detail))

  //#endregion
  //#region Export Events

  window.addEventListener(viewerKey + '-exportFailure', (e) => logEvent('Export failed:', e.detail))
  window.addEventListener(viewerKey + '-exportSuccess-download', (e) => {
    logEvent('Export download success:', e.detail)
    downloadExportedFile(e)
  })
  window.addEventListener(viewerKey + '-exportSuccess-print', (e) => {
    logEvent('Export print success:', e.detail)
  })

  //#endregion
  //#region Error Events

  window.addEventListener(viewerKey + '-failureNotification', ({ detail }) => {
    let eventTitle = 'Unknown failure'
    switch (detail.type) {
      case 'bookmarksLoadFailure':
        eventTitle = 'Bookmarks load failure:'
        break
      case 'markupStoreFailure':
        eventTitle = 'Annotation store failure:'
        break
      case 'rasterLoadFailure':
        eventTitle = 'Raster load failure:'
        break
      case 'svgPageLoadFailure':
        eventTitle = 'Page load failure:'
        break
      case 'thumbnailLoadFailure':
        eventTitle = 'Thumbnail load failure:'
        break
      case 'translationFailed':
        eventTitle = 'Translation failure:'
        break
      case 'loadImageFailure':
        eventTitle = 'Image load failure:'
        break
      case 'loadRasterFailure':
        eventTitle = 'Raster load failure:'
        break
      case 'markupLoadFailure':
        eventTitle = 'Annotation load failure:'
        break
      case 'updatePublicationFailure':
        eventTitle = 'Update publication failure:'
        break
      case 'searchFailure':
        eventTitle = 'Search failure:'
        break
      case 'licenseFailure':
        eventTitle = 'License failure:'
        break
      case 'searchPageTextFailure':
        eventTitle = 'Search page text failure:'
        break
      case 'viewBinderFailure':
        eventTitle = 'View binder failure:'
        break
      case 'getUserLicenseFailure':
        eventTitle = 'Get user license failure:'
        break
    }

    logEvent(eventTitle, detail)
  })

  //#endregion
}
