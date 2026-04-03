import { useState, useEffect, useRef } from 'react'
import '../styles/pixel-ui.css'

interface Props {
  readonly onEnter: () => void
}

const TITLE = 'PIXEL TOWN'
const SUBTITLE = 'AI教育 · 像素办公世界'

interface Particle {
  id: number
  x: number
  y: number
  dx: number
  size: number
  delay: number
  duration: number
  color: string
}

function makeParticles(): readonly Particle[] {
  const colors = ['#4a8aba', '#6a5acd', '#4aba8a', '#baba4a', '#ba6a4a']
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 20 + Math.random() * 70,
    dx: (Math.random() - 0.5) * 40,
    size: 2 + Math.floor(Math.random() * 3) * 2,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    color: colors[i % colors.length],
  }))
}

export function LoginScreen({ onEnter }: Props) {
  const [fading, setFading] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const particles = useRef<readonly Particle[]>(makeParticles())

  // 打字机效果
  useEffect(() => {
    let idx = 0
    const timer = setInterval(() => {
      idx++
      setTypedTitle(TITLE.slice(0, idx))
      if (idx >= TITLE.length) {
        clearInterval(timer)
        setTimeout(() => setShowSubtitle(true), 200)
        setTimeout(() => setShowButton(true), 600)
      }
    }, 80)
    return () => clearInterval(timer)
  }, [])

  const handleEnter = () => {
    setFading(true)
    setTimeout(onEnter, 800)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #060d18 0%, #0f1923 40%, #1a2a3a 100%)',
        transition: 'opacity 0.8s ease-out',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* 星星背景 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: i % 5 === 0 ? 2 : 1,
              height: i % 5 === 0 ? 2 : 1,
              background: '#fff',
              left: `${(i * 31 + 7) % 100}%`,
              top: `${(i * 17 + 3) % 70}%`,
              opacity: 0.2 + (i % 6) * 0.1,
              animation: `twinkle ${2.5 + (i % 4) * 0.5}s ease-in-out infinite`,
              animationDelay: `${(i * 0.25) % 4}s`,
            }}
          />
        ))}
      </div>

      {/* 漂浮光斑粒子 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.current.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: '50%',
              opacity: 0,
              animation: `float-particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              ['--dx' as string]: `${p.dx}px`,
            }}
          />
        ))}
      </div>

      {/* 像素建筑 */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <svg width="320" height="130" viewBox="0 0 320 130" style={{ imageRendering: 'pixelated' }}>
          {/* 远景建筑 */}
          <rect x="0" y="60" width="60" height="60" fill="#0e1828" />
          <rect x="260" y="50" width="60" height="70" fill="#0e1828" />
          {/* 远景窗户 */}
          {[12, 28, 44].map(x => [70, 84].map(y => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="5" fill="#2a4a6a" opacity="0.6" />
          )))}
          {/* 主楼 */}
          <rect x="50" y="20" width="220" height="100" fill="#18283a" />
          <rect x="50" y="20" width="220" height="5" fill="#3a6a9a" />
          {/* 主楼窗户 */}
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              <rect
                x={70 + (i % 4) * 52}
                y={35 + Math.floor(i / 4) * 28}
                width="18"
                height="14"
                fill={i % 4 === 1 ? '#4a8aba' : '#2a5a7a'}
                opacity={0.5 + (i % 3) * 0.15}
              >
                <animate
                  attributeName="opacity"
                  values={`${0.3 + (i % 3) * 0.1};${0.7 + (i % 2) * 0.2};${0.3 + (i % 3) * 0.1}`}
                  dur={`${2.5 + (i % 3) * 0.8}s`}
                  repeatCount="indefinite"
                />
              </rect>
              <line x1={70 + (i % 4) * 52 + 9} y1={35 + Math.floor(i / 4) * 28}
                x2={70 + (i % 4) * 52 + 9} y2={35 + Math.floor(i / 4) * 28 + 14}
                stroke="#1a3a5a" strokeWidth="1" />
            </g>
          ))}
          {/* 大门 */}
          <rect x="141" y="85" width="38" height="35" fill="#0a1520" />
          <rect x="141" y="85" width="38" height="4" fill="#3a6a9a" />
          <rect x="155" y="90" width="10" height="30" fill="#142030" />
          {/* 门灯 */}
          <circle cx="160" cy="82" r="4" fill="#ffcc44" opacity="0.9">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="82" r="8" fill="#ffcc44" opacity="0.2">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.2s" repeatCount="indefinite" />
          </circle>
          {/* 地面 */}
          <rect x="0" y="120" width="320" height="10" fill="#0a1420" />
          <rect x="0" y="120" width="320" height="2" fill="#2a4a6a" />
          {/* 路灯 */}
          <rect x="30" y="80" width="3" height="40" fill="#1a2a3a" />
          <rect x="24" y="78" width="15" height="5" rx="1" fill="#2a4a6a" />
          <rect x="26" y="79" width="11" height="3" fill="#ffee88" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="287" y="80" width="3" height="40" fill="#1a2a3a" />
          <rect x="281" y="78" width="15" height="5" rx="1" fill="#2a4a6a" />
          <rect x="283" y="79" width="11" height="3" fill="#ffee88" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2.8s" repeatCount="indefinite" />
          </rect>
        </svg>
      </div>

      {/* 标题打字机 */}
      <h1
        className="pixel-text"
        style={{
          fontSize: 40,
          fontWeight: 900,
          color: '#c8e0f8',
          letterSpacing: 10,
          margin: 0,
          textShadow: '0 0 20px rgba(74, 138, 186, 0.6), 0 0 40px rgba(74, 138, 186, 0.2)',
          minHeight: 50,
        }}
      >
        {typedTitle}
        <span style={{ animation: 'cursor-blink 0.8s step-end infinite', marginLeft: 2 }}>█</span>
      </h1>

      {/* 副标题 */}
      <p
        style={{
          fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: 14,
          color: '#5a7a9a',
          marginTop: 10,
          letterSpacing: 5,
          opacity: showSubtitle ? 1 : 0,
          transform: showSubtitle ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          minHeight: 20,
        }}
      >
        {SUBTITLE}
      </p>

      {/* 进入按钮 */}
      <div
        style={{
          marginTop: 48,
          opacity: showButton ? 1 : 0,
          transform: showButton ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        <button
          className="pixel-btn pixel-btn-primary"
          onClick={handleEnter}
          style={{ fontSize: 15, padding: '14px 52px', letterSpacing: 4 }}
        >
          ▶ 进入世界
        </button>
      </div>

      <p
        className="pixel-text"
        style={{ marginTop: 32, fontSize: 10, color: '#2a4a5a', letterSpacing: 2 }}
      >
        WASD 移动 · 滚轮缩放 · 点击角色查看信息
      </p>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
