import AV from 'leancloud-storage'

import globalConfig from './config'

// Init Leancloud
AV.init(globalConfig.leancloud)

export function config() {
  return {
    onError(err) {
      err.preventDefault()
    },
  }
}

window.LOG = console.log
if (process.env.NODE_ENV !== 'development') {
  console.log = function () { }
  console.warn = function () { }
  console.error = function () { }
}
