/**
THIS FILE WAS GENERATED BY A BUILD AND SHOULD NOT BE EDITED DIRECTLY.
This file is the bundled integration code generated by running npm run build command in the command line.
To edit the integration code, please edit code in the src/ folder and run `npm run build` in the command line to regenerate this file.
**/

'use strict'

var lastEvents = []
var eventThreshold = 100
var logEvent = function logEvent(event, details) {
  var eventLog = document.querySelector('#event-log')
  lastEvents.push(event)

  if (lastEvents.length > eventThreshold) {
    lastEvents.shift()
    eventLog.querySelector('p.event:last-of-type').remove()
  }

  var evt = document.createElement('p')
  evt.classList.add('event')
  var evtName = document.createElement('strong')
  evtName.textContent = ''.concat(event, ' ')
  evtName.title = ''.concat(event, ': ').concat(details)
  var evtDetails = document.createTextNode(details ? JSON.stringify(details) : '')
  evt.appendChild(evtName)
  evt.appendChild(evtDetails)
  eventLog.prepend(evt)
}

var waitForViewer = function waitForViewer() {
  return new Promise(function (resolve) {
    window.addEventListener('bravaReady', function (_ref) {
      var viewerName = _ref.detail
      logEvent('Viewer Loaded', viewerName)
      resolve(viewerName)
    })
  })
}
var downloadExportedFile = function downloadExportedFile(e) {
  var loadSourcesProp = Object.keys(e.detail._embedded['otc:get_configs_id'].features).filter(
    function (property) {
      return property.startsWith('opentext.publishing.sources@LoadSources@')
    }
  )
  var loadSources = Object.values(
    e.detail._embedded['otc:get_configs_id'].features[loadSourcesProp].documents
  )
  var sourceDocName = loadSources[0].filenameHint
  var artifact =
    e.detail._embedded['pa:get_publication_artifacts'][0]._embedded['ac:get_artifact_content']
  var exportType = artifact.acceptHint
    ? artifact.acceptHint === 'application/pdf'
      ? 'pdf'
      : 'tiff'
    : ''
  var urlTemplate = artifact.urlTemplate
  var content = artifact.contentLinks[0]
  var url = urlTemplate
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
    .then(function (response) {
      return response.arrayBuffer()
    })
    .then(function (buffer) {
      var file = new Blob([buffer], {
        type: 'application/octet-stream'
      })
      var fileURL = window.URL.createObjectURL(file)
      var link = window.document.createElement('a')
      link.href = fileURL
      link.download = content.file ? content.file : sourceDocName + '.' + exportType
      link.click()
      window.URL.revokeObjectURL(fileURL)
    })
}
/* istanbul ignore next */

var setupEventListeners = function setupEventListeners(viewerKey) {
  //#region Viewer Events
  window.addEventListener(viewerKey + '-close', function (e) {
    return logEvent('Close request received', e.detail)
  })
  window.addEventListener(viewerKey + '-pageRender', function (e) {
    return logEvent('Page rendered successfully:', e.detail)
  })
  window.addEventListener(viewerKey + '-exportButtonClick', function (e) {
    return logEvent('Export button clicked', e.detail)
  })
  window.addEventListener(viewerKey + '-compareLayoutUpdated', function (e) {
    return logEvent('Compare layout updated', e.detail)
  })
  window.addEventListener(viewerKey + '-publicationIssues', function (e) {
    return logEvent('Publication issues occurred', e.detail)
  })
  window.addEventListener(viewerKey + '-modalOpened', function (e) {
    return logEvent('Modal opened', e.detail)
  })
  window.addEventListener(viewerKey + '-modalClosed', function (e) {
    return logEvent('Modal opened', e.detail)
  })
  window.addEventListener(viewerKey + '-searchResults', function (e) {
    return logEvent('Search results', e.detail)
  })
  /* Add custom Button / Dropdown / Pane Events per custom element */
  //#endregion
  //#region Annotation Events

  window.addEventListener(viewerKey + '-markupAdded', function (e) {
    return logEvent('New annotation added:', e.detail)
  })
  window.addEventListener(viewerKey + '-markupFeaturesAvailable', function (e) {
    return logEvent('Annotation features available:', e.detail)
  })
  window.addEventListener(viewerKey + '-markupStoreComplete', function (e) {
    return logEvent('Annotation store complete:', e.detail)
  })
  window.addEventListener(viewerKey + '-markupsLoaded', function (e) {
    return logEvent('Annotations loaded:', e.detail)
  })
  window.addEventListener(viewerKey + '-markupsDirty', function (e) {
    return logEvent('Annotations dirty:', e.detail)
  })
  window.addEventListener(viewerKey + '-redactionReasonSet', function (e) {
    return logEvent('Redaction reason set:', e.detail)
  })
  window.addEventListener(viewerKey + '-requestRedactionReasons', function (e) {
    return logEvent('Redaction reasons request:', e.detail)
  })
  window.addEventListener(viewerKey + '-setSelection', function (e) {
    return logEvent('Annotation selection changed:', e.detail)
  })
  window.addEventListener(viewerKey + '-stampsLoaded', function (e) {
    return logEvent('Stamps loaded:', e.detail)
  }) //#endregion
  //#region Export Events

  window.addEventListener(viewerKey + '-exportFailure', function (e) {
    return logEvent('Export failed:', e.detail)
  })
  window.addEventListener(viewerKey + '-exportSuccess-download', function (e) {
    logEvent('Export download success:', e.detail)
    downloadExportedFile(e)
  })
  window.addEventListener(viewerKey + '-exportSuccess-print', function (e) {
    logEvent('Export print success:', e.detail)
  }) //#endregion
  //#region Error Events

  window.addEventListener(viewerKey + '-failureNotification', function (_ref2) {
    var detail = _ref2.detail
    var eventTitle = 'Unknown failure'

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
  }) //#endregion
}

