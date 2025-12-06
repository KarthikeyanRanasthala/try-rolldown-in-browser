import { useEffect, useState, useRef } from 'react'
import mime from 'mime'
import type { SourceFile } from '@/types'

interface PreviewProps {
  files: SourceFile[]
}

export function Preview({ files }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [swReady, setSwReady] = useState(false)
  const entry = files.find((f) => f.filename.includes('index.html'))

  // Register service worker once on mount
  useEffect(() => {
    let cancelled = false

    navigator.serviceWorker
      .register('/preview/service-worker.js', { scope: '/preview/' })
      .then((registration) => {
        const sw = registration.active || registration.installing || registration.waiting
        if (!sw) return

        if (sw.state === 'activated') {
          if (!cancelled) setSwReady(true)
        } else {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated' && !cancelled) setSwReady(true)
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Update files and reload iframe when files change
  useEffect(() => {
    if (!swReady || !entry) return

    const updateCache = async () => {
      const t0 = performance.now()
      const cache = await caches.open('preview')

      // Clear old files and add new ones
      const keys = await cache.keys()
      await Promise.all(keys.map((key) => cache.delete(key)))

      await Promise.all(
        files.map((file) => {
          const filename = file.filename.startsWith('/')
            ? file.filename.slice(1)
            : file.filename
          const url = `/preview/${filename}`
          const contentType = mime.getType(filename) || 'text/plain'

          return cache.put(
            url,
            new Response(file.text, {
              headers: {
                'Content-Type': contentType,
                'Cross-Origin-Embedder-Policy': 'require-corp',
              },
            })
          )
        })
      )

      console.log(`Cache API: ${files.length} files, ${(performance.now() - t0).toFixed(1)}ms`)
    }

    updateCache().then(() => {
      const iframe = iframeRef.current
      if (iframe?.contentWindow) {
        const name = entry.filename.startsWith('/')
          ? entry.filename.slice(1)
          : entry.filename
        iframe.contentWindow.location.href = `/preview/${name}`
      }
    })
  }, [files, entry, swReady])

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No index.html found in output
      </div>
    )
  }

  return (
    <iframe
      className="w-full h-full border-none bg-white"
      src="/preview"
      ref={iframeRef}
    />
  )
}
