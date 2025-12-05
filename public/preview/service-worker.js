// Simple MIME type mapping
const mimeTypes = {
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  jsx: 'text/javascript',
  ts: 'text/javascript',
  tsx: 'text/javascript',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  eot: 'application/vnd.ms-fontobject',
}

function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return mimeTypes[ext] || 'text/plain'
}

const _self = self

let resolveInit
let files = []
let scope = ''

const initPromise = new Promise((resolve) => {
  resolveInit = resolve
})

_self.addEventListener('message', (event) => {
  const eventData = event.data
  if (eventData.type === 'init') {
    files = eventData.files
    scope = eventData.scope
    resolveInit()
  }
})

_self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      await initPromise
      const requestUrl = new URL(event.request.url)
      if (requestUrl.pathname.startsWith(scope)) {
        const filename = requestUrl.pathname
          .replace(scope, '')
          .replace(/^\//, '')
        const file = files.find(
          (f) => f.filename === filename || f.filename === `/${filename}`
        )
        if (file) {
          const contentType = getMimeType(file.filename)
          return new Response(file.text, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cross-Origin-Embedder-Policy': 'require-corp',
            },
          })
        }
      }
      return fetch(event.request)
    })()
  )
})
