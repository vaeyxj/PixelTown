/**
 * 团队数据仪表盘 — RPG 风格数据面板
 * 展示部门分布、五维属性均值、技能分布
 */
import { useMemo, useRef, useEffect } from 'react'
import { getDepartmentStats, getEmployees, DEPARTMENTS } from '../data/employees'
import type { EmployeeStatus } from '../game/simulation'
import '../styles/pixel-ui.css'

interface Props {
  readonly onClose: () => void
  readonly stats: Record<EmployeeStatus, number>
  readonly timeStr: string
}

const STATUS_LABELS: Record<EmployeeStatus, { label: string; color: string; icon: string }> = {
  working: { label: '工作中', color: '#4aba6a', icon: '💻' },
  meeting: { label: '会议中', color: '#baba4a', icon: '🗣️' },
  lunch:   { label: '午休中', color: '#8a6ab5', icon: '🍱' },
  dinner:  { label: '晚餐中', color: '#b56a8a', icon: '🍽️' },
  walking: { label: '走动中', color: '#4a9aba', icon: '🚶' },
  idle:    { label: '空闲',   color: '#7a8a9a', icon: '😊' },
  away:    { label: '未到',   color: '#4a4a5a', icon: '🏠' },
}

// === 横向像素条形图 ===
function BarChart({
  items,
  max,
}: {
  items: readonly { label: string; value: number; color: string }[]
  max: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="pixel-text"
            style={{ width: 52, fontSize: 10, color: '#6a8a9a', textAlign: 'right', flexShrink: 0 }}
          >
            {label}
          </span>
          <div
            className="pixel-progress"
            style={{ flex: 1, height: 10 }}
          >
            <div
              className="pixel-progress-fill"
              style={{ width: `${(value / max) * 100}%`, background: color }}
            />
          </div>
          <span
            className="pixel-text"
            style={{ width: 20, fontSize: 11, color, textAlign: 'right', flexShrink: 0 }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

// === 五维均值雷达 ===
function TeamRadar({ width = 160, height = 160 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const employees = useMemo(() => getEmployees(), [])

  const avgStats = useMemo(() => {
    const n = employees.length
    if (n === 0) return { teaching: 0, research: 0, creativity: 0, influence: 0, teamwork: 0 }
    return {
      teaching:   Math.round(employees.reduce((s, e) => s + e.stats.teaching, 0) / n),
      research:   Math.round(employees.reduce((s, e) => s + e.stats.research, 0) / n),
      creativity: Math.round(employees.reduce((s, e) => s + e.stats.creativity, 0) / n),
      influence:  Math.round(employees.reduce((s, e) => s + e.stats.influence, 0) / n),
      teamwork:   Math.round(employees.reduce((s, e) => s + e.stats.teamwork, 0) / n),
    }
  }, [employees])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(cx, cy) - 22
    const n = 5
    const labels = ['教学力', '研发力', '创造力', '影响力', '协作力']
    const vals = [avgStats.teaching, avgStats.research, avgStats.creativity, avgStats.influence, avgStats.teamwork]

    ctx.clearRect(0, 0, width, height)

    // 网格
    for (let lv = 1; lv <= 5; lv++) {
      const ratio = lv / 5
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const a = (i * 2 * Math.PI / n) - Math.PI / 2
        const x = cx + r * ratio * Math.cos(a)
        const y = cy + r * ratio * Math.sin(a)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = lv === 5 ? 'rgba(74, 106, 154, 0.5)' : 'rgba(74, 106, 154, 0.18)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    // 轴线
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      ctx.strokeStyle = 'rgba(74, 106, 154, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    // 数值区域
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
    ctx.fillStyle = 'rgba(74, 138, 186, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#4a8aba'
    ctx.lineWidth = 2
    ctx.stroke()
    // 顶点
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2
      const ratio = vals[i] / 100
      ctx.beginPath()
      ctx.arc(cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a), 3, 0, Math.PI * 2)
      ctx.fillStyle = '#4a8aba'
      ctx.fill()
    }
    // 标签
    ctx.font = '10px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI / n) - Math.PI / 2
      ctx.fillStyle = '#5a7a9a'
      ctx.fillText(labels[i], cx + (r + 16) * Math.cos(a), cy + (r + 16) * Math.sin(a))
      // 均值数字
      const ratio = vals[i] / 100
      ctx.fillStyle = '#4a8aba'
      ctx.fillText(
        String(vals[i]),
        cx + (r * ratio + 10) * Math.cos(a),
        cy + (r * ratio + 10) * Math.sin(a),
      )
    }
  }, [avgStats, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export function StatsDashboard({ onClose, stats, timeStr }: Props) {
  const deptStats = useMemo(() => getDepartmentStats(), [])
  const employees = useMemo(() => getEmployees(), [])

  // 实时状态分布（饼图数据）
  const statusItems = useMemo(() =>
    (Object.entries(STATUS_LABELS) as [EmployeeStatus, typeof STATUS_LABELS[EmployeeStatus]][])
      .map(([key, { label, color, icon }]) => ({
        label: `${icon} ${label}`,
        value: stats[key] ?? 0,
        color,
      }))
      .filter(item => item.value > 0),
    [stats],
  )
  const totalOnline = useMemo(() =>
    Object.values(stats).reduce((a, b) => a + b, 0),
    [stats],
  )

  // 部门人数
  const deptItems = useMemo(() =>
    deptStats.map(ds => {
      const dept = DEPARTMENTS.find(d => d.name === ds.department)
      return { label: `${dept?.icon ?? ''} ${ds.department}`, value: ds.count, color: dept?.color ?? '#4a6a8a' }
    }),
    [deptStats],
  )
  const maxDeptCount = Math.max(...deptItems.map(d => d.value), 1)

  // 技能 Top 10
  const topSkills = useMemo(() => {
    const map = new Map<string, { total: number; count: number; icon: string }>()
    for (const emp of employees) {
      for (const sk of emp.skills) {
        const prev = map.get(sk.name) ?? { total: 0, count: 0, icon: sk.icon }
        map.set(sk.name, { total: prev.total + sk.level, count: prev.count + 1, icon: sk.icon })
      }
    }
    return [...map.entries()]
      .map(([name, { total, count, icon }]) => ({ name, avg: Math.round(total / count), icon }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8)
  }, [employees])

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
        style={{ width: '88vw', maxWidth: 860, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 标题栏 */}
        <div className="pixel-window-header">
          <span className="pixel-window-title">📊 团队仪表盘</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="pixel-led" style={{ fontSize: 14 }}>{timeStr}</span>
            <span className="pixel-text" style={{ fontSize: 10, color: '#4a6a5a' }}>
              {employees.length} 人
            </span>
            <button className="pixel-btn pixel-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div
          className="pixel-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            alignContent: 'start',
          }}
        >
          {/* 实时状态 */}
          <div
            className="pixel-window"
            style={{ padding: 12 }}
          >
            <div className="pixel-window-title" style={{ fontSize: 10, marginBottom: 10 }}>⚡ 实时状态</div>
            <BarChart items={statusItems} max={totalOnline || 1} />
            <div
              className="pixel-divider"
              style={{ margin: '10px 0 6px' }}
            />
            <div className="pixel-text" style={{ fontSize: 10, color: '#3a6a4a' }}>
              合计 <span className="pixel-led" style={{ fontSize: 14 }}>{totalOnline}</span> 人在场
            </div>
          </div>

          {/* 部门分布 */}
          <div className="pixel-window" style={{ padding: 12 }}>
            <div className="pixel-window-title" style={{ fontSize: 10, marginBottom: 10 }}>🏢 部门分布</div>
            <BarChart items={deptItems} max={maxDeptCount} />
          </div>

          {/* 团队五维 */}
          <div className="pixel-window" style={{ padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="pixel-window-title" style={{ fontSize: 10, marginBottom: 6 }}>🎯 团队五维均值</div>
            <TeamRadar width={160} height={160} />
          </div>

          {/* 技能 Top */}
          <div
            className="pixel-window"
            style={{ padding: 12, gridColumn: '1 / -1' }}
          >
            <div className="pixel-window-title" style={{ fontSize: 10, marginBottom: 10 }}>🔥 热门技能 TOP 8</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 16px' }}>
              {topSkills.map((sk, i) => (
                <div key={sk.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pixel-text" style={{ fontSize: 10, color: '#3a5a6a', width: 14, textAlign: 'right' }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 14 }}>{sk.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="pixel-text" style={{ fontSize: 10, color: '#c8d8e8' }}>{sk.name}</div>
                    <div className="pixel-progress" style={{ height: 6, marginTop: 2 }}>
                      <div
                        className="pixel-progress-fill"
                        style={{ width: `${(sk.avg / 10) * 100}%`, background: '#4a8aba' }}
                      />
                    </div>
                  </div>
                  <span className="pixel-text" style={{ fontSize: 11, color: '#4a8aba', width: 14 }}>
                    {sk.avg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
