const lastEvents = []
const eventThreshold = 100

/* istanbul ignore next */
export const logEvent = (event, details) => {
  const eventLog = document.querySelector('#event-log')
  lastEvents.push(event)
  if (lastEvents.length > eventThreshold) {
    lastEvents.shift()
    eventLog.querySelector('p.event:last-of-type').remove()
  }
  const evt = document.createElement('p')
  evt.classList.add('event')
  const evtName = document.createElement('strong')
  evtName.textContent = `${event} `
  evtName.title = `${event}: ${details}`
  const evtDetails = document.createTextNode(details ? JSON.stringify(details) : '')
  evt.appendChild(evtName)
  evt.appendChild(evtDetails)
  eventLog.prepend(evt)
}
