import { useRef, useEffect, useCallback } from 'react'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, MAP_ZONES } from '../game/mapData'
import type { CharacterState, EmployeeStatus } from '../game/simulation'

interface StatsProps {
  readonly stats: Record<EmployeeStatus, number>
  readonly timeStr: string
  readonly onlineCount: number
}

interface MiniMapProps {
  readonly characters: readonly CharacterState[]
  readonly cameraRect: { x: number; y: number; w: number; h: number }
}

interface CharCardProps {
  readonly char: CharacterState | null
  readonly onClose: () => void
}

const STATUS_LABELS: Record<EmployeeStatus, { label: string; color: string; icon: string }> = {
  working: { label: '工作中', color: '#4a9a5a', icon: '💻' },
  meeting: { label: '会议中', color: '#b58a4a', icon: '🗣️' },
  lunch: { label: '午休中', color: '#8a6ab5', icon: '🍱' },
  dinner: { label: '晚餐中', color: '#b56a8a', icon: '🍽️' },
  walking: { label: '走动中', color: '#5aaab5', icon: '🚶' },
  idle: { label: '空闲', color: '#7a8a9a', icon: '😊' },
  away: { label: '未到', color: '#4a4a5a', icon: '🏠' },
}

export function StatsPanel({ stats, timeStr, onlineCount }: StatsProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        background: 'rgba(15, 20, 30, 0.88)',
        border: '1px solid rgba(74, 138, 186, 0.3)',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 180,
        backdropFilter: 'blur(8px)',
        zIndex: 50,
      }}
    >
      {/* 时钟 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🕐</span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 22,
            fontWeight: 700,
            color: '#e8e0d0',
            letterSpacing: 2,
          }}
        >
          {timeStr}
        </span>
      </div>

      <div style={{
        fontSize: 12,
        color: '#7a9aba',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(74, 138, 186, 0.2)',
      }}>
        在线 <span style={{ color: '#4aba6a', fontWeight: 700, fontSize: 14 }}>{onlineCount}</span> 人
      </div>

      {/* 状态列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.entries(STATUS_LABELS)
          .filter(([key]) => key !== 'away' && key !== 'walking' && key !== 'idle')
          .map(([key, { label, color, icon }]) => (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{ color: '#8a9aaa', flex: 1 }}>{label}</span>
              <span style={{ color, fontWeight: 600, fontFamily: 'monospace', fontSize: 14 }}>
                {stats[key as EmployeeStatus] ?? 0}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

const MINIMAP_W = 180
const MINIMAP_H = 110

export function MiniMap({ characters, cameraRect }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldW = MAP_WIDTH * TILE_SIZE
  const worldH = MAP_HEIGHT * TILE_SIZE
  const scaleX = MINIMAP_W / worldW
  const scaleY = MINIMAP_H / worldH

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)

    // 背景
    ctx.fillStyle = 'rgba(20, 28, 40, 0.9)'
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

    // 简化的区域块
    for (const z of MAP_ZONES) {
      const x = z.x * TILE_SIZE * scaleX
      const y = z.y * TILE_SIZE * scaleY
      const w = z.width * TILE_SIZE * scaleX
      const h = z.height * TILE_SIZE * scaleY

      ctx.fillStyle = z.type === 'workstation' ? 'rgba(100, 140, 80, 0.4)'
        : z.type === 'meeting_room' ? 'rgba(60, 80, 120, 0.5)'
        : 'rgba(80, 80, 80, 0.3)'
      ctx.fillRect(x, y, w, h)
    }

    // 角色点
    for (const ch of characters) {
      if (ch.x < 0) continue
      const cx = ch.x * scaleX
      const cy = ch.y * scaleY

      ctx.fillStyle = ch.status === 'working' ? '#4aba6a'
        : ch.status === 'meeting' ? '#baba4a'
        : '#7a8aaa'
      ctx.fillRect(cx - 1, cy - 1, 2, 2)
    }

    // 摄像机视口
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      cameraRect.x * scaleX,
      cameraRect.y * scaleY,
      cameraRect.w * scaleX,
      cameraRect.h * scaleY,
    )
  }, [characters, cameraRect, scaleX, scaleY])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        border: '1px solid rgba(74, 138, 186, 0.3)',
        borderRadius: 8,
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
      }}
    >
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  )
}

export function CharacterCard({ char, onClose }: CharCardProps) {
  if (!char) return null
  const info = STATUS_LABELS[char.status]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 140,
        right: 16,
        background: 'rgba(15, 20, 30, 0.92)',
        border: '1px solid rgba(74, 138, 186, 0.4)',
        borderRadius: 8,
        padding: '14px 18px',
        minWidth: 200,
        backdropFilter: 'blur(8px)',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#e8e0d0' }}>
          {char.employee.name}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#7a8a9a',
            cursor: 'pointer',
            fontSize: 16,
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#7a9aba' }}>
        {char.employee.department}
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: `${info.color}22`,
          border: `1px solid ${info.color}44`,
          borderRadius: 4,
          fontSize: 12,
          color: info.color,
        }}
      >
        <span>{info.icon}</span>
        <span>{info.label}</span>
      </div>

      {char.employee.meetingSlots.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#6a7a8a' }}>
          <div style={{ marginBottom: 4, color: '#8a9aaa' }}>今日会议</div>
          {char.employee.meetingSlots.map((m, i) => (
            <div key={i} style={{ marginLeft: 8 }}>
              {m.startHour}:{m.startMin.toString().padStart(2, '0')} · {m.durationMin}分钟
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
