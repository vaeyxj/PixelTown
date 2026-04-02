import { PixelCanvas } from './components/PixelCanvas'

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '8px 16px',
          background: '#16213e',
          borderBottom: '2px solid #0f3460',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '20px' }}>🏢</span>
        <h1
          style={{
            margin: 0,
            fontSize: '16px',
            color: '#e8e0d0',
            fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
            letterSpacing: '2px',
          }}
        >
          PixelTown · D区
        </h1>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#7a8a9a',
            fontFamily: 'monospace',
          }}
        >
          滚轮缩放 · 拖拽移动 · 悬停查看详情
        </span>
      </header>
      <main style={{ flex: 1, position: 'relative' }}>
        <PixelCanvas />
      </main>
    </div>
  )
}

export default App
