/**
 * 属性面板 — 选中对象的属性编辑
 */
import { useState } from 'react'
import type { SceneObject } from '../../game/editor/types'
import type { EditorState } from '../../game/editor/EditorState'

interface PropertyPanelProps {
  readonly object: SceneObject
  readonly editorState: EditorState
  readonly onRefresh: () => void
}

export function PropertyPanel({ object, editorState, onRefresh }: PropertyPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: '#6a8aaa', fontSize: 10, letterSpacing: 1 }}>PROPERTIES</span>
      <div style={{ color: '#8ab4f8', fontSize: 12, marginBottom: 4 }}>{object.name}</div>

      <PropRow label="X" value={object.x} onChange={v => { editorState.updateObject(object.id, { x: v }); onRefresh() }} />
      <PropRow label="Y" value={object.y} onChange={v => { editorState.updateObject(object.id, { y: v }); onRefresh() }} />
      <PropRow label="W" value={object.width} onChange={v => { editorState.updateObject(object.id, { width: v }); onRefresh() }} />
      <PropRow label="H" value={object.height} onChange={v => { editorState.updateObject(object.id, { height: v }); onRefresh() }} />
      <PropRow label="Rotation" value={object.rotation} onChange={v => { editorState.updateObject(object.id, { rotation: v }); onRefresh() }} step={5} />
      <PropRow label="ScaleX" value={object.scaleX} onChange={v => { editorState.updateObject(object.id, { scaleX: v }); onRefresh() }} step={0.1} />
      <PropRow label="ScaleY" value={object.scaleY} onChange={v => { editorState.updateObject(object.id, { scaleY: v }); onRefresh() }} step={0.1} />

      <button
        onClick={() => { editorState.removeObject(object.id); onRefresh() }}
        style={{
          marginTop: 8,
          background: '#2a1a1a',
          border: '1px solid #5a2a2a',
          color: '#ff6b6b',
          padding: '4px 8px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 10,
        }}
      >
        删除对象
      </button>
    </div>
  )
}

interface PropRowProps {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
}

function PropRow({ label, value, onChange }: PropRowProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(String(value))

  const handleBlur = () => {
    setEditing(false)
    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed)) {
      onChange(parsed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur()
    if (e.key === 'Escape') { setEditing(false); setInputValue(String(value)) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 10, width: 55 }}>{label}</span>
      {editing ? (
        <input
          autoFocus
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: '#1a2a3a',
            border: '1px solid #4a6a9a',
            color: '#8ab4f8',
            fontFamily: 'monospace',
            fontSize: 10,
            padding: '2px 4px',
            outline: 'none',
          }}
        />
      ) : (
        <span
          onClick={() => { setEditing(true); setInputValue(String(value)) }}
          style={{
            flex: 1,
            color: '#aaaacc',
            fontFamily: 'monospace',
            fontSize: 10,
            cursor: 'text',
            padding: '2px 4px',
            background: '#0d0d1a',
            border: '1px solid #2a2a4a',
          }}
        >
          {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}
        </span>
      )}
    </div>
  )
}
