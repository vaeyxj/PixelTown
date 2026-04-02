import { useState } from 'react'

interface Props {
  readonly onEnter: () => void
}

export function LoginScreen({ onEnter }: Props) {
  const [fading, setFading] = useState(false)

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
        background: 'linear-gradient(180deg, #0f1923 0%, #1a2a3a 40%, #2a3a4a 100%)',
        transition: 'opacity 0.8s ease-out',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* 星星背景 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: i % 3 === 0 ? 2 : 1,
              height: i % 3 === 0 ? 2 : 1,
              background: '#fff',
              borderRadius: '50%',
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 60}%`,
              opacity: 0.3 + (i % 5) * 0.15,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 3}s`,
            }}
          />
        ))}
      </div>

      {/* 像素建筑轮廓 */}
      <div style={{ position: 'relative', marginBottom: 40 }}>
        <svg width="280" height="120" viewBox="0 0 280 120" style={{ imageRendering: 'pixelated' }}>
          {/* 建筑主体 */}
          <rect x="40" y="30" width="200" height="80" fill="#2a3a4a" />
          <rect x="40" y="30" width="200" height="4" fill="#4a6a8a" />
          {/* 窗户 - 发光 */}
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <rect
                x={55 + (i % 4) * 50}
                y={45 + Math.floor(i / 4) * 30}
                width="16"
                height="12"
                fill={i % 3 === 0 ? '#4a8aba' : '#3a6a8a'}
                opacity={0.6 + (i % 3) * 0.2}
              >
                <animate
                  attributeName="opacity"
                  values={`${0.4 + (i % 3) * 0.2};${0.8 + (i % 2) * 0.2};${0.4 + (i % 3) * 0.2}`}
                  dur={`${3 + i % 2}s`}
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          ))}
          {/* 大门 */}
          <rect x="120" y="80" width="40" height="30" fill="#1a2a3a" />
          <rect x="120" y="80" width="40" height="3" fill="#4a6a8a" />
          {/* 门灯 */}
          <circle cx="140" cy="76" r="3" fill="#ffaa44" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* 地面 */}
          <rect x="0" y="110" width="280" height="10" fill="#1a2a2a" />
        </svg>
      </div>

      {/* 标题 */}
      <h1
        style={{
          fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: 36,
          fontWeight: 700,
          color: '#e8e0d0',
          letterSpacing: 8,
          margin: 0,
          textShadow: '0 0 20px rgba(74, 138, 186, 0.5), 0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        PIXEL TOWN
      </h1>

      <p
        style={{
          fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: 14,
          color: '#7a9aba',
          marginTop: 8,
          letterSpacing: 4,
        }}
      >
        D区 · 数字办公世界
      </p>

      {/* 进入按钮 */}
      <button
        onClick={handleEnter}
        style={{
          marginTop: 48,
          padding: '14px 48px',
          fontSize: 16,
          fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontWeight: 600,
          letterSpacing: 4,
          color: '#e8e0d0',
          background: 'linear-gradient(180deg, #4a7ab5 0%, #3a5a8a 100%)',
          border: '2px solid #5a8ac5',
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 0 20px rgba(74, 138, 186, 0.3), 0 4px 12px rgba(0,0,0,0.3)',
          imageRendering: 'pixelated',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 0 30px rgba(74, 138, 186, 0.5), 0 6px 16px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(74, 138, 186, 0.3), 0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        进入办公室
      </button>

      <p style={{ marginTop: 24, fontSize: 12, color: '#4a5a6a' }}>
        WASD / 方向键移动 · 滚轮缩放 · 点击角色查看信息
      </p>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