var compareMode = false
var setInitialPublications = function setInitialPublications() {
  var publications = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : []
  var viewer = arguments.length > 1 ? arguments[1] : undefined

  if (publications.length >= 1) {
    publications.map(function (m) {
      return viewer.addPublication(m, false)
    })

    if (publications.length > 1) {
      generatePublicationOptions(publications, viewer)
      enablePublicationSelector()
    }
  }

  viewer.render()
}

var addPublicationOptionsForElement = function addPublicationOptionsForElement(
  namedPublications,
  select
) {
  namedPublications.forEach(function (publication) {
    var opt = document.createElement('option')
    opt.value = publication.publication.id
    opt.textContent = publication.name
    select.appendChild(opt)
  })
}

var generatePublicationOptions = function generatePublicationOptions(publications, viewer) {
  var namedPublications = publications.map(function (publication, i) {
    var _publication$featureS, _publication$featureS2, _publication$featureS3

    var publicationHintValue =
      publication === null || publication === void 0
        ? void 0
        : (_publication$featureS = publication.featureSettings) === null ||
          _publication$featureS === void 0
        ? void 0
        : (_publication$featureS2 = _publication$featureS.find(function (setting) {
            var _setting$feature

            return (
              (setting === null || setting === void 0
                ? void 0
                : (_setting$feature = setting.feature) === null || _setting$feature === void 0
                ? void 0
                : _setting$feature.name) === 'LoadSources'
            )
          })) === null || _publication$featureS2 === void 0
        ? void 0
        : (_publication$featureS3 = _publication$featureS2.value) === null ||
          _publication$featureS3 === void 0
        ? void 0
        : _publication$featureS3.find(function (obj) {
            return obj.hasOwnProperty('filenameHint')
          })
    return {
      name: publicationHintValue
        ? ''.concat(publicationHintValue.filenameHint, '.').concat(publicationHintValue.formatHint)
        : 'Unknown '.concat(i),
      publication: publication
    }
  })
  var primaryPublicationSelector = document.querySelector('#primary-publication-selector')
  var comparePublicationSelector = document.querySelector('#compare-publication-selector')
  var viewAsBinderInput = document.querySelector('#view-binder-toggle')
  var primaryControl = document.querySelector('.primary-control')
  addPublicationOptionsForElement(namedPublications, primaryPublicationSelector)
  addPublicationOptionsForElement(namedPublications, comparePublicationSelector)

  var setPrimaryPublication = function setPrimaryPublication(publicationId) {
    if (compareMode) {
      viewer.comparePublications(
        publicationId,
        comparePublicationSelector.value || publications[0].id
      )
    } else {
      viewer.viewPublication(publicationId)
    }
  }

  var setComparePublication = function setComparePublication(publicationId) {
    if (compareMode) {
      viewer.comparePublications(
        primaryPublicationSelector.value || publications[0].id,
        publicationId
      )
    }
  }

  var handlePublicationSelection = function handlePublicationSelection(_ref) {
    var _ref$target = _ref.target,
      elementId = _ref$target.id,
      publicationId = _ref$target.value

    if (elementId === 'primary-publication-selector') {
      setPrimaryPublication(publicationId)
    } else {
      setComparePublication(publicationId)
    }
  }

  var handleBinderModeChange = function handleBinderModeChange(_ref2) {
    var viewAsBinder = _ref2.target.checked

    if (viewAsBinder) {
      viewer.viewBinder(
        publications.map(function (p) {
          return p.id
        })
      )
      primaryControl.classList.add('hidden')
    } else {
      viewer.viewPublication(primaryPublicationSelector.value || publications[0].id)
      primaryControl.classList.remove('hidden')
    }
  }

  primaryPublicationSelector.addEventListener('change', handlePublicationSelection)
  comparePublicationSelector.addEventListener('change', handlePublicationSelection)
  viewAsBinderInput.addEventListener('change', handleBinderModeChange)
}
var enablePublicationSelector = function enablePublicationSelector() {
  var publications = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : []
  var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false

  if (publications.length > 1) {
    var binderControl = document.querySelector('.binder-control')
    var primaryControl = document.querySelector('.primary-control')
    var compareControl = document.querySelector('.compare-control')
    document.querySelector('.publication-controls').classList.remove('hidden')

    if (compare) {
      compareMode = true
      binderControl.classList.add('hidden')
      primaryControl.classList.remove('hidden')
      compareControl.classList.remove('hidden')
    } else {
      compareMode = false
      binderControl.classList.remove('hidden')

      if (document.querySelector('#view-binder-toggle').checked) {
        primaryControl.classList.add('hidden')
      } else {
        primaryControl.classList.remove('hidden')
      }

      compareControl.classList.add('hidden')
    }
  }
}

