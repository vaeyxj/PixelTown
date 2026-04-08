/**
 * 直线工具 — Bresenham 算法在两点之间绘制瓦片直线
 * 按下起点 → 拖拽 → 松开终点，沿直线放置瓦片
 */
import { Graphics, Container } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'
import type { LoadedScene } from '../sceneLoader'
import { buildRegionGhost } from './ghostHelper'

/** Bresenham 直线算法，返回所有经过的格子坐标 */
function bresenham(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  let dx = Math.abs(x1 - x0)
  let dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let cx = x0
  let cy = y0

  while (true) {
    points.push({ x: cx, y: cy })
    if (cx === x1 && cy === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; cx += sx }
    if (e2 < dx) { err += dx; cy += sy }
  }
  return points
}

export class LineTool implements EditorTool {
  readonly name = '直线'
  readonly icon = '📏'

  private readonly state: EditorState
  private readonly scene: LoadedScene
  private preview: Graphics | null = null
  private ghostContainer: Container | null = null
  private dragging = false
  private startTX = 0
  private startTY = 0
  private endTX = 0
  private endTY = 0

  constructor(state: EditorState, scene: LoadedScene) {
    this.state = state
    this.scene = scene
  }

  activate(toolOverlay: Container): void {
    this.preview = new Graphics()
    this.ghostContainer = new Container()
    this.ghostContainer.alpha = 0.5
    this.ghostContainer.visible = false
    toolOverlay.addChild(this.preview)
    toolOverlay.addChild(this.ghostContainer)
  }

  deactivate(): void {
    this.dragging = false
    this.preview = null
    this.ghostContainer = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    this.startTX = Math.floor(world.x / ts)
    this.startTY = Math.floor(world.y / ts)
    this.endTX = this.startTX
    this.endTY = this.startTY
    this.dragging = true
    this.drawPreview()
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)

    if (this.dragging) {
      this.endTX = tx
      this.endTY = ty
      this.drawPreview()
    } else {
      this.updateGhost(tx, ty)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    if (!this.dragging) return
    this.dragging = false

    const coords = bresenham(this.startTX, this.startTY, this.endTX, this.endTY)
    this.state.paintTiles(coords)
    this.preview?.clear()
  }

  onPointerLeave(): void {
    if (this.ghostContainer) this.ghostContainer.visible = false
    if (this.preview && !this.dragging) this.preview.clear()
  }

  private drawPreview(): void {
    if (!this.preview) return
    const ts = this.state.tileSize
    const coords = bresenham(this.startTX, this.startTY, this.endTX, this.endTY)

    this.preview.clear()
    for (const { x, y } of coords) {
      this.preview.rect(x * ts, y * ts, ts, ts)
        .fill({ color: 0x4a9af5, alpha: 0.3 })
    }
    // 起点/终点高亮
    this.preview
      .rect(this.startTX * ts, this.startTY * ts, ts, ts)
      .stroke({ color: 0x4af54a, alpha: 0.8, width: 1 })
    this.preview
      .rect(this.endTX * ts, this.endTY * ts, ts, ts)
      .stroke({ color: 0xf5f54a, alpha: 0.8, width: 1 })

    if (this.ghostContainer) this.ghostContainer.visible = false
  }

  private updateGhost(tx: number, ty: number): void {
    if (!this.ghostContainer) return
    const { selectedRegion, tileSize } = this.state

    const built = buildRegionGhost(this.ghostContainer, selectedRegion, this.state, this.scene)
    if (!built) return

    this.ghostContainer.x = tx * tileSize
    this.ghostContainer.y = ty * tileSize
    this.ghostContainer.visible = true
  }
}
