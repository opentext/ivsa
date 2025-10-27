const shouldRefresh = () => {
  if (!window.accessTokenRefreshedAt) {
    return true
  }

  // use half of the token life as window.
  const refreshedAt = new Date(window.accessTokenRefreshedAt)
  const EXPIRATION_WINDOW_IN_SECONDS = window.accessTokenExpires ? window.accessTokenExpires / 2 : 300
  const expirationWindowStart = refreshedAt.setSeconds(refreshedAt.getSeconds() + EXPIRATION_WINDOW_IN_SECONDS) / 1000
  const now = new Date()
  const nowInSeconds = now.getTime() / 1000
  return nowInSeconds >= expirationWindowStart
}

const refreshToken = () => {
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
              window.viewerApi.setViewerOptions({
                options: {
                  httpHeaders: {
                    Authorization: window.accessToken
                  }
                }
              })
            }
          })
        } else {
          return res.json().then(function (body) {
            window.alert(`Unable to refresh authorization token\n\n${body.message}`)
          })
        }
      })
    }

    if (!window.accessTokenRefreshInterval) {
      window.accessTokenRefreshInterval = setInterval(() => {
        refreshToken()
      }, 60000 * 1)
    }

    return resolve()
  })
}

export const startup = () => {
  refreshToken()
}
