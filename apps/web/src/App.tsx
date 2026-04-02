import { useState, useCallback, useRef } from 'react'
import { PixelCanvas } from './components/PixelCanvas'
import { LoginScreen } from './components/LoginScreen'
import { StatsPanel, MiniMap, CharacterCard } from './components/HUD'
import type { CharacterState, EmployeeStatus } from './game/simulation'
import type { GameCallbacks } from './game/engine'

function App() {
  const [showLogin, setShowLogin] = useState(true)
  const [started, setStarted] = useState(false)
  const [hudVisible, setHudVisible] = useState(false)

  // HUD state
  const [stats, setStats] = useState<Record<EmployeeStatus, number>>({
    working: 0, meeting: 0, lunch: 0, dinner: 0, walking: 0, idle: 0, away: 0,
  })
  const [timeStr, setTimeStr] = useState('09:50')
  const [onlineCount, setOnlineCount] = useState(0)
  const [miniMapChars, setMiniMapChars] = useState<readonly CharacterState[]>([])
  const [cameraRect, setCameraRect] = useState({ x: 0, y: 0, w: 100, h: 100 })
  const [selectedChar, setSelectedChar] = useState<CharacterState | null>(null)

  // 节流小地图更新
  const lastMiniMapUpdate = useRef(0)

  const callbacks: GameCallbacks = {
    onStatsUpdate: useCallback((s, t, c) => {
      setStats(s)
      setTimeStr(t)
      setOnlineCount(c)
    }, []),
    onMiniMapUpdate: useCallback((chars, rect) => {
      const now = Date.now()
      if (now - lastMiniMapUpdate.current > 200) {
        lastMiniMapUpdate.current = now
        setMiniMapChars(chars)
        setCameraRect(rect)
      }
    }, []),
    onCharacterClick: useCallback((ch: CharacterState) => {
      setSelectedChar(ch)
    }, []),
    onReady: useCallback(() => {
      setHudVisible(true)
    }, []),
  }

  const handleEnter = () => {
    setShowLogin(false)
    setStarted(true)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f1923' }}>
      {/* 游戏画布（始终渲染） */}
      <PixelCanvas started={started} callbacks={callbacks} />

      {/* 登录屏 */}
      {showLogin && <LoginScreen onEnter={handleEnter} />}

      {/* HUD */}
      {hudVisible && (
        <>
          <StatsPanel stats={stats} timeStr={timeStr} onlineCount={onlineCount} />
          <MiniMap characters={miniMapChars} cameraRect={cameraRect} />
          <CharacterCard char={selectedChar} onClose={() => setSelectedChar(null)} />

          {/* 操作提示 */}
          <div
            style={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              fontSize: 11,
              color: 'rgba(122, 154, 186, 0.6)',
              fontFamily: 'monospace',
              zIndex: 50,
            }}
          >
            WASD 移动 · 滚轮缩放 · 点击角色
          </div>
        </>
      )}
    </div>
  )
}

export default App
