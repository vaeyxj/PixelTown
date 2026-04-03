import { useRef, useEffect, useCallback } from 'react'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, MAP_ZONES } from '../game/mapData'
import type { CharacterState, EmployeeStatus } from '../game/simulation'
import '../styles/pixel-ui.css'

interface StatsProps {
  readonly stats: Record<EmployeeStatus, number>
  readonly timeStr: string
  readonly onlineCount: number
}

interface MiniMapProps {
  readonly characters: readonly CharacterState[]
  readonly cameraRect: { x: number; y: number; w: number; h: number }
}

interface ToolbarProps {
  readonly onOpenGrid: () => void
  readonly onOpenDashboard: () => void
  readonly onSearch: () => void
  readonly activePanel: string | null
}

const STATUS_LABELS: Record<EmployeeStatus, { label: string; color: string; icon: string }> = {
  working:  { label: '工作中', color: '#4a9a5a', icon: '💻' },
  meeting:  { label: '会议中', color: '#b58a4a', icon: '🗣️' },
  lunch:    { label: '午休中', color: '#8a6ab5', icon: '🍱' },
  dinner:   { label: '晚餐中', color: '#b56a8a', icon: '🍽️' },
  walking:  { label: '走动中', color: '#5aaab5', icon: '🚶' },
  idle:     { label: '空闲',   color: '#7a8a9a', icon: '😊' },
  away:     { label: '未到',   color: '#4a4a5a', icon: '🏠' },
}

// 像素时钟数字（单个字符）
function PixelDigit({ ch }: { ch: string }) {
  return (
    <span
      className="pixel-led"
      style={{ fontSize: 24, lineHeight: 1, display: 'inline-block', minWidth: ch === ':' ? 10 : 18 }}
    >
      {ch}
    </span>
  )
}

export function StatsPanel({ stats, timeStr, onlineCount }: StatsProps) {
  const digits = timeStr.split('')

  return (
    <div
      className="pixel-window"
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        padding: '10px 14px',
        minWidth: 190,
        zIndex: 50,
        animation: 'pixel-fade-in 0.3s ease-out',
      }}
    >
      {/* LED 时钟 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 8,
        padding: '6px 8px',
        background: '#04080f',
        border: '1px solid #1a3a1a',
        justifyContent: 'center',
      }}>
        {digits.map((ch, i) => <PixelDigit key={i} ch={ch} />)}
      </div>

      {/* 在线人数 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#4a6a5a',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottom: '1px solid #1a3a2a',
        fontFamily: 'monospace',
      }}>
        <span>在线</span>
        <span className="pixel-led" style={{ fontSize: 16 }}>{onlineCount}</span>
        <span style={{ fontSize: 10 }}>人</span>
      </div>

      {/* 状态列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {(Object.entries(STATUS_LABELS) as [EmployeeStatus, typeof STATUS_LABELS[EmployeeStatus]][])
          .filter(([k]) => k !== 'away' && k !== 'walking' && k !== 'idle')
          .map(([key, { label, color, icon }]) => (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
            >
              <span style={{ width: 16 }}>{icon}</span>
              <span style={{ color: '#6a7a8a', flex: 1, fontFamily: 'monospace' }}>{label}</span>
              <span style={{ color, fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>
                {stats[key] ?? 0}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

// 小地图
const MINIMAP_W = 184
const MINIMAP_H = 116

export function MiniMap({ characters, cameraRect }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanRef = useRef(0)
  const worldW = MAP_WIDTH * TILE_SIZE
  const worldH = MAP_HEIGHT * TILE_SIZE
  const sx = MINIMAP_W / worldW
  const sy = MINIMAP_H / worldH

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
    ctx.fillStyle = '#04080f'
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

    // 区域
    for (const z of MAP_ZONES) {
      const x = z.x * TILE_SIZE * sx
      const y = z.y * TILE_SIZE * sy
      const w = z.width * TILE_SIZE * sx
      const h = z.height * TILE_SIZE * sy
      ctx.fillStyle = z.type === 'workstation' ? 'rgba(74, 154, 90, 0.3)'
        : z.type === 'meeting_room' ? 'rgba(60, 100, 160, 0.4)'
        : 'rgba(60, 60, 60, 0.25)'
      ctx.fillRect(x, y, w, h)
    }

    // 角色点
    for (const ch of characters) {
      if (ch.x < 0) continue
      ctx.fillStyle = ch.status === 'working' ? '#4aba6a'
        : ch.status === 'meeting' ? '#baba4a'
        : ch.status === 'walking' ? '#4a9aba'
        : '#6a7a8a'
      ctx.fillRect(ch.x * sx - 1, ch.y * sy - 1, 2, 2)
    }

    // 视口框
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.7)'
    ctx.lineWidth = 1
    ctx.strokeRect(cameraRect.x * sx, cameraRect.y * sy, cameraRect.w * sx, cameraRect.h * sy)

    // 扫描线
    scanRef.current = (scanRef.current + 0.5) % MINIMAP_H
    ctx.fillStyle = 'rgba(74, 186, 106, 0.06)'
    ctx.fillRect(0, scanRef.current, MINIMAP_W, 2)

    // 格栅叠加 (CRT 效果)
    for (let row = 0; row < MINIMAP_H; row += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, row, MINIMAP_W, 1)
    }
  }, [characters, cameraRect, sx, sy])

  useEffect(() => { draw() }, [draw])

  return (
    <div
      className="pixel-window"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      <div style={{
        fontSize: 9,
        color: '#2a6a3a',
        fontFamily: 'monospace',
        padding: '3px 8px',
        background: '#04080f',
        borderBottom: '1px solid #0a2a1a',
        letterSpacing: 2,
      }}>
        ▣ RADAR
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  )
}

// 底部工具栏
export function BottomToolbar({ onOpenGrid, onOpenDashboard, onSearch, activePanel }: ToolbarProps) {
  const slots = [
    { icon: '🗺️', label: 'MAP',    action: null },
    { icon: '👥', label: 'ROSTER', action: 'grid' },
    { icon: '📊', label: 'STATS',  action: 'dashboard' },
    { icon: '🔍', label: 'SEARCH', action: 'search' },
    { icon: '⚙️', label: 'CONFIG', action: null },
    { icon: '🔊', label: 'AUDIO',  action: null },
  ]

  const handleClick = (action: string | null) => {
    if (action === 'grid') onOpenGrid()
    else if (action === 'dashboard') onOpenDashboard()
    else if (action === 'search') onSearch()
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
        zIndex: 50,
        padding: '6px 8px',
        background: '#060c18',
        border: '2px solid #1a3a5a',
        boxShadow: '0 0 0 1px #0a1a2a, 6px 6px 0 rgba(0,0,0,0.6)',
        animation: 'pixel-slide-up 0.3s ease-out',
      }}
    >
      {slots.map((s, i) => (
        <button
          key={i}
          className={`pixel-slot${activePanel === s.action ? ' active' : ''}`}
          onClick={() => handleClick(s.action)}
          title={s.label}
        >
          <span className="pixel-slot-icon">{s.icon}</span>
          <span className="pixel-slot-label">{s.label}</span>
        </button>
      ))}
    </div>
  )
}
