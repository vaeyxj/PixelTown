/**
 * 动画编辑器 — 选择帧序列、设置时长、预览动画
 * 从已选瓦片集中选择多帧组成动画，应用于 SceneObject
 */
import { useState, useRef, useEffect } from 'react'
import type { AnimationDef, AnimationFrame } from '../../game/editor/types'
import type { LoadedScene } from '../../game/editor/sceneLoader'

interface AnimationEditorProps {
  readonly scene: LoadedScene
  readonly tilesetId: string
  readonly initialAnimation?: AnimationDef
  readonly onSave: (animation: AnimationDef) => void
  readonly onClose: () => void
}

export function AnimationEditor({ scene, tilesetId, initialAnimation, onSave, onClose }: AnimationEditorProps) {
  const [frames, setFrames] = useState<AnimationFrame[]>(
    initialAnimation ? [...initialAnimation.frames] : [],
  )
  const [loop, setLoop] = useState(initialAnimation?.loop ?? true)
  const [playing, setPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loaded = scene.tilesets.get(tilesetId)
  const tileCount = loaded?.def.tileCount ?? 0
  const columns = Math.min(loaded?.def.columns ?? 8, 12)
  const cellSize = 28

  // 播放预览
  useEffect(() => {
    if (!playing || frames.length === 0) return
    const advance = () => {
      setCurrentFrame(prev => {
        const next = prev + 1
        if (next >= frames.length) {
          if (loop) return 0
          setPlaying(false)
          return prev
        }
        return next
      })
    }
    const dur = frames[currentFrame]?.duration ?? 100
    timerRef.current = setTimeout(advance, dur)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, currentFrame, frames, loop])

  const handleAddFrame = (tileIndex: number) => {
    setFrames(prev => [...prev, { tileIndex, duration: 100 }])
  }

  const handleRemoveFrame = (idx: number) => {
    setFrames(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDurationChange = (idx: number, duration: number) => {
    setFrames(prev => prev.map((f, i) => i === idx ? { ...f, duration } : f))
  }

  const handleSave = () => {
    if (frames.length === 0) return
    onSave({ frames, loop })
  }

  // 预览画布
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas || !loaded || frames.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 64, 64)
    ctx.imageSmoothingEnabled = false

    const frame = frames[currentFrame]
    if (!frame) return
    const texture = loaded.textures[frame.tileIndex]
    if (texture?.source?.resource instanceof HTMLImageElement) {
      const f = texture.frame
      ctx.drawImage(texture.source.resource, f.x, f.y, f.width, f.height, 0, 0, 64, 64)
    }
  }, [currentFrame, frames, loaded])

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#0d0d1a',
      border: '1px solid #4a6a9a',
      padding: 16,
      zIndex: 100,
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#8a8aaa',
      minWidth: 360,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#8ab4f8', fontSize: 13 }}>动画编辑器</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      {/* 预览 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <canvas
          ref={previewCanvasRef}
          width={64}
          height={64}
          style={{ imageRendering: 'pixelated', border: '1px solid #2a2a4a', background: '#1a1a2a' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          <button onClick={() => setPlaying(!playing)} style={btnStyle}>
            {playing ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} />
            循环
          </label>
          <span style={{ fontSize: 9, color: '#4a4a6a' }}>
            {frames.length} 帧
          </span>
        </div>
      </div>

      {/* 帧序列 */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#6a8aaa', fontSize: 10 }}>帧序列</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, maxHeight: 80, overflowY: 'auto' }}>
          {frames.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '2px 4px',
                background: i === currentFrame ? '#2a3a5a' : '#1a1a2a',
                border: '1px solid #2a2a4a',
                fontSize: 9,
              }}
            >
              <span>#{f.tileIndex}</span>
              <input
                type="number"
                value={f.duration}
                onChange={e => handleDurationChange(i, parseInt(e.target.value) || 100)}
                style={{ width: 40, background: '#0d0d1a', border: '1px solid #2a2a4a', color: '#aaaacc', fontSize: 9, padding: 1 }}
              />
              <span style={{ color: '#4a4a6a' }}>ms</span>
              <button onClick={() => handleRemoveFrame(i)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 9 }}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* 瓦片选择器 */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#6a8aaa', fontSize: 10 }}>点击添加帧</span>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
          gap: 1,
          marginTop: 4,
          maxHeight: 120,
          overflowY: 'auto',
        }}>
          {Array.from({ length: tileCount }, (_, i) => (
            <div
              key={i}
              onClick={() => handleAddFrame(i)}
              style={{
                width: cellSize,
                height: cellSize,
                background: '#1a1a2a',
                border: '1px solid #2a2a4a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                color: '#4a4a6a',
              }}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* 保存 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ ...btnStyle, color: '#6a6a8a' }}>取消</button>
        <button onClick={handleSave} style={{ ...btnStyle, color: '#4caf50', borderColor: '#2a5a2a' }}>保存动画</button>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#1a2a3a',
  border: '1px solid #2a4a6a',
  color: '#8ab4f8',
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 10,
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ff6b6b',
  cursor: 'pointer',
  fontSize: 16,
}
