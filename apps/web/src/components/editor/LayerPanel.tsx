/**
 * 图层面板 — 瓦片图层列表管理
 * 功能：显示/隐藏、选中、新增/删除（无排序）
 */
import type { EditorState } from '../../game/editor/EditorState'

interface LayerPanelProps {
  readonly state: EditorState
  readonly activeIndex: number
  readonly onSelectLayer: (index: number) => void
  readonly onRefresh: () => void
  readonly onLayerAdded?: (index: number) => void
}

export function LayerPanel({ state, activeIndex, onSelectLayer, onRefresh, onLayerAdded }: LayerPanelProps) {
  const layers = state.layers

  const handleToggleVisible = (idx: number) => {
    state.toggleLayerVisibility(idx)
    onRefresh()
  }

  const handleRemove = (idx: number) => {
    state.removeLayer(idx)
    onRefresh()
  }

  const handleAdd = () => {
    const count = layers.length
    const name = `tile_${count + 1}`
    state.addTileLayer(name)
    const newIdx = state.layers.length - 1
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
        <button onClick={handleAdd} style={addBtnStyle} title="添加瓦片图层">+ 图层</button>
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

            {/* 名称 */}
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
