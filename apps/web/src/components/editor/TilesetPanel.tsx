/**
 * 瓦片集面板 — 显示所有瓦片集的瓦片网格，点击选择瓦片
 */
import { useRef, useEffect, useState } from 'react'
import type { TilesetDef } from '../../game/editor/types'
import type { LoadedScene } from '../../game/editor/sceneLoader'

interface TilesetPanelProps {
  readonly scene: LoadedScene
  readonly selectedTile: { tilesetId: string; tileIndex: number } | null
  readonly onSelectTile: (tilesetId: string, tileIndex: number) => void
}

export function TilesetPanel({ scene, selectedTile, onSelectTile }: TilesetPanelProps) {
  const [expandedTileset, setExpandedTileset] = useState<string | null>(
    scene.data.tilesets.length > 0 ? scene.data.tilesets[0].id : null,
  )

  if (scene.data.tilesets.length === 0) {
    return (
      <div style={{ color: '#4a4a6a', fontSize: 10, textAlign: 'center', padding: 12 }}>
        无瓦片集 — 导入素材后显示
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ color: '#6a8aaa', fontSize: 10, letterSpacing: 1 }}>TILESETS</span>
      {scene.data.tilesets.map(ts => (
        <div key={ts.id}>
          {/* 瓦片集标题（可折叠） */}
          <button
            onClick={() => setExpandedTileset(prev => prev === ts.id ? null : ts.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#1a2a3a',
              border: '1px solid #2a3a5a',
              color: '#8ab4f8',
              padding: '3px 6px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 10,
            }}
          >
            {expandedTileset === ts.id ? '▼' : '▶'} {ts.name} ({ts.tileCount})
          </button>

          {/* 瓦片网格 */}
          {expandedTileset === ts.id && (
            <TileGrid
              tileset={ts}
              scene={scene}
              selectedTile={selectedTile}
              onSelectTile={onSelectTile}
            />
          )}
        </div>
      ))}
    </div>
  )
}

interface TileGridProps {
  readonly tileset: TilesetDef
  readonly scene: LoadedScene
  readonly selectedTile: { tilesetId: string; tileIndex: number } | null
  readonly onSelectTile: (tilesetId: string, tileIndex: number) => void
}

/** 单个瓦片集的瓦片网格（Canvas 渲染） */
function TileGrid({ tileset, scene, selectedTile, onSelectTile }: TileGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loaded = scene.tilesets.get(tileset.id)

  const displayCols = Math.min(tileset.columns, 12)
  const rows = Math.ceil(tileset.tileCount / displayCols)
  const cellSize = 24 // 显示尺寸
  const canvasW = displayCols * cellSize
  const canvasH = rows * cellSize

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !loaded) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasW, canvasH)
    ctx.imageSmoothingEnabled = false

    for (let i = 0; i < tileset.tileCount; i++) {
      const col = i % displayCols
      const row = Math.floor(i / displayCols)
      const dx = col * cellSize
      const dy = row * cellSize

      // 棋盘背景
      const isLight = (col + row) % 2 === 0
      ctx.fillStyle = isLight ? '#2a2a3a' : '#222233'
      ctx.fillRect(dx, dy, cellSize, cellSize)

      // 瓦片纹理
      const texture = loaded.textures[i]
      if (texture && texture.source?.resource instanceof HTMLImageElement) {
        const frame = texture.frame
        ctx.drawImage(
          texture.source.resource,
          frame.x, frame.y, frame.width, frame.height,
          dx + 1, dy + 1, cellSize - 2, cellSize - 2,
        )
      }

      // 选中高亮
      if (selectedTile?.tilesetId === tileset.id && selectedTile.tileIndex === i) {
        ctx.strokeStyle = '#4a9af5'
        ctx.lineWidth = 2
        ctx.strokeRect(dx + 1, dy + 1, cellSize - 2, cellSize - 2)
      }
    }
  }, [tileset, loaded, selectedTile, canvasW, canvasH, displayCols])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    const tileIndex = row * displayCols + col
    if (tileIndex >= 0 && tileIndex < tileset.tileCount) {
      onSelectTile(tileset.id, tileIndex)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      onClick={handleClick}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
        cursor: 'pointer',
        border: '1px solid #2a2a4a',
        maxWidth: '100%',
      }}
    />
  )
}