var pageOutputOptions = [
  {
    value: 'all'
  },
  {
    value: 'current'
  },
  {
    value: 'markup'
  },
  {
    value: 'designated'
  }
]
var pageSizeOptions = [
  {
    value: '',
    label: 'Original page size'
  },
  {
    value: 'Letter',
    label: 'Letter (8.5 X 11 in)'
  },
  {
    value: 'Legal',
    label: 'Legal (8.5 X 14 in.)'
  },
  {
    value: 'Ledger',
    label: 'Ledger (17 X 11 in.)'
  },
  {
    value: 'Tabloid',
    label: 'Tabloid (11 X 17 in.)'
  },
  {
    value: 'Executive',
    label: 'Executive (7.25 x 10.55 in.)'
  },
  {
    value: 'Arch C Size Sheet',
    label: 'Arch C Size Sheet (24 X 18 in.)'
  },
  {
    value: 'Arch D Size Sheet',
    label: 'Arch D Size Sheet (36 X 24 in.)'
  },
  {
    value: 'Arch E Size Sheet',
    label: 'Arch E Size Sheet (48 X 36 in.)'
  },
  {
    value: 'Ansi C Size Sheet',
    label: 'Ansi C Size Sheet (22 X 17 in.)'
  },
  {
    value: 'Ansi D Size Sheet',
    label: 'Ansi D Size Sheet (34 X 22 in.)'
  },
  {
    value: 'Ansi E Size Sheet',
    label: 'Ansi E Size Sheet (44 X 34 in.)'
  },
  {
    value: 'ISO A0 Landscape',
    label: 'ISO A0 Landscape (1189 X 841 mm)'
  },
  {
    value: 'ISO A1 Landscape',
    label: 'ISO A1 Landscape (841 X 594 mm)'
  },
  {
    value: 'ISO A2 Landscape',
    label: 'ISO A2 Landscape (594 X 420 mm)'
  },
  {
    value: 'ISO A3 Landscape',
    label: 'ISO A3 Landscape (420 X 297 mm)'
  },
  {
    value: 'ISO A4 Landscape',
    label: 'ISO A4 Landscape (297 X 210 mm)'
  },
  {
    value: 'ISO A5 Landscape',
    label: 'ISO A5 Landscape (210 X 148 mm)'
  },
  {
    value: 'ISO A6 Landscape',
    label: 'ISO A6 Landscape (148 X 105 mm)'
  },
  {
    value: 'ISO A7 Landscape',
    label: 'ISO A7 Landscape (105 X 74 mm)'
  },
  {
    value: 'ISO A0 Portrait',
    label: 'ISO A0 Portrait (841 X 1189 mm)'
  },
  {
    value: 'ISO A1 Portrait',
    label: 'ISO A1 Portrait (594 X 841 mm)'
  },
  {
    value: 'ISO A2 Portrait',
    label: 'ISO A2 Portrait (420 X 594 mm)'
  },
  {
    value: 'ISO A3 Portrait',
    label: 'ISO A3 Portrait (297 X 420 mm)'
  },
  {
    value: 'ISO A4 Portrait',
    label: 'ISO A4 Portrait (210 X 297 mm)'
  },
  {
    value: 'ISO A5 Portrait',
    label: 'ISO A5 Portrait (148 X 210 mm)'
  },
  {
    value: 'ISO A6 Portrait',
    label: 'ISO A6 Portrait (105 X 148 mm)'
  },
  {
    value: 'ISO A7 Portrait',
    label: 'ISO A7 Portrait (74 X 105 mm)'
  },
  {
    value: 'ISO B0 Landscape',
    label: 'ISO B0 Landscape (1414 X 1000 mm)'
  },
  {
    value: 'ISO B1 Landscape',
    label: 'ISO B1 Landscape (1000 X 707 mm)'
  },
  {
    value: 'ISO B2 Landscape',
    label: 'ISO B2 Landscape (707 X 500 mm)'
  },
  {
    value: 'ISO B3 Landscape',
    label: 'ISO B3 Landscape (500 X 353 mm)'
  },
  {
    value: 'ISO B4 Landscape',
    label: 'ISO B4 Landscape (353 X 250 mm)'
  },
  {
    value: 'ISO B5 Landscape',
    label: 'ISO B5 Landscape (250 X 176 mm)'
  },
  {
    value: 'ISO B6 Landscape',
    label: 'ISO B6 Landscape (176 X 125 mm)'
  },
  {
    value: 'ISO B7 Landscape',
    label: 'ISO B7 Landscape (125 X 88 mm)'
  },
  {
    value: 'ISO B0 Portrait',
    label: 'ISO B0 Portrait (1000 X 1414 mm)'
  },
  {
    value: 'ISO B1 Portrait',
    label: 'ISO B1 Portrait (707 X 1000 mm)'
  },
  {
    value: 'ISO B2 Portrait',
    label: 'ISO B2 Portrait (500 X 707 mm)'
  },
  {
    value: 'ISO B3 Portrait',
    label: 'ISO B3 Portrait (353 X 500 mm)'
  },
  {
    value: 'ISO B4 Portrait',
    label: 'ISO B4 Portrait (250 X 353 mm)'
  },
  {
    value: 'ISO B5 Portrait',
    label: 'ISO B5 Portrait (176 X 250 mm)'
  },
  {
    value: 'ISO B6 Portrait',
    label: 'ISO B6 Portrait (125 X 176 mm)'
  },
  {
    value: 'ISO B7 Portrait',
    label: 'ISO B7 Portrait (88 X 125 mm)'
  },
  {
    value: 'JIS B4',
    label: 'JIS B4 (364 X 257 mm)'
  },
  {
    value: 'JIS B5',
    label: 'JIS B5 (182 X 257 mm)'
  }
]
var isoOptions = [
  {
    label: 'PDF Standard',
    value: 'none'
  },
  {
    label: 'PDF/A-1a compatible',
    value: 'a1a'
  },
  {
    label: 'PDF/A-1b compatible',
    value: 'a1b'
  },
  {
    label: 'PDF/A-2b compatible',
    value: 'a2b'
  },
  {
    label: 'PDF/A-2u compatible',
    value: 'a2u'
  },
  {
    label: 'PDF/A-3a compatible',
    value: 'a3a'
  },
  {
    label: 'PDF/A-3b compatible',
    value: 'a3b'
  },
  {
    label: 'PDF/A-3u compatible',
    value: 'a3u'
  },
  {
    label: 'PDF/E compatible',
    value: 'e'
  }
]
var orientationOptions = [
  {
    value: 'original'
  },
  {
    value: 'portrait'
  },
  {
    value: 'landscape'
  },
  {
    value: 'outputsize'
  }
]
var layerOptions = [
  {
    value: 'all'
  },
  {
    value: 'visible'
  },
  {
    value: 'none'
  }
]
var coloringOptions = [
  {
    value: 'original'
  },
  {
    value: 'convertMonochrome'
  },
  {
    value: 'convertGrayscale'
  }
]
var fontOptions = [
  {
    value: 'serif',
    label: 'Serif'
  },
  {
    value: 'sans-serif',
    label: 'Sans-Serif'
  },
  {
    value: 'cursive',
    label: 'Cursive'
  },
  {
    value: 'monospace',
    label: 'Monospace'
  }
]
var compressionOptions = [
  {
    value: 'jpg'
  },
  {
    value: 'lzw'
  },
  {
    value: 'packbits'
  },
  {
    value: 'ccitt'
  }
]
var colorConversionOptions = [
  {
    value: 'original'
  },
  {
    value: 'convertMonochrome'
  },
  {
    value: 'convertGrayscale'
  }
]
var colorDepthOptions = [
  {
    value: 'force1bpp'
  },
  {
    value: 'max4bpp'
  },
  {
    value: 'force4bpp'
  },
  {
    value: 'max8bpp'
  },
  {
    value: 'force8bpp'
  },
  {
    value: 'max24bpp'
  },
  {
    value: 'force24bpp'
  }
]
var pdfExportActions = [
  {
    id: 'newFile',
    message: 'Back to Content Server as a new file'
  },
  {
    id: 'newVersion',
    message: 'Back to Content Server as a new version of the current file'
  },
  {
    id: 'newRendition',
    message: 'Back to Content Server as a rendition of the current version'
  },
  {
    id: 'download',
    default: true,
    message: 'Download to my browser'
  }
]
var pdfExportDefaults = {
  pageSizeName: '',
  pagesToExport: 'all',
  markupBurnin: 'burn',
  colorConversion: 'original',
  isoConformance: 'none',
  successAction: 'download',
  includeLayers: 'all',
  rotateToOrientation: 'original',
  banner: {
    Watermark: {
      // disabled: true,
      text: 'TOP SECRET',
      size: 72,
      font: 'monospace',
      opacity: 0.25,
      color: '#FF0000',
      italic: true,
      bold: true,
      underline: true
    },
    TopLeft: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    TopCenter: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    TopRight: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    BottomLeft: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    BottomCenter: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    BottomRight: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    LeftTop: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    LeftCenter: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    LeftBottom: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    RightTop: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    RightCenter: {
      text: '',
      size: 48,
      font: 'cursive'
    },
    RightBottom: {
      text: '',
      size: 48,
      font: 'cursive'
    }
  }
}
var pdfExport = {
  submitButtonLabel: 'publish',
  tabs: [
    {
      title: 'tab.exportGeneral',
      layout: [
        {
          component: 'FormColumns',
          fields: ['PageOutput', 'PageSize', 'Orientation', 'Layering', 'OutputIso']
        },
        {
          component: 'FieldSet',
          title: 'coloring',
          layout: [
            {
              component: 'FormColumns',
              fields: ['ColorConversion', 'ApplyLineWeights', 'null', 'ForceThinLines']
            }
          ]
        },
        {
          component: 'FieldSet',
          title: 'markup',
          toggle: 'includeMarkups',
          layout: [
            {
              component: 'FormColumns',
              fields: ['BurninMarkups', 'AppendComments', 'MarkupsAsComments', 'AppendReasons']
            }
          ]
        }
      ]
    },
    {
      title: 'tab.exportSecurity',
      layout: [
        {
          component: 'FormSection',
          fields: ['SecurityPassword', 'PermissionsPassword']
        }
      ]
    },
    {
      title: 'tab.exportBannerWatermark',
      layout: [
        {
          component: 'BannerWatermark'
        }
      ]
    },
    {
      title: 'tab.exportAction',
      layout: [
        {
          component: 'FormSection',
          fields: ['SuccessAction']
        }
      ]
    }
  ]
}
var markupTools = [
  {
    title: 'Tools',
    //
    tools: [
      {
        label: 'select markup',
        tool: 'select',
        icon: 'Select'
      }
    ]
  },
  {
    title: 'toolPalette.annotations',
    // "Annotations" are the subset of "markups" used for drawing shapes
    tools: [
      {
        label: 'text',
        tool: 'text',
        icon: 'Text',
        props: {}
      },
      {
        label: 'arrow',
        tool: 'arrow',
        icon: 'Arrow',
        props: {}
      },
      {
        label: 'ellipse',
        tool: 'ellipse',
        icon: 'Ellipse',
        props: {}
      },
      {
        label: 'arc',
        tool: 'arc',
        icon: 'Arc',
        props: {}
      },
      {
        label: 'scratchout',
        tool: 'scratchout',
        icon: 'Scratchout',
        props: {}
      },
      {
        label: 'cloudRectangle',
        tool: 'cloudRectangle',
        icon: 'CloudRectangle',
        props: {}
      },
      {
        label: 'cloudPolygon',
        tool: 'cloudPolygon',
        icon: 'CloudPolygon',
        props: {}
      },
      {
        label: 'openSketch',
        tool: 'openSketch',
        icon: 'OpenSketch'
      },
      {
        label: 'closedSketch',
        tool: 'closedSketch',
        icon: 'ClosedSketch'
      },
      {
        label: 'line',
        tool: 'line',
        icon: 'Line',
        props: {}
      },
      {
        label: 'polyline',
        tool: 'polyline',
        icon: 'Polyline',
        props: {
          closed: false
        }
      },
      {
        label: 'crossout',
        tool: 'crossout',
        icon: 'Crossout',
        props: {}
      },
      {
        label: 'rectangle',
        tool: 'rectangle',
        icon: 'Rectangle',
        props: {}
      },
      {
        label: 'polygon',
        tool: 'polygon',
        icon: 'Polygon',
        props: {
          closed: true
        }
      },
      {
        label: 'highlight',
        tool: 'highlight',
        icon: 'Highlight'
      },
      {
        label: 'roundedRectangle',
        tool: 'roundedRectangle',
        icon: 'RoundedRectangle'
      },
      {
        label: 'changemark',
        tool: 'changemark',
        icon: 'Changemark',
        props: {
          fill: '#f05822dd'
        } // OpenText "Burnt" color
      }
    ]
  }
]
var tabContainerWithMarkups = {
  sidebarName: 'tabContainerWithMarkups',
  primary: 'primary',
  tabs: [
    {
      component: 'ThumbnailPane',
      title: 'tab.thumbnails'
    },
    {
      component: 'StampRasterPane',
      title: 'tab.stampRaster',
      layoutKey: 'markupTools'
    },
    {
      component: 'MarkupPane',
      title: 'tab.tools',
      layoutKey: 'markupTools'
    },
    {
      component: 'MarkupDetails',
      title: 'tab.markups'
    }
  ]
}

