/**
 * 瓦片笔刷工具 — 在 TileLayer 上绘制瓦片
 * 支持单击放置和拖拽连续绘制，移动时显示半透明预览
 */
import { Container, Graphics } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'
import type { LoadedScene } from '../sceneLoader'
import { buildRegionGhost } from './ghostHelper'

export class TileBrushTool implements EditorTool {
  readonly name = '笔刷'
  readonly icon = '🖌️'

  private state: EditorState
  private scene: LoadedScene
  private ghostContainer: Container | null = null
  private painting = false

  constructor(state: EditorState, scene: LoadedScene) {
    this.state = state
    this.scene = scene
  }

  activate(toolOverlay: Container): void {
    this.ghostContainer = new Container()
    this.ghostContainer.alpha = 0.5
    this.ghostContainer.visible = false
    toolOverlay.addChild(this.ghostContainer)
  }

  deactivate(): void {
    this.painting = false
    this.ghostContainer = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.painting = true
    this.state.batchEditing = true
    this.paintAt(world)
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.updateGhost(world)
    if (this.painting) {
      this.paintAt(world)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    this.painting = false
    this.state.batchEditing = false
  }

  onPointerLeave(): void {
    if (this.ghostContainer) this.ghostContainer.visible = false
  }

  private paintAt(world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.state.paintTile(tx, ty)
  }

  private updateGhost(world: WorldPoint): void {
    if (!this.ghostContainer) return
    const { selectedRegion, tileSize } = this.state

    const built = buildRegionGhost(this.ghostContainer, selectedRegion, this.state, this.scene)
    if (!built) return

    const tx = Math.floor(world.x / tileSize)
    const ty = Math.floor(world.y / tileSize)
    this.ghostContainer.x = tx * tileSize
    this.ghostContainer.y = ty * tileSize
    this.ghostContainer.visible = true
  }
}

/**
 * 瓦片橡皮擦工具
 */
/**
 * 橡皮擦工具 — 拖拽矩形批量擦除 tile + 碰撞 + 对象
 * 按下起点 → 拖拽显示红色矩形预览 → 松开批量擦除
 */
export class TileEraserTool implements EditorTool {
  readonly name = '橡皮擦'
  readonly icon = '🧹'

  private state: EditorState
  private dragging = false
  private startTX = 0
  private startTY = 0
  private endTX = 0
  private endTY = 0
  private highlight: Graphics | null = null
  private gridOverlay: Graphics | null = null

  constructor(state: EditorState) {
    this.state = state
  }

  activate(toolOverlay: Container): void {
    this.gridOverlay = new Graphics()
    this.gridOverlay.label = 'eraser-grid-overlay'
    toolOverlay.addChild(this.gridOverlay)

    this.highlight = new Graphics()
    toolOverlay.addChild(this.highlight)

    this.redrawGridOverlay()
  }

  deactivate(): void {
    this.dragging = false
    this.highlight = null
    this.gridOverlay = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    this.startTX = Math.floor(world.x / ts)
    this.startTY = Math.floor(world.y / ts)
    this.endTX = this.startTX
    this.endTY = this.startTY
    this.dragging = true
    this.drawRect()
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    if (this.dragging) {
      this.endTX = tx
      this.endTY = ty
      this.drawRect()
    } else {
      // 非拖拽时显示单格光标
      this.drawCursor(tx, ty)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    if (!this.dragging) return
    this.dragging = false

    const minX = Math.min(this.startTX, this.endTX)
    const minY = Math.min(this.startTY, this.endTY)
    const maxX = Math.max(this.startTX, this.endTX)
    const maxY = Math.max(this.startTY, this.endTY)

    this.state.batchEditing = true
    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        this.state.eraseTile(tx, ty)
        this.state.setCollision(tx, ty, false)
        this.state.setObject(tx, ty, false)
      }
    }
    this.state.batchEditing = false

    if (this.highlight) this.highlight.clear()
    this.redrawGridOverlay()
  }

  onPointerLeave(): void {
    if (this.highlight) this.highlight.clear()
  }

  /** 绘制拖拽矩形预览 */
  private drawRect(): void {
    if (!this.highlight) return
    const ts = this.state.tileSize
    const minX = Math.min(this.startTX, this.endTX)
    const minY = Math.min(this.startTY, this.endTY)
    const maxX = Math.max(this.startTX, this.endTX)
    const maxY = Math.max(this.startTY, this.endTY)
    const px = minX * ts
    const py = minY * ts
    const pw = (maxX - minX + 1) * ts
    const ph = (maxY - minY + 1) * ts
    this.highlight.clear()
    this.highlight.rect(px, py, pw, ph)
      .fill({ color: 0xff4444, alpha: 0.2 })
      .stroke({ color: 0xff4444, alpha: 0.8, width: 1 })
  }

  /** 非拖拽时的单格光标 */
  private drawCursor(tx: number, ty: number): void {
    if (!this.highlight) return
    const ts = this.state.tileSize
    this.highlight.clear()
    this.highlight.rect(tx * ts, ty * ts, ts, ts)
      .fill({ color: 0xff4444, alpha: 0.15 })
      .stroke({ color: 0xff4444, alpha: 0.6, width: 1 })
  }

  /** 绘制碰撞（红）和对象（蓝）标记 overlay */
  private redrawGridOverlay(): void {
    if (!this.gridOverlay) return
    const g = this.gridOverlay
    g.clear()
    const { width, tileSize, collisionGrid, objectGrid } = this.state
    for (let i = 0; i < collisionGrid.length; i++) {
      const tx = i % width
      const ty = Math.floor(i / width)
      const px = tx * tileSize
      const py = ty * tileSize
      if (collisionGrid[i] === 1) {
        g.rect(px, py, tileSize, tileSize).fill({ color: 0xff4444, alpha: 0.2 })
      }
      if (objectGrid[i] === 1) {
        g.rect(px, py, tileSize, tileSize).fill({ color: 0x4488ff, alpha: 0.2 })
      }
    }
  }
}

/**
 * 油漆桶填充工具
 */
export class TileFillTool implements EditorTool {
  readonly name = '填充'
  readonly icon = '🪣'

  private state: EditorState

  constructor(state: EditorState) {
    this.state = state
  }

  activate(_toolOverlay: Container): void {}
  deactivate(): void {}

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.state.fillTiles(tx, ty)
  }

  onPointerMove(_e: FederatedPointerEvent, _world: WorldPoint): void {}
  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {}
}
