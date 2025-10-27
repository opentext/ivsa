import { logEvent, logLink } from './utils/log'

export const waitForViewer = async (viewerAuthority) => {
  try {
    // Dynamically import the viewer module
    const viewerModule = await import(`${viewerAuthority}/viewer/api/v1/viewers/iv-view-1.x/static/js/iv-view.js`)
    window.ViewerFactory = viewerModule.default
    return window.ViewerFactory
  } catch (error) { console.error('Error during import viewer module:', error)}
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
  const placeholders = Array.from(urlTemplate.matchAll(/(\{\w+\})/gi)).map(p => p[0])
  const url = placeholders.reduce((acc, p) => acc.replace(p, content[p.slice(1, p.length - 1)]), urlTemplate)
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

  window.addEventListener(viewerKey + '-browseImages', function (e) {
    logEvent('Integration Controlled Browse for Images now!')
    // window.viewerApi.removeRaster(
    //   'https://contentservice-cvt.ci.bp-paas.otxlab.net/v2/content/cj1lYWY2MzRhZS1hMzM3LTQzMTgtOTZiMi02NWFmNjMwMjg0YTgmaT1jN2QyZThiZi1lZTQyLTQzM2MtODdjMC0xNTkwZTg2ZDdjZDk=/download'
    // )
    // window.viewerApi.removeAllRasters()
    // window.viewerApi.addRasters(window.rastersFromBrowse)
  })

  window.addEventListener(viewerKey + '-markupFeaturesAvailable', (e) => {
    logEvent('Annotation features available:', e.detail)
    window.viewerApi.enableMarkupEvents(true)
    window.viewerApi.includeMarkupsInSearch(true)
    window.viewerApi.setRedactionReasonList([
      { code: '(b)', description: 'Written Consent', color: '#fcba03' },
      { code: '(d)(5)', description: 'Civil Action' },
      { code: '(j)(1)', description: 'Intelligence' },
      { code: '(j)(2)', description: 'Investigative Efforts' },
      { code: '(k)(1)', description: 'National Defense or Foreign Policy' },
      { code: '(k)(3)', description: 'Protective Services' },
      { code: '(k)(4)', description: 'Statistical' },
      { code: '(k)(5)', description: 'Investigatory Material' },
      { code: '(k)(6)', description: 'Testing or Examination Material' },
      { code: '(k)(7)', description: 'Potential for Promotion' },
      { code: 'multi-select', description: 'multiple reasons color', color: '#880000' }
    ])
    window.viewerApi.setDefaultRedactionTextLocation('leader-right')
  })

  window.addEventListener(viewerKey + '-markupEvent', function (e) {
    logEvent('markupEvent!', e.detail)
  })

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

  window.addEventListener(viewerKey + '-bookmarksLoaded', (e) => {
    logEvent('Bookmarks loaded:', e.detail)
    if (window.viewerLink && viewerLink.type && viewerLink.type === 'bookmark') {
      window.viewerApi.setCurrentLocation(window.viewerLink)
    }
  })

  window.addEventListener(viewerKey + '-bookmarkLink', function (e) {
    const viewAsBinderInput = document.querySelector('#view-binder-toggle')
    const link = `${window.location.protocol}//${window.location.host}?layout=Full&binderView=${viewAsBinderInput.checked}&type=bookmark&name=${encodeURIComponent(e.detail.name)}`
    logLink('Bookmark Link', `Click to open bookmark: ${e.detail.name}`, link)
  })

  window.addEventListener(viewerKey + '-pageLink', function (e) {
    console.log('Page link event!', e.detail)
    const viewAsBinderInput = document.querySelector('#view-binder-toggle')
    const linkQuery = `?type=page&pid=${e.detail.pid}&pageNumber=${e.detail.pageNumber}&binderView=${viewAsBinderInput.checked}`
    const link = `${window.location.protocol}//${window.location.host}${linkQuery}`
    logLink('Page Link', `Click to open publication page number: ${e.detail.pid}/${e.detail.pageNumber}`, link)
  })

  window.addEventListener(viewerKey + '-pageRender', (e) => {
    logEvent('Page rendered successfully:', e.detail)
    if (e.detail.index === 0 && 
        window.viewerLink && 
        (window.viewerLink.type === 'rectangle' || window.viewerLink.type === 'page')) {
          window.viewerApi.setCurrentLocation(window.viewerLink)
        }
  })

  window.addEventListener(viewerKey + '-locationChangeComplete', function (e) {
    logEvent('Location change complete:', e.detail)
    if (window.viewerLink) {
      delete window.viewerLink
    }
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
      case 'findBookmarkFailure':
        if (window.viewerLink) {
          eventTitle = `Unable to find the linked bookmark, deleting link: ${window.viewerLink}`
          delete window.viewerLink
        }
        break
      }

    logEvent(eventTitle, detail)
  })

  //#endregion
}
