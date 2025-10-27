import { setupEventListeners, waitForViewer } from './events'
import { enableLayoutSwitcher, setLayout } from './layout'
import { setInitialPublications, setInitialSourceFile } from './documents'
import { viewerLinkFromSearchString, uiOptionsFromSearchString } from './link'
import { startup } from './startup'
import { logEvent } from './utils/log'

waitForViewer(window.viewerAuthority).then(ViewerFactory => {
  window.viewerApi = ViewerFactory.createViewer()
  logEvent('Viewer loaded:', window.viewerApi.id)
  setupEventListeners(window.viewerApi.id)
  enableLayoutSwitcher(window.viewerApi)

  window.viewerApi.setViewerOptions({
    options: {
      viewerHost: window.viewerAuthority,
      searchHost: window.highlightAuthority,
      httpHeaders: {
        Authorization: window.accessToken
      }
    }
  })
  // window.viewerApi.setUserName('Viewer JS Sample')

  if (window.sourceFile) {
    setInitialSourceFile(window.sourceFile, window.publications, window.viewerApi)
  } else {
    setInitialPublications(window.publications, window.viewerApi)
  }

  setLayout(window.uiOptions.layout || 'Default', window.viewerApi)
})

window.uiOptions = uiOptionsFromSearchString(window.location.search)
window.uiOptions && console.log(`UI Options ${JSON.stringify(window.uiOptions)}`)
window.viewerLink = viewerLinkFromSearchString(window.location.search)
window.viewerLink && console.log(`Viewer link ${JSON.stringify(window.viewerLink)}`)

startup()
