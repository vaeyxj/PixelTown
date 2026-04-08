/**
 * 瓦片集面板 — 显示所有瓦片集的瓦片网格
 * 支持单击选择单个瓦片、拖拽框选矩形区域
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import type { TilesetDef } from '../../game/editor/types'
import type { LoadedScene } from '../../game/editor/sceneLoader'

/** 选中区域：tilesetId + 起始列行 + 区域尺寸 */
interface SelectedRegion {
  tilesetId: string
  col: number
  row: number
  cols: number
  rows: number
}

interface TilesetPanelProps {
  readonly scene: LoadedScene
  readonly selectedRegion: SelectedRegion | null
  readonly onSelectRegion: (tilesetId: string, col: number, row: number, cols: number, rows: number) => void
}

export function TilesetPanel({ scene, selectedRegion, onSelectRegion }: TilesetPanelProps) {
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

          {expandedTileset === ts.id && (
            <TileGrid
              tileset={ts}
              scene={scene}
              selectedRegion={selectedRegion}
              onSelectRegion={onSelectRegion}
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
  readonly selectedRegion: SelectedRegion | null
  readonly onSelectRegion: (tilesetId: string, col: number, row: number, cols: number, rows: number) => void
}

/** 单个瓦片集的瓦片网格（Canvas 渲染），支持拖拽框选 */
function TileGrid({ tileset, scene, selectedRegion, onSelectRegion }: TileGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loaded = scene.tilesets.get(tileset.id)

  const displayCols = tileset.columns
  const rows = Math.ceil(tileset.tileCount / displayCols)
  const cellSize = 24
  const canvasW = displayCols * cellSize
  const canvasH = rows * cellSize

  // 拖拽状态
  const dragRef = useRef<{ startCol: number; startRow: number; dragging: boolean }>({
    startCol: 0, startRow: 0, dragging: false,
  })
  // 实时拖拽预览区域（用于渲染高亮）
  const [dragPreview, setDragPreview] = useState<{ col: number; row: number; cols: number; rows: number } | null>(null)

  // 从鼠标事件计算网格坐标
  const getGridPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const col = Math.max(0, Math.min(displayCols - 1, Math.floor(x / cellSize)))
    const row = Math.max(0, Math.min(rows - 1, Math.floor(y / cellSize)))
    return { col, row }
  }, [displayCols, rows, cellSize])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    const { col, row } = getGridPos(e)
    dragRef.current = { startCol: col, startRow: row, dragging: true }
    setDragPreview({ col, row, cols: 1, rows: 1 })
  }, [getGridPos])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.dragging) return
    const { col, row } = getGridPos(e)
    const { startCol, startRow } = dragRef.current
    const minCol = Math.min(startCol, col)
    const minRow = Math.min(startRow, row)
    const maxCol = Math.max(startCol, col)
    const maxRow = Math.max(startRow, row)
    setDragPreview({ col: minCol, row: minRow, cols: maxCol - minCol + 1, rows: maxRow - minRow + 1 })
  }, [getGridPos])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false

    const { col, row } = getGridPos(e)
    const { startCol, startRow } = dragRef.current
    const minCol = Math.min(startCol, col)
    const minRow = Math.min(startRow, row)
    const maxCol = Math.max(startCol, col)
    const maxRow = Math.max(startRow, row)

    // 验证区域内的瓦片都合法
    const regionCols = maxCol - minCol + 1
    const regionRows = maxRow - minRow + 1
    const lastTileIndex = maxRow * displayCols + maxCol
    if (lastTileIndex < tileset.tileCount) {
      onSelectRegion(tileset.id, minCol, minRow, regionCols, regionRows)
    }
    setDragPreview(null)
  }, [getGridPos, displayCols, tileset, onSelectRegion])

  const handleMouseLeave = useCallback(() => {
    if (dragRef.current.dragging) {
      dragRef.current.dragging = false
      setDragPreview(null)
    }
  }, [])

  // 确定高亮区域：拖拽预览优先，否则用已选区域
  const highlight = dragPreview ??
    (selectedRegion?.tilesetId === tileset.id ? selectedRegion : null)

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
    }

    // 选中区域高亮
    if (highlight) {
      const hx = highlight.col * cellSize
      const hy = highlight.row * cellSize
      const hw = highlight.cols * cellSize
      const hh = highlight.rows * cellSize

      // 半透明填充
      ctx.fillStyle = 'rgba(74, 154, 245, 0.2)'
      ctx.fillRect(hx, hy, hw, hh)

      // 边框
      ctx.strokeStyle = '#4a9af5'
      ctx.lineWidth = 2
      ctx.strokeRect(hx + 1, hy + 1, hw - 2, hh - 2)
    }
  }, [tileset, loaded, highlight, canvasW, canvasH, displayCols, cellSize])

  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'crosshair',
          border: '1px solid #2a2a4a',
        }}
      />
    </div>
  )
}
