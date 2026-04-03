/**
 * RPG 风格角色详情面板 — 可拖拽，移动端全屏
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { getEmployeeById, DEPARTMENTS } from '../data/employees'
import type { CharacterState } from '../game/simulation'
import { OverviewTab, SkillsTab, BlogsTab, TimelineTab } from './CharacterTabs'
import '../styles/pixel-ui.css'

interface Props {
  readonly char: CharacterState
  readonly onClose: () => void
}

type Tab = 'overview' | 'skills' | 'blogs' | 'timeline'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: '概览' },
  { id: 'skills', label: '技能' },
  { id: 'blogs', label: '博客' },
  { id: 'timeline', label: '成长' },
]

const isMobileDevice = () => window.matchMedia('(pointer: coarse)').matches

export function CharacterPanel({ char, onClose }: Props) {
  const profile = getEmployeeById(char.employee.id)
  const [tab, setTab] = useState<Tab>('overview')
  const [pos, setPos] = useState({ x: 120, y: 60 })
  const dragging = useRef<{ ox: number; oy: number } | null>(null)
  const mobile = isMobileDevice()

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (mobile) return
    dragging.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y }
  }, [pos, mobile])

  useEffect(() => {
    if (mobile) return
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - dragging.current.ox, y: e.clientY - dragging.current.oy })
    }
    const onUp = () => { dragging.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [mobile])

  if (!profile) return null

  const dept = DEPARTMENTS.find(d => d.name === profile.department)

  const panelStyle: React.CSSProperties = mobile
    ? {
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 80,
        animation: 'pixel-open 0.15s ease-out',
      }
    : {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 320,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
        animation: 'pixel-open 0.15s ease-out',
      }

  return (
    <div className="pixel-window" style={panelStyle}>
      <div
        className="pixel-window-header"
        style={{ cursor: mobile ? 'default' : 'grab' }}
        onMouseDown={onMouseDown}
      >
        <span className="pixel-window-title" style={{ color: dept?.color ?? '#7a9aba', fontSize: 11 }}>
          {dept?.icon} {char.employee.department}
        </span>
        <button className="pixel-btn pixel-btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="pixel-tab-bar" style={{ background: '#0a1020', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`pixel-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pixel-scroll" style={{ overflow: 'auto', flex: 1 }}>
        {tab === 'overview' && <OverviewTab profile={profile} />}
        {tab === 'skills' && <SkillsTab profile={profile} />}
        {tab === 'blogs' && <BlogsTab profile={profile} />}
        {tab === 'timeline' && <TimelineTab profile={profile} />}
      </div>
    </div>
  )
}
