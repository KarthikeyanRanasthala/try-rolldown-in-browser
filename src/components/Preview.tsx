import { useEffect, useRef, useState } from 'react'
import type { SourceFile } from '@/types'

interface PreviewProps {
  files: SourceFile[]
}

export function Preview({ files }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const swRef = useRef<ServiceWorker | null>(null)
  const [swReady, setSwReady] = useState(false)
  const entry = files.find((f) => f.filename.includes('index.html'))

  // Register service worker once on mount
  useEffect(() => {
    let cancelled = false

    async function setup() {
      const registration = await navigator.serviceWorker.register(
        '/preview/service-worker.js',
        { scope: '/preview/' }
      )

      const sw = registration.active || registration.installing || registration.waiting
      if (!sw) return

      if (sw.state === 'activated') {
        if (!cancelled) {
          swRef.current = sw
          setSwReady(true)
        }
      } else {
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated' && !cancelled) {
            swRef.current = sw
            setSwReady(true)
          }
        })
      }
    }

    setup()

    return () => {
      cancelled = true
    }
  }, [])

  // Update files and reload iframe when files change
  useEffect(() => {
    if (!swReady || !swRef.current || !entry) return

    const t0 = performance.now()
    swRef.current.postMessage({
      type: 'init',
      files,
      scope: '/preview/',
    })
    console.log(`SW postMessage: ${(performance.now() - t0).toFixed(0)}ms`)

    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      const name = entry.filename.startsWith('/')
        ? entry.filename.slice(1)
        : entry.filename
      iframe.contentWindow.location.href = `/preview/${name}`
    }
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
