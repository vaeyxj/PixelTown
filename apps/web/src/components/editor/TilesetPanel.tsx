/**
 * 瓦片集面板 — 显示所有瓦片集的瓦片网格
 * 支持：滚轮缩放、中键/空格拖拽平移、拖拽框选矩形区域
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import type { TilesetDef } from '../../game/editor/types'
import type { LoadedScene } from '../../game/editor/sceneLoader'

/** 选中区域 */
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

const BASE_CELL = 16
const MIN_ZOOM = 0.5
const MAX_ZOOM = 6

/** 单个瓦片集的瓦片网格，支持缩放、平移、拖拽框选 */
function TileGrid({ tileset, scene, selectedRegion, onSelectRegion }: TileGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = scene.tilesets.get(tileset.id)

  const displayCols = tileset.columns
  const totalRows = Math.ceil(tileset.tileCount / displayCols)

  // 视图状态
  const viewRef = useRef({ zoom: 2, panX: 0, panY: 0 })
  const [viewTick, setViewTick] = useState(0)
  const bumpView = useCallback(() => setViewTick(n => n + 1), [])

  // 拖拽框选
  const dragRef = useRef<{ startCol: number; startRow: number; dragging: boolean }>({
    startCol: 0, startRow: 0, dragging: false,
  })
  const [dragPreview, setDragPreview] = useState<{ col: number; row: number; cols: number; rows: number } | null>(null)

  // 平移状态
  const panRef = useRef<{ panning: boolean; lastX: number; lastY: number }>({
    panning: false, lastX: 0, lastY: 0,
  })
  const spaceRef = useRef(false)

  // 空格键监听（用于空格+拖拽平移）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) spaceRef.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  /** 像素坐标 → 网格坐标 */
  const toGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { col: 0, row: 0 }
    const rect = canvas.getBoundingClientRect()
    const { zoom, panX, panY } = viewRef.current
    const cellSize = BASE_CELL * zoom
    const worldX = (clientX - rect.left) - panX
    const worldY = (clientY - rect.top) - panY
    const col = Math.max(0, Math.min(displayCols - 1, Math.floor(worldX / cellSize)))
    const row = Math.max(0, Math.min(totalRows - 1, Math.floor(worldY / cellSize)))
    return { col, row }
  }, [displayCols, totalRows])

  // 滚轮缩放 — 用 native listener + { passive: false } 避免 passive 报错
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const v = viewRef.current
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      const oldZoom = v.zoom
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor))

      v.panX = mx - (mx - v.panX) * (newZoom / oldZoom)
      v.panY = my - (my - v.panY) * (newZoom / oldZoom)
      v.zoom = newZoom
      bumpView()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [bumpView])

  // 鼠标按下：中键平移 / 空格+左键平移 / 左键框选
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceRef.current)) {
      // 平移
      e.preventDefault()
      panRef.current = { panning: true, lastX: e.clientX, lastY: e.clientY }
      return
    }
    if (e.button === 0) {
      // 框选
      const { col, row } = toGrid(e.clientX, e.clientY)
      dragRef.current = { startCol: col, startRow: row, dragging: true }
      setDragPreview({ col, row, cols: 1, rows: 1 })
    }
  }, [toGrid])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 平移
    if (panRef.current.panning) {
      const dx = e.clientX - panRef.current.lastX
      const dy = e.clientY - panRef.current.lastY
      panRef.current.lastX = e.clientX
      panRef.current.lastY = e.clientY
      viewRef.current.panX += dx
      viewRef.current.panY += dy
      bumpView()
      return
    }
    // 框选
    if (dragRef.current.dragging) {
      const { col, row } = toGrid(e.clientX, e.clientY)
      const { startCol, startRow } = dragRef.current
      const minCol = Math.min(startCol, col)
      const minRow = Math.min(startRow, row)
      setDragPreview({
        col: minCol,
        row: minRow,
        cols: Math.max(startCol, col) - minCol + 1,
        rows: Math.max(startRow, row) - minRow + 1,
      })
    }
  }, [toGrid, bumpView])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (panRef.current.panning) {
      panRef.current.panning = false
      return
    }
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false

    const { col, row } = toGrid(e.clientX, e.clientY)
    const { startCol, startRow } = dragRef.current
    const minCol = Math.min(startCol, col)
    const minRow = Math.min(startRow, row)
    const maxCol = Math.max(startCol, col)
    const maxRow = Math.max(startRow, row)
    const regionCols = maxCol - minCol + 1
    const regionRows = maxRow - minRow + 1
    const lastTileIndex = maxRow * displayCols + maxCol
    if (lastTileIndex < tileset.tileCount) {
      onSelectRegion(tileset.id, minCol, minRow, regionCols, regionRows)
    }
    setDragPreview(null)
  }, [toGrid, displayCols, tileset, onSelectRegion])

  const handleMouseLeave = useCallback(() => {
    panRef.current.panning = false
    if (dragRef.current.dragging) {
      dragRef.current.dragging = false
      setDragPreview(null)
    }
  }, [])

  // 高亮区域
  const highlight = dragPreview ??
    (selectedRegion?.tilesetId === tileset.id ? selectedRegion : null)

  // 渲染
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !loaded) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = container.clientWidth
    const h = container.clientHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const { zoom, panX, panY } = viewRef.current
    const cellSize = BASE_CELL * zoom

    ctx.clearRect(0, 0, w, h)

    // 只渲染可见范围内的瓦片
    const startCol = Math.max(0, Math.floor(-panX / cellSize))
    const startRow = Math.max(0, Math.floor(-panY / cellSize))
    const endCol = Math.min(displayCols, Math.ceil((w - panX) / cellSize))
    const endRow = Math.min(totalRows, Math.ceil((h - panY) / cellSize))

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const i = row * displayCols + col
        if (i >= tileset.tileCount) continue

        const dx = col * cellSize + panX
        const dy = row * cellSize + panY

        // 棋盘背景
        ctx.fillStyle = (col + row) % 2 === 0 ? '#2a2a3a' : '#222233'
        ctx.fillRect(dx, dy, cellSize, cellSize)

        // 瓦片纹理
        const texture = loaded.textures[i]
        if (texture && texture.source?.resource instanceof HTMLImageElement) {
          const frame = texture.frame
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(
            texture.source.resource,
            frame.x, frame.y, frame.width, frame.height,
            dx + 0.5, dy + 0.5, cellSize - 1, cellSize - 1,
          )
        }
      }
    }

    // 网格线（缩放足够大时）
    if (zoom >= 1.5) {
      ctx.strokeStyle = 'rgba(100,100,140,0.2)'
      ctx.lineWidth = 0.5
      for (let col = startCol; col <= endCol; col++) {
        const x = col * cellSize + panX
        ctx.beginPath(); ctx.moveTo(x, Math.max(0, panY)); ctx.lineTo(x, Math.min(h, totalRows * cellSize + panY)); ctx.stroke()
      }
      for (let row = startRow; row <= endRow; row++) {
        const y = row * cellSize + panY
        ctx.beginPath(); ctx.moveTo(Math.max(0, panX), y); ctx.lineTo(Math.min(w, displayCols * cellSize + panX), y); ctx.stroke()
      }
    }

    // 选中高亮
    if (highlight) {
      const hx = highlight.col * cellSize + panX
      const hy = highlight.row * cellSize + panY
      const hw = highlight.cols * cellSize
      const hh = highlight.rows * cellSize
      ctx.fillStyle = 'rgba(74, 154, 245, 0.2)'
      ctx.fillRect(hx, hy, hw, hh)
      ctx.strokeStyle = '#4a9af5'
      ctx.lineWidth = 2
      ctx.strokeRect(hx + 1, hy + 1, hw - 2, hh - 2)
    }
  }, [tileset, loaded, highlight, displayCols, totalRows, viewTick])

  // 容器 resize 监听
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => bumpView())
    ro.observe(container)
    return () => ro.disconnect()
  }, [bumpView])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: Math.min(280, totalRows * BASE_CELL * 2 + 8),
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #2a2a4a',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={e => e.preventDefault()}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
          cursor: spaceRef.current || panRef.current.panning ? 'grab' : 'crosshair',
        }}
      />
      {/* 缩放指示 */}
      <span style={{
        position: 'absolute',
        bottom: 2,
        right: 4,
        fontSize: 9,
        color: '#4a4a6a',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}>
        {Math.round(viewRef.current.zoom * 100)}%
      </span>
    </div>
  )
}
