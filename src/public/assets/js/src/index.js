import { setupEventListeners, waitForViewer } from './events'
import { enableLayoutSwitcher, setLayout } from './layout'
import { setInitialPublications } from './documents'
import { startup } from './startup'

waitForViewer().then((viewerName) => {
  window.viewerApi = window[viewerName]

  setupEventListeners(viewerName)
  enableLayoutSwitcher(window.viewerApi)

  window.viewerApi.setSearchHost(window.highlightAuthority)
  window.viewerApi.setMarkupHost(window.markupAuthority)
  window.viewerApi.setHttpHeaders({ Authorization: window.accessToken })
  window.viewerApi.setUserName('Viewer JS Sample')
  window.viewerApi.enableMarkup(false)

  setInitialPublications(window.publications, window.viewerApi)

  setLayout('Simple', window.viewerApi)
})

startup(window.viewerAuthority)
