let compareMode = false

export const setInitialPublications = (publications = [], viewer) => {
  if (publications.length >= 1) {
    publications.map(m => viewer.addPublication({ publication: m }))
    if (publications.length > 1) {
      generatePublicationOptions(publications, viewer)
      enablePublicationSelector()
    }
  }

  viewer.render()
}

export const setInitialSourceFile = (sourceFile = undefined, publications = [], viewer) => {
  if (sourceFile) {
    generateQuickViewOptions(sourceFile, publications, viewer)
    enableQuickViewSelector(sourceFile)
  }
}

const addPublicationOptionsForElement = (namedPublications, select) => {
  namedPublications.forEach(publication => {
    const opt = document.createElement('option')
    opt.value = publication.publication.id
    opt.textContent = publication.name
    select.appendChild(opt)
  })
}

const addQuickViewOptionsForElement = (namedPublications, select) => {
  namedPublications.forEach(publication => {
    const opt = document.createElement('option')
    opt.value = JSON.stringify(publication.publication)
    opt.textContent = publication.name
    select.appendChild(opt)
  })
}

export const generatePublicationOptions = (publications, viewer) => {
  const namedPublications = publications.map(function (publication, i) {
    var _publication$featureS, _publication$featureS2, _publication$featureS3

    var publicationHintValue =
      publication === null || publication === void 0
        ? void 0
        : (_publication$featureS = publication.featureSettings) === null || _publication$featureS === void 0
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
        : (_publication$featureS3 = _publication$featureS2.value) === null || _publication$featureS3 === void 0
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

  const primaryPublicationSelector = document.querySelector('#primary-publication-selector')
  const quickViewPublicationSelector = document.querySelector('#quickview-publication-selector')
  const comparePublicationSelector = document.querySelector('#compare-publication-selector')
  const viewAsBinderInput = document.querySelector('#view-binder-toggle')
  const primaryControl = document.querySelector('.primary-control')

  addPublicationOptionsForElement(namedPublications, primaryPublicationSelector)
  addPublicationOptionsForElement(namedPublications, quickViewPublicationSelector)
  addPublicationOptionsForElement(namedPublications, comparePublicationSelector)

  const setPrimaryPublication = publicationId => {
    if (compareMode) {
      viewer.comparePublications(publicationId, comparePublicationSelector.value || publications[0].id)
    } else {
      viewer.viewPublication({ pid: publicationId })
    }
    viewer.setViewerVisible({ visible: true })
    // viewer.setCurrentPage(0)
  }

  const setComparePublication = publicationId => {
    if (compareMode) {
      viewer.comparePublications(primaryPublicationSelector.value || publications[0].id, publicationId)
    }
  }

  const handlePublicationSelection = ({ target: { id: elementId, value: publicationId } }) => {
    if (elementId === 'primary-publication-selector') {
      setPrimaryPublication(publicationId)
    } else {
      setComparePublication(publicationId)
    }
  }

  const handleBinderModeChange = ({ target: { checked: viewAsBinder } }) => {
    if (viewAsBinder) {
      viewer.viewBinder(publications.map(p => p.id))
      primaryControl.classList.add('hidden')
    } else {
      viewer.viewPublication({ pid: primaryPublicationSelector.value || publications[0].id })
      viewer.setViewerVisible({ visible: true })
      primaryControl.classList.remove('hidden')
    }
  }

  primaryPublicationSelector.addEventListener('change', handlePublicationSelection)
  comparePublicationSelector.addEventListener('change', handlePublicationSelection)
  viewAsBinderInput.addEventListener('change', handleBinderModeChange)
}

export const generateQuickViewOptions = (sourceFile, publications, viewer) => {
  const namedPublications = publications.map(function (publication, i) {
    const fileName =
      publication.fileName.indexOf('/') !== -1
        ? publication.fileName.split('/').pop()
        : publication.fileName.indexOf('\\') !== -1
        ? publication.fileName.split('\\').pop()
        : publication.fileName
    return {
      name: fileName,
      publication: publication
    }
  })

  const quickViewPublicationSelector = document.querySelector('#quickview-publication-selector')

  addQuickViewOptionsForElement(namedPublications, quickViewPublicationSelector)

  const handleQuickViewSelection = ({ target: { id: elementId, value: publicationStr } }) => {
    const sourceFileSelected = JSON.parse(publicationStr)
    if (elementId === 'quickview-publication-selector' && sourceFileSelected) {
      viewer.addCsrDocBySource({
        sourceFile: sourceFileSelected._links.download.href,
        formatHint: sourceFileSelected.mimeType,
        filenameHint: sourceFileSelected.fileName,
        view: true
      })
    }
  }

  quickViewPublicationSelector.addEventListener('change', handleQuickViewSelection)
}

export const enablePublicationSelector = (viewer, publications = [], compare = false) => {
  if (publications.length > 1) {
    const binderControl = document.querySelector('.binder-control')
    const primaryControl = document.querySelector('.primary-control')
    const compareControl = document.querySelector('.compare-control')
    const quickviewControl = document.querySelector('.quickview-control')
    quickviewControl.classList.add('hidden')

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
        viewer.viewBinder(publications.map(p => p.id))
      } else {
        primaryControl.classList.remove('hidden')
      }
      compareControl.classList.add('hidden')
    }
  }
}

export const enableQuickViewSelector = (sourceFile = undefined) => {
  if (sourceFile) {
    const primaryControl = document.querySelector('.primary-control')

    document.querySelector('.publication-controls').classList.remove('hidden')
    primaryControl.classList.add('hidden')
  }
}
