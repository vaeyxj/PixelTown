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

interface ToastMsg {
  id: number
  icon: string
  text: string
  dying: boolean
}

let toastId = 0

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const show = useCallback((icon: string, text: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, icon, text, dying: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, dying: true } : t))
    }, 1800)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2200)
  }, [])

  return { toasts, show }
}

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
  const { toasts, show: showToast } = useToast()

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

  const PANEL_TOAST: Record<NonNullable<ActivePanel>, { icon: string; text: string }> = {
    grid: { icon: '👥', text: '员工图鉴已打开' },
    dashboard: { icon: '📊', text: '团队仪表盘已打开' },
  }

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => {
      const next = prev === panel ? null : panel
      if (next !== null) showToast(PANEL_TOAST[next].icon, PANEL_TOAST[next].text)
      return next
    })
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
            onSearch={() => togglePanel('grid')}
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

          {/* Toast 通知层 */}
          <div
            style={{
              position: 'fixed',
              bottom: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              zIndex: 200,
              pointerEvents: 'none',
            }}
          >
            {toasts.map(t => (
              <div
                key={t.id}
                className="pixel-toast"
                style={{
                  animation: t.dying
                    ? 'pixel-toast-out 0.4s ease-in forwards'
                    : 'pixel-toast-in 0.25s ease-out',
                }}
              >
                <span className="pixel-toast-icon">{t.icon}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default App
