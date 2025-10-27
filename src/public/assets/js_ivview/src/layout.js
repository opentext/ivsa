import { enablePublicationSelector } from './documents'

const sampleLayout = {
  sideToolbar: 'defaultSideToolbar',
  defaultSideToolbar: [
    { component: 'SearchTabButton' },
    { component: 'PagesTabButton' },
    { component: 'LayersTabButton' }
  ],
  topToolbar: 'defaultTopToolbar',
  defaultTopToolbar: {
    left: [{ component: 'ClosePreviewButton' }, { component: 'DocumentTitle' }],
    center: [{ component: 'ZoomControls' }, { component: 'PageSelector' }],
    right: [{ component: 'Maximize' }, { component: 'MoreAction' }]
  }
}

const accessibleLayout = {
  sideToolbar: 'defaultSideToolbar',
  defaultSideToolbar: [
    { component: 'SearchTabButton' },
    { component: 'PagesTabButton' },
    { component: 'LayersTabButton' }
  ],
  topToolbar: 'defaultTopToolbar',
  defaultTopToolbar: {
    a11y: true,
    left: [{ component: 'ClosePreviewButton' }, { component: 'DocumentTitle' }],
    center: [{ component: 'ZoomControls' }, { component: 'PageSelector' }],
    right: [{ component: 'Maximize' }, { component: 'MoreAction' }]
  }
}

const layouts = [
  {
    name: 'Default',
    layout: sampleLayout,
    title: 'View document with zoom in and zoom out features',
    onSelected: viewer => {
      clearViewer(viewer)
      // viewer.setUserName('Viewer JS Sample')
      if (window.sourceFile) {
        viewer.addCsrDocBySource({
          sourceFile: sourceFile._links.download.href,
          formatHint: sourceFile.mimeType,
          filenameHint: sourceFile.fileName,
          view: true
        })
      } else {
        enablePublicationSelector(viewer, window.publications, false)
        const primaryPublicationSelector = document.querySelector('#primary-publication-selector')
        if (
          window.viewerLink &&
          (window.viewerLink.type === 'rectangle' ||
            window.viewerLink.type === 'page' ||
            window.viewerLink.type === 'bookmark')
        ) {
          if (window.uiOptions && window.uiOptions.binderView && window.uiOptions.binderView === 'true') {
            const viewAsBinderInput = document.querySelector('#view-binder-toggle')
            viewAsBinderInput.checked = true
            const evt = new Event('change')
            viewAsBinderInput.dispatchEvent(evt)
          } else {
            primaryPublicationSelector.value = window.viewerLink.pid || window.publications[0].id
            viewer.viewPublication({ pid: primaryPublicationSelector.value })
          }
        } else {
          viewer.viewPublication({
            pid: primaryPublicationSelector.value || window.publications[0].id
          })
        }
        viewer.setViewerVisible({ visible: true })
      }
    }
  }
  /*{
    name: 'Accessibility',
    layout: accessibleLayout,
    title: 'Accessible content viewer for persons with disabilities',
    onSelected: (viewer) => {
      clearViewer(viewer)
      // viewer.setUserName('Viewer JS Sample')
      enablePublicationSelector(viewer, window.publications, false)
      const primaryPublicationSelector = document.querySelector('#primary-publication-selector')
      viewer.viewPublication({pid: primaryPublicationSelector.value || window.publications[0].id})
    }
  }*/
]

let currentLayout = ''

export const enableLayoutSwitcher = viewer => {
  const controlPanel = document.querySelector('.controls')
  controlPanel.classList.remove('hidden')
  controlPanel.addEventListener('click', e => {
    e.preventDefault()
    if (e.target.matches('button.layout')) {
      const layoutName = e.target.dataset.layout
      setLayout(layoutName, viewer)
    }
  })
  layouts.forEach(layout => {
    const btn = document.createElement('button')
    btn.classList.add('layout')
    btn.dataset.layout = layout.name
    btn.textContent = layout.name
    btn.title = layout.title
    controlPanel.appendChild(btn)
  })
}

export const clearViewer = viewer => {
  viewer.clearViewer()
}

export const setLayout = (layoutName, viewer) => {
  if (currentLayout !== layoutName) {
    const selectedLayout = layouts.find(l => l.name === layoutName)
    // viewer.setLayout(selectedLayout.layout)
    selectedLayout.onSelected && selectedLayout.onSelected(viewer)
    document.querySelectorAll('button.layout').forEach(el => el.classList.remove('current'))
    document.querySelector(`button.layout[data-layout="${layoutName}"]`).classList.add('current')
    currentLayout = layoutName
  }
  viewer.setViewerVisible({ visible: true })
}
