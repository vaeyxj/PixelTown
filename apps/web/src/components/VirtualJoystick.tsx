import { useRef, useCallback, useEffect } from 'react'

interface Props {
  readonly onInput: (dx: number, dy: number) => void
}

const BASE_R = 44
const KNOB_R = 18
const MAX_DIST = BASE_R - KNOB_R

export function VirtualJoystick({ onInput }: Props) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)

  const getCenter = () => {
    const el = baseRef.current
    if (!el) return { cx: 0, cy: 0 }
    const rect = el.getBoundingClientRect()
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 }
  }

  const applyInput = useCallback((clientX: number, clientY: number) => {
    const { cx, cy } = getCenter()
    let dx = clientX - cx
    let dy = clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > MAX_DIST) {
      dx = (dx / dist) * MAX_DIST
      dy = (dy / dist) * MAX_DIST
    }
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    }
    const ndx = dist > 4 ? dx / MAX_DIST : 0
    const ndy = dist > 4 ? dy / MAX_DIST : 0
    onInput(ndx, ndy)
  }, [onInput])

  const resetKnob = useCallback(() => {
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)'
    onInput(0, 0)
  }, [onInput])

  useEffect(() => {
    const el = baseRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return
      const t = e.changedTouches[0]
      touchIdRef.current = t.identifier
      applyInput(t.clientX, t.clientY)
    }

    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchIdRef.current) {
          e.preventDefault()
          applyInput(t.clientX, t.clientY)
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null
          resetKnob()
        }
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [applyInput, resetKnob])

  return (
    <div
      ref={baseRef}
      style={{
        position: 'fixed',
        bottom: 96,
        left: 24,
        width: BASE_R * 2,
        height: BASE_R * 2,
        borderRadius: '50%',
        background: 'rgba(6, 13, 24, 0.7)',
        border: '2px solid rgba(74, 232, 192, 0.4)',
        boxShadow: '0 0 12px rgba(74, 232, 192, 0.2)',
        zIndex: 100,
        touchAction: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: KNOB_R * 2,
          height: KNOB_R * 2,
          borderRadius: '50%',
          background: 'rgba(74, 232, 192, 0.5)',
          border: '2px solid rgba(74, 232, 192, 0.8)',
          boxShadow: '0 0 8px rgba(74, 232, 192, 0.4)',
          transition: 'transform 0.05s',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
