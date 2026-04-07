/**
 * 图层面板 — 图层列表管理
 * 功能：显示/隐藏、选中、上下移动、新增/删除
 */
import type { EditorState } from '../../game/editor/EditorState'

interface LayerPanelProps {
  readonly state: EditorState
  readonly activeIndex: number
  readonly onSelectLayer: (index: number) => void
  readonly onRefresh: () => void
  readonly onLayerAdded?: (index: number) => void
}

const LAYER_ICONS: Record<string, string> = {
  tile: '🗺️',
  object: '📦',
  collision: '🚧',
}

export function LayerPanel({ state, activeIndex, onSelectLayer, onRefresh, onLayerAdded }: LayerPanelProps) {
  const layers = state.layers

  const handleToggleVisible = (idx: number) => {
    state.toggleLayerVisibility(idx)
    onRefresh()
  }

  const handleMoveUp = (idx: number) => {
    if (idx < layers.length - 1) {
      state.moveLayer(idx, idx + 1)
      onRefresh()
    }
  }

  const handleMoveDown = (idx: number) => {
    if (idx > 0) {
      state.moveLayer(idx, idx - 1)
      onRefresh()
    }
  }

  const handleRemove = (idx: number) => {
    state.removeLayer(idx)
    onRefresh()
  }

  const handleAdd = (type: 'tile' | 'object' | 'collision') => {
    const count = layers.filter(l => l.type === type).length
    const name = `${type}_${count + 1}`
    if (type === 'tile') state.addTileLayer(name)
    else if (type === 'object') state.addObjectLayer(name)
    else state.addCollisionLayer(name)
    const newIdx = state.layers.length - 1
    // 自动选中新图层并通知
    onSelectLayer(newIdx)
    onLayerAdded?.(newIdx)
    onRefresh()
  }

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      {/* 标题 + 添加按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <span style={{ color: '#6a8aaa', fontSize: 10, letterSpacing: 1 }}>LAYERS</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => handleAdd('tile')} style={addBtnStyle} title="添加瓦片图层">+🗺️</button>
          <button onClick={() => handleAdd('object')} style={addBtnStyle} title="添加对象图层">+📦</button>
          <button onClick={() => handleAdd('collision')} style={addBtnStyle} title="添加碰撞图层">+🚧</button>
        </div>
      </div>

      {/* 图层列表（从顶到底） */}
      {[...layers].reverse().map((layer, ri) => {
        const idx = layers.length - 1 - ri
        const isActive = idx === activeIndex
        return (
          <div
            key={idx}
            onClick={() => onSelectLayer(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 6px',
              background: isActive ? '#2a3a5a' : 'transparent',
              border: isActive ? '1px solid #4a6a9a' : '1px solid transparent',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            {/* 可见性 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleVisible(idx) }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                opacity: layer.visible ? 1 : 0.3,
                padding: 0,
                width: 16,
              }}
            >
              👁️
            </button>

            {/* 图标 + 名称 */}
            <span style={{ fontSize: 10 }}>{LAYER_ICONS[layer.type] ?? '?'}</span>
            <span style={{
              flex: 1,
              color: isActive ? '#8ab4f8' : '#8a8aaa',
              fontFamily: 'monospace',
              fontSize: 10,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {layer.name}
            </span>

            {/* 上下移动 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleMoveUp(idx) }}
              style={iconBtnStyle}
              title="上移"
            >↑</button>
            <button
              onClick={(e) => { e.stopPropagation(); handleMoveDown(idx) }}
              style={iconBtnStyle}
              title="下移"
            >↓</button>

            {/* 删除 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(idx) }}
              style={{ ...iconBtnStyle, color: '#ff6b6b' }}
              title="删除图层"
            >×</button>
          </div>
        )
      })}

      {layers.length === 0 && (
        <div style={{ color: '#4a4a6a', fontSize: 10, textAlign: 'center', padding: 8 }}>
          无图层 — 点击上方按钮添加
        </div>
      )}
    </div>
  )
}

const addBtnStyle: React.CSSProperties = {
  background: '#1a2a3a',
  border: '1px solid #2a3a5a',
  color: '#6a8aaa',
  padding: '1px 4px',
  cursor: 'pointer',
  fontSize: 10,
  fontFamily: 'monospace',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6a6a8a',
  cursor: 'pointer',
  fontSize: 10,
  padding: '0 2px',
  fontFamily: 'monospace',
}