var setPredicates = function setPredicates(viewer) {
  viewer.deletableMarkupPredicate = function (markup) {
    return true
  }

  viewer.editableMarkupPredicate = function (markup) {
    return true
  }

  viewer.commentableMarkupPredicate = function (markup) {
    return true
  }

  viewer.deletableStampPredicate = function (stamp) {
    return true
  }

  viewer.editableStampPredicate = function (stamp) {
    return true
  }

  viewer.addableStampPredicate = function (stamp) {
    return true
  }

  viewer.visibleToolPropertyPredicate = function (key) {
    return true
  }

  viewer.visibleCommandPredicate = function (key) {
    return true
  }
}

var sampleLayout = {
  topToolbar: 'sampleToolbar',
  sampleToolbar: {
    left: [
      {
        component: 'ZoomInButton'
      },
      {
        component: 'ZoomOutButton'
      }
    ],
    center: [
      {
        component: 'TitleText',
        style: {
          marginLeft: '2em'
        }
      }
    ],
    right: [
      {
        component: 'CloseButton'
      }
    ]
  },
  container: {
    component: 'PageContainer',
    layoutKey: 'sampleMainLayout'
  },
  sampleMainLayout: {
    panes: [
      {
        component: 'PageContainer'
      }
    ]
  }
}
var annotationsLayout = {
  topToolbar: 'sampleToolbar',
  sampleToolbar: {
    left: [
      {
        component: 'ToggleSidebarButton',
        side: 'tabContainerWithMarkups'
      },
      {
        component: 'ZoomInButton'
      },
      {
        component: 'ZoomOutButton'
      },
      {
        component: 'SaveButton'
      },
      {
        component: 'ExportButton',
        format: 'pdf'
      }
    ],
    center: [
      {
        component: 'TitleText',
        style: {
          marginLeft: '2em'
        }
      }
    ],
    right: [
      {
        component: 'CloseButton'
      }
    ]
  },
  container: {
    component: 'FullSizeSplitPane',
    layoutKey: 'mainContainer'
  },
  mainContainer: [
    {
      component: 'TabContainer',
      layoutKey: 'tabContainerWithMarkups'
    },
    {
      component: 'PageContainer'
    }
  ],
  markupTools: markupTools,
  pdfExport: pdfExport,
  pdfExportActions: pdfExportActions,
  pdfExportDefaults: pdfExportDefaults,
  tabContainerWithMarkups: tabContainerWithMarkups,
  exportDialogs: ['pdf'],
  pageSizeOptions: pageSizeOptions,
  isoOptions: isoOptions,
  orientationOptions: orientationOptions,
  layerOptions: layerOptions,
  coloringOptions: coloringOptions,
  fontOptions: fontOptions,
  compressionOptions: compressionOptions,
  colorConversionOptions: colorConversionOptions,
  colorDepthOptions: colorDepthOptions,
  pageOutputOptions: pageOutputOptions
}
var graphicalCompareLayout = {
  topToolbar: 'compareToolbar',
  compareToolbar: {
    left: [
      {
        component: 'ToggleSidebarButton',
        side: 'tabContainerWithMarkups'
      },
      {
        component: 'ZoomInButton'
      },
      {
        component: 'ZoomOutButton'
      },
      {
        component: 'SaveButton'
      },
      {
        component: 'ExportButton',
        format: 'pdf'
      },
      {
        component: 'CompareStartOnlyButton'
      },
      {
        component: 'CompareEndOnlyButton'
      },
      {
        component: 'CompareOverlayDiffButton'
      },
      {
        component: 'CompareOverlayButton'
      },
      {
        component: 'CompareSideBySideButton'
      },
      {
        component: 'CompareOpacitySlider'
      }
    ],
    center: [],
    right: [
      {
        component: 'GradientFade',
        style: {
          position: 'relative',
          right: '24px'
        }
      },
      {
        component: 'SearchTextInput',
        style: {
          right: '6em'
        }
      },
      {
        component: 'PageSelector',
        style: {
          marginLeft: '0.5em'
        }
      },
      {
        component: 'SearchToggleButton',
        size: 20
      }
    ]
  },
  container: {
    component: 'FullSizeSplitPane',
    layoutKey: 'mainContainer'
  },
  mainContainer: [
    {
      component: 'TabContainer',
      layoutKey: 'tabContainerWithMarkups'
    },
    {
      component: 'CompareContainer',
      layoutKey: 'CompareContainer'
    }
  ],
  markupTools: markupTools,
  pdfExport: pdfExport,
  pdfExportActions: pdfExportActions,
  pdfExportDefaults: pdfExportDefaults,
  tabContainerWithMarkups: tabContainerWithMarkups,
  exportDialogs: ['pdf']
}
var textCompareLayout = {
  topToolbar: 'compareToolbar',
  compareToolbar: {
    left: [
      {
        component: 'ToggleSidebarButton',
        side: 'tabContainerWithMarkups'
      },
      {
        component: 'ZoomInButton'
      },
      {
        component: 'ZoomOutButton'
      },
      {
        component: 'SaveButton'
      },
      {
        component: 'ExportButton',
        format: 'pdf'
      },
      {
        component: 'ZoomToRectangleButton'
      },
      {
        component: 'ZoomExtentsButton'
      },
      {
        component: 'ZoomWidthButton'
      },
      {
        component: 'ZoomInButton'
      },
      {
        component: 'ZoomOutButton'
      }
    ],
    center: [],
    right: [
      {
        component: 'GradientFade',
        style: {
          position: 'relative',
          right: '24px'
        }
      },
      {
        component: 'SearchTextInput',
        style: {
          right: '6em'
        }
      },
      {
        component: 'PageSelector',
        style: {
          marginLeft: '0.5em'
        }
      },
      {
        component: 'SearchToggleButton',
        size: 20
      }
    ]
  },
  container: {
    component: 'FullSizeSplitPane',
    layoutKey: 'mainContainer'
  },
  mainContainer: [
    {
      component: 'TabContainer',
      layoutKey: 'tabContainerWithMarkups'
    },
    {
      component: 'TextCompareContainer',
      layoutKey: 'TextCompareContainer'
    }
  ],
  markupTools: markupTools,
  pdfExport: pdfExport,
  pdfExportActions: pdfExportActions,
  pdfExportDefaults: pdfExportDefaults,
  tabContainerWithMarkups: tabContainerWithMarkups,
  exportDialogs: ['pdf']
}
var layouts = [
  {
    name: 'Simple',
    layout: sampleLayout,
    onSelected: function onSelected(viewer) {
      setPredicates(viewer)
      clearViewer(viewer)
      enablePublicationSelector(window.publications, false)
      var primaryPublicationSelector = document.querySelector('#primary-publication-selector')
      viewer.viewPublication(primaryPublicationSelector.value || window.publications[0].id)
    }
  },
  {
    name: 'Simple with annotations',
    layout: annotationsLayout,
    onSelected: function onSelected(viewer) {
      setPredicates(viewer)
      clearViewer(viewer)
      viewer.setActiveTab('tab.tools', 'tabContainerWithMarkups')
      viewer.setSidebarWidth(350, 'tabContainerWithMarkups')
      viewer.setSidebarOpen(true, 'tabContainerWithMarkups')
      enablePublicationSelector(window.publications, false)
      var primaryPublicationSelector = document.querySelector('#primary-publication-selector')
      viewer.viewPublication(primaryPublicationSelector.value || window.publications[0].id)
    }
  },
  {
    name: 'Graphical compare',
    layout: graphicalCompareLayout,
    onSelected: function onSelected(viewer) {
      setPredicates(viewer)
      viewer.setActiveTab('tab.tools', 'tabContainerWithMarkups')
      viewer.setSidebarWidth(350, 'tabContainerWithMarkups')
      viewer.setSidebarOpen(true, 'tabContainerWithMarkups')
      var primaryPublicationSelector = document.querySelector('#primary-publication-selector')
      var comparePublicationSelector = document.querySelector('#compare-publication-selector')
      viewer.comparePublications(
        primaryPublicationSelector.value || window.publications[0].id,
        comparePublicationSelector.value || window.publications[0].id,
        'sideBySide'
      )
      enablePublicationSelector(window.publications, true)
    }
  },
  {
    name: 'Text compare',
    layout: textCompareLayout,
    onSelected: function onSelected(viewer) {
      setPredicates(viewer)
      viewer.setActiveTab('tab.tools', 'tabContainerWithMarkups')
      viewer.setSidebarWidth(350, 'tabContainerWithMarkups')
      viewer.setSidebarOpen(true, 'tabContainerWithMarkups')
      var primaryPublicationSelector = document.querySelector('#primary-publication-selector')
      var comparePublicationSelector = document.querySelector('#compare-publication-selector')
      viewer.comparePublications(
        primaryPublicationSelector.value || window.publications[0].id,
        comparePublicationSelector.value || window.publications[0].id,
        'text'
      )
      enablePublicationSelector(window.publications, true)
    }
  }
]
var currentLayout = ''
var enableLayoutSwitcher = function enableLayoutSwitcher(viewer) {
  var controlPanel = document.querySelector('.controls')
  controlPanel.classList.remove('hidden')
  controlPanel.addEventListener('click', function (e) {
    e.preventDefault()

    if (e.target.matches('button.layout')) {
      var layoutName = e.target.dataset.layout
      setLayout(layoutName, viewer)
    }
  })
  layouts.forEach(function (layout) {
    var btn = document.createElement('button')
    btn.classList.add('layout')
    btn.dataset.layout = layout.name
    btn.textContent = layout.name
    btn.title = layout.name
    controlPanel.appendChild(btn)
  })
}
var clearViewer = function clearViewer(viewer) {
  currentLayout.includes('Compare') && viewer.clearViewer()
}
var setLayout = function setLayout(layoutName, viewer) {
  if (currentLayout !== layoutName) {
    var selectedLayout = layouts.find(function (l) {
      return l.name === layoutName
    })
    viewer.setLayout(selectedLayout.layout)
    selectedLayout.onSelected && selectedLayout.onSelected(viewer)
    document.querySelectorAll('button.layout').forEach(function (el) {
      return el.classList.remove('current')
    })
    document
      .querySelector('button.layout[data-layout="'.concat(layoutName, '"]'))
      .classList.add('current')
    currentLayout = layoutName
  }
}

