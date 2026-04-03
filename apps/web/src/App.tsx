import { useState, useCallback, useRef } from 'react'
import { PixelCanvas } from './components/PixelCanvas'
import { LoginScreen } from './components/LoginScreen'
import { StatsPanel, MiniMap, BottomToolbar } from './components/HUD'
import { CharacterPanel } from './components/CharacterPanel'
import { EmployeeGrid } from './components/EmployeeGrid'
import { StatsDashboard } from './components/StatsDashboard'
import type { CharacterState, EmployeeStatus } from './game/simulation'
import type { GameCallbacks } from './game/engine'

type ActivePanel = 'grid' | 'dashboard' | null

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
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)

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

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? null : panel)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#060d18' }}>
      <PixelCanvas started={started} callbacks={callbacks} />

      {showLogin && <LoginScreen onEnter={handleEnter} />}

      {hudVisible && (
        <>
          <StatsPanel stats={stats} timeStr={timeStr} onlineCount={onlineCount} />
          <MiniMap characters={miniMapChars} cameraRect={cameraRect} />
          <BottomToolbar
            onOpenGrid={() => togglePanel('grid')}
            onOpenDashboard={() => togglePanel('dashboard')}
            activePanel={activePanel}
          />

          {/* 角色详情面板 */}
          {selectedChar && (
            <CharacterPanel
              char={selectedChar}
              onClose={() => setSelectedChar(null)}
            />
          )}

          {/* 员工图鉴 */}
          {activePanel === 'grid' && (
            <EmployeeGrid
              onClose={() => setActivePanel(null)}
              onSelectEmployee={id => {
                // 找到对应的 CharacterState
                const found = miniMapChars.find(c => c.employee.id === id)
                if (found) setSelectedChar(found)
              }}
            />
          )}

          {/* 团队仪表盘 */}
          {activePanel === 'dashboard' && (
            <StatsDashboard
              onClose={() => setActivePanel(null)}
              stats={stats}
              timeStr={timeStr}
            />
          )}

          {/* 操作提示 */}
          <div
            style={{
              position: 'fixed',
              bottom: 84,
              left: 16,
              fontSize: 10,
              color: 'rgba(74, 106, 154, 0.5)',
              fontFamily: 'monospace',
              zIndex: 50,
              letterSpacing: 1,
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
