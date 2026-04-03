import { useRef, useEffect } from 'react'
import { Application } from 'pixi.js'
import { createGameEngine, type GameCallbacks, type GameEngine } from '../game/engine'
import { preloadAll } from '../game/spriteLoader'

interface Props {
  readonly started: boolean
  readonly callbacks: GameCallbacks
}

export function PixelCanvas({ started, callbacks }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false

    const init = async () => {
      const app = new Application()
      const w = el.clientWidth || window.innerWidth
      const h = el.clientHeight || window.innerHeight

      await app.init({
        width: w,
        height: h,
        background: 0x0f1923,
        antialias: false,
        resolution: window.devicePixelRatio,
        autoDensity: true,
      })

      if (cancelled) {
        app.destroy(true, { children: true })
        return
      }

      el.appendChild(app.canvas as HTMLCanvasElement)
      appRef.current = app

      const resizeObserver = new ResizeObserver(() => {
        const newW = el.clientWidth
        const newH = el.clientHeight
        if (newW > 0 && newH > 0) {
          app.renderer.resize(newW, newH)
        }
      })
      resizeObserver.observe(el)

      try {
        await preloadAll()
        engineRef.current = createGameEngine(app, callbacks)
      } catch (err) {
        console.error('Engine init failed:', err)
      }
    }

    init()

    return () => {
      cancelled = true
      engineRef.current?.destroy()
      engineRef.current = null
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (started && engineRef.current) {
      engineRef.current.startEntryAnimation()
    }
  }, [started])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    />
  )
}
