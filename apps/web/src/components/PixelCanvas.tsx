import { useRef, useEffect } from 'react'
import { Application } from 'pixi.js'
import { createOfficeMap } from '../game/mapRenderer'

export function PixelCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let destroyed = false
    let mapCleanup: (() => void) | undefined

    const init = async () => {
      const app = new Application()
      await app.init({
        resizeTo: el,
        background: 0x1a1a2e,
        antialias: false,
        resolution: window.devicePixelRatio,
        autoDensity: true,
      })

      if (destroyed) {
        app.destroy(true)
        return
      }

      el.appendChild(app.canvas as HTMLCanvasElement)
      appRef.current = app

      const { destroy } = createOfficeMap(app)
      mapCleanup = destroy
    }

    init()

    return () => {
      destroyed = true
      mapCleanup?.()
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'grab',
        imageRendering: 'pixelated',
      }}
    />
  )
}