var shouldRefresh = function shouldRefresh() {
  if (!window.accessTokenRefreshedAt) {
    return true
  } // use half of the token life as window.

  var refreshedAt = new Date(window.accessTokenRefreshedAt)
  var EXPIRATION_WINDOW_IN_SECONDS = window.accessTokenExpires ? window.accessTokenExpires / 2 : 300
  var expirationWindowStart =
    refreshedAt.setSeconds(refreshedAt.getSeconds() + EXPIRATION_WINDOW_IN_SECONDS) / 1000
  var now = new Date()
  var nowInSeconds = now.getTime() / 1000
  return nowInSeconds >= expirationWindowStart
}

var refreshToken = function refreshToken() {
  return new Promise(function (resolve) {
    if (shouldRefresh()) {
      fetch('/ivsa/api/v1/refreshToken', {
        headers: {
          authorization: window.accessToken
        }
      }).then(function (res) {
        if (res.ok) {
          return res.json().then(function (body) {
            window.accessTokenRefreshedAt = new Date().getTime()
            window.accessToken = body.access_token
            window.accessTokenExpires = body.expires

            if (window.viewerApi) {
              window.viewerApi.setHttpHeaders({
                Authorization: window.accessToken
              })
            }
          })
        } else {
          return res.json().then(function (body) {
            window.alert('Unable to refresh authorization token\n\n'.concat(body.message))
          })
        }
      })
    }

    if (!window.accessTokenRefreshInterval) {
      window.accessTokenRefreshInterval = setInterval(function () {
        refreshToken()
      }, 60000 * 1)
    }

    return resolve()
  })
}

var startup = function startup(viewerAuthority) {
  refreshToken()
    .then(function () {
      return fetch(''.concat(viewerAuthority, '/viewer/api/v1/viewers/brava-view-1.x/loader'), {
        headers: {
          authorization: window.accessToken
        }
      })
    })
    .then(function (res) {
      return res.text()
    })
    .then(function (body) {
      var sc = document.createElement('script')
      sc.appendChild(document.createTextNode(body))
      document.body.appendChild(sc)
    })
}

waitForViewer().then(function (viewerName) {
  window.viewerApi = window[viewerName]
  setupEventListeners(viewerName)
  enableLayoutSwitcher(window.viewerApi)
  window.viewerApi.setSearchHost(window.highlightAuthority)
  window.viewerApi.setMarkupHost(window.markupAuthority)
  window.viewerApi.setHttpHeaders({
    Authorization: window.accessToken
  })
  window.viewerApi.setUserName('Viewer JS Sample')
  window.viewerApi.enableMarkup(false)
  setInitialPublications(window.publications, window.viewerApi)
  setLayout('Simple', window.viewerApi)
})
startup(window.viewerAuthority)
