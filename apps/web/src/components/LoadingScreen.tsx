import { useEffect, useState } from 'react'
import '../styles/pixel-ui.css'

const TIPS = [
  '正在部署像素工位...',
  'AI 讲师正在备课...',
  '研究员正在调参...',
  '设计师正在选色...',
  '正在加载像素世界...',
  '正在初始化办公室...',
]

const TOTAL_SEGMENTS = 16

interface Props {
  readonly progress: number // 0–1
  readonly onDone: () => void
}

export function LoadingScreen({ progress, onDone }: Props) {
  const [tip, setTip] = useState(TIPS[0])
  const [visible, setVisible] = useState(true)
  const filled = Math.round(progress * TOTAL_SEGMENTS)

  useEffect(() => {
    const id = setInterval(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
    }, 900)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (progress >= 1) {
      const t = setTimeout(() => {
        setVisible(false)
        onDone()
      }, 400)
      return () => clearTimeout(t)
    }
  }, [progress, onDone])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#060d18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'monospace',
        transition: progress >= 1 ? 'opacity 0.4s ease-out' : undefined,
        opacity: progress >= 1 ? 0 : 1,
      }}
    >
      {/* 像素建筑 LOGO */}
      <svg width="120" height="80" viewBox="0 0 120 80" shapeRendering="crispEdges" style={{ marginBottom: 24 }}>
        {/* Building */}
        <rect x="20" y="30" width="80" height="50" fill="#1a3a5a"/>
        <rect x="14" y="22" width="92" height="12" fill="#2a5a8a"/>
        {/* Windows */}
        <rect x="28" y="38" width="14" height="10" fill="#4ae8c0"/>
        <rect x="52" y="38" width="14" height="10" fill="#4ae8c0"/>
        <rect x="76" y="38" width="14" height="10" fill="#ff9f43"/>
        <rect x="28" y="56" width="14" height="10" fill="#4ae8c0"/>
        <rect x="52" y="56" width="14" height="10" fill="#4ae8c0"/>
        <rect x="76" y="56" width="14" height="10" fill="#4ae8c0"/>
        {/* Door */}
        <rect x="50" y="62" width="20" height="18" fill="#0a1e2e"/>
        {/* Antenna */}
        <rect x="58" y="6" width="4" height="16" fill="#2a5a8a"/>
        <rect x="54" y="6" width="12" height="2" fill="#4ae8c0"/>
      </svg>

      {/* 标题 */}
      <div style={{ fontSize: 22, letterSpacing: 4, color: '#4ae8c0', marginBottom: 8, textShadow: '0 0 8px #4ae8c0' }}>
        PIXEL TOWN
      </div>
      <div style={{ fontSize: 10, color: '#4a6a8a', letterSpacing: 2, marginBottom: 32 }}>
        AI 教育公司像素办公世界
      </div>

      {/* 像素进度条 */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 16,
          padding: '4px 6px',
          border: '2px solid #1a3a5a',
          background: '#04080f',
        }}
      >
        {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 14,
              background: i < filled ? '#4ae8c0' : '#0a1e2e',
              boxShadow: i < filled ? '0 0 4px #4ae8c0' : undefined,
              transition: 'background 0.1s',
            }}
          />
        ))}
      </div>

      {/* 进度数字 */}
      <div style={{ fontSize: 11, color: '#2a6a5a', marginBottom: 10, fontFamily: 'monospace' }}>
        {Math.round(progress * 100)}%
      </div>

      {/* 趣味提示 */}
      <div
        key={tip}
        style={{
          fontSize: 10,
          color: '#4a6a8a',
          letterSpacing: 1,
          animation: 'pixel-fade-in 0.3s ease-out',
        }}
      >
        {tip}
      </div>
    </div>
  )
}
