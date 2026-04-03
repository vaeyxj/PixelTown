/**
 * RPG 风格角色详情面板
 * 点击角色弹出，可拖拽，含属性雷达图、技能树、博客、成长时间线
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { getEmployeeById, DEPARTMENTS, type EmployeeProfile, type Stats } from '../data/employees'
import type { CharacterState } from '../game/simulation'
import '../styles/pixel-ui.css'

interface Props {
  readonly char: CharacterState
  readonly onClose: () => void
}

type Tab = 'overview' | 'skills' | 'blogs' | 'timeline'

// === 五维雷达图 ===
function drawRadar(canvas: HTMLCanvasElement, stats: Stats): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(cx, cy) - 24
  const n = 5
  const labels = ['教学力', '研发力', '创造力', '影响力', '协作力']
  const vals = [stats.teaching, stats.research, stats.creativity, stats.influence, stats.teamwork]

  ctx.clearRect(0, 0, w, h)

  // 背景格网
  for (let level = 1; level <= 5; level++) {
    const ratio = level / 5
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2
      const x = cx + r * ratio * Math.cos(a)
      const y = cy + r * ratio * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = level === 5 ? 'rgba(74, 106, 154, 0.5)' : 'rgba(74, 106, 154, 0.2)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 轴线
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI / n) - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
    ctx.strokeStyle = 'rgba(74, 106, 154, 0.35)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 数值多边形
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI / n) - Math.PI / 2
    const ratio = vals[i] / 100
    const x = cx + r * ratio * Math.cos(a)
    const y = cy + r * ratio * Math.sin(a)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(74, 186, 106, 0.18)'
  ctx.fill()
  ctx.strokeStyle = '#4aba6a'
  ctx.lineWidth = 2
  ctx.stroke()

  // 顶点圆点
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI / n) - Math.PI / 2
    const ratio = vals[i] / 100
    ctx.beginPath()
    ctx.arc(cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a), 3, 0, Math.PI * 2)
    ctx.fillStyle = '#4aba6a'
    ctx.fill()
  }

  // 标签
  ctx.fillStyle = '#7a9aba'
  ctx.font = '10px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI / n) - Math.PI / 2
    ctx.fillText(labels[i], cx + (r + 18) * Math.cos(a), cy + (r + 18) * Math.sin(a))
  }
}

// === 像素进度条 ===
function PixelBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            background: i < value ? color : '#1a2a3a',
            border: `1px solid ${i < value ? color : '#2a3a4a'}`,
            boxShadow: i < value ? `0 0 4px ${color}88` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// === 概览 Tab ===
function OverviewTab({ profile }: { profile: EmployeeProfile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (canvasRef.current) drawRadar(canvasRef.current, profile.stats)
  }, [profile.stats])

  const dept = DEPARTMENTS.find(d => d.name === profile.department)

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 像素头像 */}
        <div style={{ flexShrink: 0 }}>
          <PixelAvatar seed={profile.avatarSeed} size={64} />
          <div style={{
            marginTop: 6,
            textAlign: 'center',
            fontSize: 10,
            fontFamily: 'monospace',
            padding: '2px 6px',
            background: `${dept?.color ?? '#4a6a9a'}22`,
            border: `1px solid ${dept?.color ?? '#4a6a9a'}55`,
            color: dept?.color ?? '#7a9aba',
          }}>
            {dept?.icon} {profile.level}
          </div>
        </div>
        {/* 个人信息 */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e8f0f8', fontFamily: 'monospace' }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 11, color: '#7a9aba', marginTop: 2 }}>{profile.englishName}</div>
          <div style={{ fontSize: 11, color: '#8a9aaa', marginTop: 4 }}>{profile.role}</div>
          <div style={{
            marginTop: 8,
            fontSize: 10,
            color: '#5a7a6a',
            fontStyle: 'italic',
            fontFamily: 'monospace',
            background: 'rgba(74, 186, 106, 0.05)',
            border: '1px solid rgba(74, 186, 106, 0.15)',
            padding: '4px 8px',
          }}>
            "{profile.motto}"
          </div>
        </div>
      </div>

      {/* 简介 */}
      <div style={{
        marginTop: 12,
        fontSize: 11,
        color: '#8a9aaa',
        lineHeight: 1.6,
        padding: '8px 10px',
        background: 'rgba(10, 15, 30, 0.5)',
        borderLeft: '2px solid #2a4a6a',
      }}>
        {profile.bio}
      </div>

      {/* 雷达图 */}
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', marginBottom: 4 }}>
          ── 五维属性 ──
        </div>
        <canvas
          ref={canvasRef}
          width={180}
          height={180}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* 属性数值 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: 4 }}>
        {([
          ['教学力', profile.stats.teaching, '#4aba6a'],
          ['研发力', profile.stats.research, '#4a8aba'],
          ['创造力', profile.stats.creativity, '#ba8a4a'],
          ['影响力', profile.stats.influence, '#9a4aba'],
          ['协作力', profile.stats.teamwork, '#4ababc'],
        ] as [string, number, string][]).map(([label, val, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <span style={{ color: '#5a7a8a', width: 36, flexShrink: 0, fontFamily: 'monospace' }}>{label}</span>
            <div className="pixel-progress" style={{ flex: 1 }}>
              <div
                className="pixel-progress-fill"
                style={{ width: `${val}%`, background: color }}
              />
            </div>
            <span style={{ color, fontFamily: 'monospace', fontSize: 11, width: 24, textAlign: 'right' }}>
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* 标签 */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {profile.tags.map(tag => (
          <span key={tag} className="pixel-badge" style={{ color: '#7a9aba', fontSize: 9 }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// === 技能 Tab ===
function SkillsTab({ profile }: { profile: EmployeeProfile }) {
  const catColors: Record<string, string> = {
    tech: '#4a8aba',
    teaching: '#4aba6a',
    design: '#ba6a4a',
    management: '#9a4aba',
    research: '#4ababc',
  }
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...profile.skills].sort((a, b) => b.level - a.level).map(skill => (
          <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, width: 24 }}>{skill.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#c8d8e8', fontFamily: 'monospace', marginBottom: 4 }}>
                {skill.name}
              </div>
              <PixelBar value={skill.level} color={catColors[skill.category] ?? '#4a8aba'} />
            </div>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: catColors[skill.category] ?? '#4a8aba',
              width: 20,
              textAlign: 'right',
            }}>
              {skill.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// === 博客 Tab ===
function BlogsTab({ profile }: { profile: EmployeeProfile }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {profile.blogs.map((blog, i) => (
        <div key={i} style={{
          background: 'rgba(10, 15, 30, 0.5)',
          border: '1px solid #1a3a5a',
          cursor: 'pointer',
        }}>
          <div
            style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div>
              <div style={{ fontSize: 11, color: '#c8d8e8', fontFamily: 'monospace' }}>{blog.title}</div>
              <div style={{ fontSize: 10, color: '#4a6a7a', marginTop: 2 }}>{blog.date}</div>
            </div>
            <span style={{ color: '#4a6a8a', fontSize: 12 }}>{openIdx === i ? '▲' : '▼'}</span>
          </div>
          {openIdx === i && (
            <div style={{ padding: '0 10px 10px', borderTop: '1px solid #1a3a5a' }}>
              <p style={{ fontSize: 10, color: '#7a8a9a', lineHeight: 1.6, margin: '8px 0 6px' }}>
                {blog.summary}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {blog.tags.map(t => (
                  <span key={t} className="pixel-badge" style={{ color: '#4a7a9a', fontSize: 9 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// === 成长时间线 Tab ===
function TimelineTab({ profile }: { profile: EmployeeProfile }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[...profile.milestones].reverse().map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            {/* 时间轴线 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
              <div style={{
                width: 12,
                height: 12,
                background: '#1a3a5a',
                border: '2px solid #4a7aba',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 7,
              }}>
                {m.icon}
              </div>
              {i < profile.milestones.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 20, background: '#1a3a4a', margin: '2px 0' }} />
              )}
            </div>
            {/* 内容 */}
            <div style={{ flex: 1, paddingBottom: 14 }}>
              <div style={{ fontSize: 9, color: '#3a6a7a', fontFamily: 'monospace' }}>{m.date}</div>
              <div style={{ fontSize: 11, color: '#c8d8e8', fontWeight: 600, marginTop: 2 }}>{m.title}</div>
              <div style={{ fontSize: 10, color: '#6a7a8a', marginTop: 3, lineHeight: 1.5 }}>
                {m.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// === 像素头像 (基于 seed 生成颜色) ===
function PixelAvatar({ seed, size }: { seed: number; size: number }) {
  const hue = (seed * 47) % 360
  const skinColors = ['#f4c0a0', '#e8a080', '#c88060', '#a06040']
  const skin = skinColors[seed % skinColors.length]
  const hair = `hsl(${(seed * 83) % 360}, 50%, 30%)`
  const shirt = `hsl(${hue}, 60%, 40%)`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated', border: '2px solid #2a4a6a' }}
    >
      <rect width="16" height="16" fill="#0a1520" />
      {/* 头发 */}
      <rect x="5" y="2" width="6" height="1" fill={hair} />
      <rect x="4" y="3" width="8" height="1" fill={hair} />
      {/* 脸 */}
      <rect x="4" y="4" width="8" height="5" fill={skin} />
      {/* 眼睛 */}
      <rect x="5" y="5" width="2" height="2" fill="#1a1a2a" />
      <rect x="9" y="5" width="2" height="2" fill="#1a1a2a" />
      <rect x="5" y="5" width="1" height="1" fill="#fff" />
      <rect x="9" y="5" width="1" height="1" fill="#fff" />
      {/* 嘴 */}
      <rect x="6" y="8" width="4" height="1" fill="#c07060" />
      {/* 身体 */}
      <rect x="4" y="10" width="8" height="4" fill={shirt} />
      {/* 脚 */}
      <rect x="4" y="14" width="3" height="2" fill="#2a3a5a" />
      <rect x="9" y="14" width="3" height="2" fill="#2a3a5a" />
    </svg>
  )
}

// === 主面板 ===
export function CharacterPanel({ char, onClose }: Props) {
  const profile = getEmployeeById(char.employee.id)
  const [tab, setTab] = useState<Tab>('overview')
  const [pos, setPos] = useState({ x: 120, y: 60 })
  const dragging = useRef<{ ox: number; oy: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y }
  }, [pos])

  useEffect(() => {
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
  }, [])

  if (!profile) return null

  const dept = DEPARTMENTS.find(d => d.name === profile.department)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: '概览' },
    { id: 'skills', label: '技能' },
    { id: 'blogs', label: '博客' },
    { id: 'timeline', label: '成长' },
  ]

  return (
    <div
      className="pixel-window"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 320,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
        animation: 'pixel-open 0.15s ease-out',
      }}
    >
      {/* 标题栏 */}
      <div
        className="pixel-window-header"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
      >
        <span className="pixel-window-title" style={{ color: dept?.color ?? '#7a9aba', fontSize: 11 }}>
          {dept?.icon} {char.employee.department}
        </span>
        <button className="pixel-btn pixel-btn-close" onClick={onClose}>✕</button>
      </div>

      {/* 选项卡 */}
      <div className="pixel-tab-bar" style={{ background: '#0a1020', flexShrink: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`pixel-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="pixel-scroll" style={{ overflow: 'auto', flex: 1 }}>
        {tab === 'overview' && <OverviewTab profile={profile} />}
        {tab === 'skills' && <SkillsTab profile={profile} />}
        {tab === 'blogs' && <BlogsTab profile={profile} />}
        {tab === 'timeline' && <TimelineTab profile={profile} />}
      </div>
    </div>
  )
}
