/**
 * 员工图鉴 — 全屏 RPG 风格面板
 * 网格卡片布局，支持部门筛选和搜索
 */
import { useState, useMemo } from 'react'
import { getEmployees, DEPARTMENTS, type EmployeeProfile } from '../data/employees'
import '../styles/pixel-ui.css'

interface Props {
  readonly onClose: () => void
  readonly onSelectEmployee?: (id: number) => void
}

const STATUS_COLORS: Record<string, string> = {
  '初级': '#4a7a5a',
  '中级': '#4a6a9a',
  '高级': '#8a6a4a',
  '资深': '#7a4a8a',
  '专家': '#9a3a3a',
}

function EmployeeCard({
  profile,
  onClick,
}: {
  profile: EmployeeProfile
  onClick: () => void
}) {
  const dept = DEPARTMENTS.find(d => d.name === profile.department)
  const levelColor = STATUS_COLORS[profile.level] ?? '#4a6a8a'
  const hue = (profile.avatarSeed * 47) % 360
  const skin = ['#f4c0a0', '#e8a080', '#c88060', '#a06040'][profile.avatarSeed % 4]
  const shirt = `hsl(${hue}, 60%, 40%)`
  const hair = `hsl(${(profile.avatarSeed * 83) % 360}, 50%, 30%)`

  return (
    <div
      onClick={onClick}
      style={{
        background: '#0a1020',
        border: '2px solid #1a3a5a',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = dept?.color ?? '#4a7aba'
        e.currentTarget.style.boxShadow = `0 0 12px ${dept?.color ?? '#4a7aba'}44`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1a3a5a'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* 部门色条 */}
      <div style={{ height: 4, background: dept?.color ?? '#4a6a8a' }} />

      {/* 内容 */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        {/* 头像 + 名字 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated', flexShrink: 0 }}>
            <rect width="16" height="16" fill="#0a1520" />
            <rect x="5" y="2" width="6" height="1" fill={hair} />
            <rect x="4" y="3" width="8" height="1" fill={hair} />
            <rect x="4" y="4" width="8" height="5" fill={skin} />
            <rect x="5" y="5" width="2" height="2" fill="#1a1a2a" />
            <rect x="9" y="5" width="2" height="2" fill="#1a1a2a" />
            <rect x="5" y="5" width="1" height="1" fill="#fff" />
            <rect x="9" y="5" width="1" height="1" fill="#fff" />
            <rect x="6" y="8" width="4" height="1" fill="#c07060" />
            <rect x="4" y="10" width="8" height="4" fill={shirt} />
            <rect x="4" y="14" width="3" height="2" fill="#2a3a5a" />
            <rect x="9" y="14" width="3" height="2" fill="#2a3a5a" />
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c8d8e8', fontFamily: 'monospace' }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 9, color: '#5a7a8a', marginTop: 1 }}>{profile.englishName}</div>
          </div>
        </div>

        {/* 职位 */}
        <div style={{ marginTop: 6, fontSize: 10, color: '#7a8a9a' }}>{profile.role}</div>

        {/* 职级徽章 */}
        <div style={{ marginTop: 6 }}>
          <span className="pixel-badge" style={{ color: levelColor, fontSize: 9 }}>
            {profile.level}
          </span>
        </div>

        {/* motto — hover 显示 */}
        <div style={{
          marginTop: 8,
          fontSize: 9,
          color: '#3a5a6a',
          fontStyle: 'italic',
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {profile.motto}
        </div>
      </div>
    </div>
  )
}

export function EmployeeGrid({ onClose, onSelectEmployee }: Props) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'teaching' | 'research' | 'creativity'>('name')

  const allEmployees = useMemo(() => getEmployees(), [])

  const filtered = useMemo(() => {
    let list = [...allEmployees]
    if (deptFilter) list = list.filter(e => e.department === deptFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.englishName.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh')
      return b.stats[sortBy] - a.stats[sortBy]
    })
    return list
  }, [allEmployees, deptFilter, search, sortBy])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        background: 'rgba(6, 10, 20, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pixel-fade-in 0.2s ease-out',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="pixel-window"
        style={{ width: '90vw', maxWidth: 900, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 标题栏 */}
        <div className="pixel-window-header">
          <span className="pixel-window-title">👥 员工图鉴</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace' }}>
              {filtered.length} / {allEmployees.length}
            </span>
            <button className="pixel-btn pixel-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div style={{
          padding: '8px 16px',
          background: '#080f1a',
          borderBottom: '1px solid #1a3a5a',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <input
            className="pixel-input"
            placeholder="搜索姓名/职位..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 160 }}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              className={`pixel-btn pixel-btn-ghost${deptFilter === null ? ' active' : ''}`}
              style={{ padding: '4px 10px', fontSize: 10 }}
              onClick={() => setDeptFilter(null)}
            >
              全部
            </button>
            {DEPARTMENTS.map(d => (
              <button
                key={d.id}
                onClick={() => setDeptFilter(deptFilter === d.name ? null : d.name)}
                style={{
                  padding: '3px 8px',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: `1px solid ${d.color}55`,
                  background: deptFilter === d.name ? `${d.color}33` : 'transparent',
                  color: deptFilter === d.name ? d.color : `${d.color}aa`,
                  transition: 'all 0.15s',
                }}
              >
                {d.icon} {d.name}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#3a5a6a', fontFamily: 'monospace' }}>排序:</span>
            {(['name', 'teaching', 'research', 'creativity'] as const).map(k => (
              <button
                key={k}
                onClick={() => setSortBy(k)}
                style={{
                  padding: '3px 8px',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: '1px solid #2a4a6a',
                  background: sortBy === k ? '#1a3a5a' : 'transparent',
                  color: sortBy === k ? '#c8d8e8' : '#4a6a7a',
                }}
              >
                {k === 'name' ? '姓名' : k === 'teaching' ? '教学力' : k === 'research' ? '研发力' : '创造力'}
              </button>
            ))}
          </div>
        </div>

        {/* 网格 */}
        <div
          className="pixel-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            alignContent: 'start',
          }}
        >
          {filtered.map(emp => (
            <EmployeeCard
              key={emp.id}
              profile={emp}
              onClick={() => {
                onSelectEmployee?.(emp.id)
                onClose()
              }}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 40,
              color: '#2a4a5a',
              fontFamily: 'monospace',
              fontSize: 12,
            }}>
              没有找到匹配的员工
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
