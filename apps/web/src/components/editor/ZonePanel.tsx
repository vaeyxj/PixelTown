/**
 * 区域面板 — 区域列表 + 选中区域属性编辑
 */
import type { ZoneData, ZoneType } from '../../game/editor/types'
import type { EditorState } from '../../game/editor/EditorState'

interface ZonePanelProps {
  readonly editorState: EditorState
  readonly selectedZone: ZoneData | null
  readonly onSelectZone: (zone: ZoneData | null) => void
  readonly onRefresh: () => void
}

const ZONE_TYPES: ZoneType[] = [
  'workstation', 'shared_desk', 'meeting_room', 'restroom',
  'storage', 'exit', 'hallway', 'service', 'gym',
]

export function ZonePanel({ editorState, selectedZone, onSelectZone, onRefresh }: ZonePanelProps) {
  const zones = editorState.zones

  const handleDeleteZone = (id: string) => {
    editorState.removeZone(id)
    onSelectZone(null)
    onRefresh()
  }

  const handleUpdateZone = (id: string, changes: Partial<ZoneData>) => {
    editorState.updateZone(id, changes)
    const updated = editorState.getZone(id)
    onSelectZone(updated ?? null)
    onRefresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
      <span style={{ color: '#6a8aaa', fontSize: 10, letterSpacing: 1 }}>
        ZONES ({zones.length})
      </span>

      {/* 区域列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {zones.map(z => (
          <div
            key={z.id}
            onClick={() => onSelectZone(z)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 4px',
              background: selectedZone?.id === z.id ? '#2a3a5a' : 'transparent',
              border: selectedZone?.id === z.id ? '1px solid #4a6a9a' : '1px solid transparent',
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#6a6a8a', width: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {z.type}
            </span>
            <span style={{ color: '#aaaacc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {z.name}
            </span>
          </div>
        ))}
      </div>

      {/* 选中区域属性编辑 */}
      {selectedZone && (
        <div style={{ borderTop: '1px solid #2a2a4a', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ZoneField label="名称" value={selectedZone.name} onChange={v => handleUpdateZone(selectedZone.id, { name: v })} />
          <ZoneSelectField
            label="类型"
            value={selectedZone.type}
            options={ZONE_TYPES}
            onChange={v => handleUpdateZone(selectedZone.id, { type: v as ZoneType })}
          />
          <ZoneNumField label="X" value={selectedZone.x} onChange={v => handleUpdateZone(selectedZone.id, { x: v })} />
          <ZoneNumField label="Y" value={selectedZone.y} onChange={v => handleUpdateZone(selectedZone.id, { y: v })} />
          <ZoneNumField label="W" value={selectedZone.width} onChange={v => handleUpdateZone(selectedZone.id, { width: v })} />
          <ZoneNumField label="H" value={selectedZone.height} onChange={v => handleUpdateZone(selectedZone.id, { height: v })} />

          <button
            onClick={() => handleDeleteZone(selectedZone.id)}
            style={{
              marginTop: 4,
              background: '#2a1a1a',
              border: '1px solid #5a2a2a',
              color: '#ff6b6b',
              padding: '3px 6px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 10,
            }}
          >
            删除区域
          </button>
        </div>
      )}
    </div>
  )
}

function ZoneField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 10, width: 30 }}>{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function ZoneNumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 10, width: 30 }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
        style={inputStyle}
      />
    </div>
  )
}

function ZoneSelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 10, width: 30 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, padding: '1px 2px' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: '#1a2a3a',
  border: '1px solid #2a3a5a',
  color: '#aaaacc',
  fontFamily: 'monospace',
  fontSize: 10,
  padding: '2px 4px',
  outline: 'none',
}
