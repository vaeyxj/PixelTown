/**
 * 碰撞笔刷工具 — 拖拽矩形批量标记/取消碰撞
 * 左键拖拽矩形标记不可通过（红色），右键拖拽矩形取消标记
 */
import { Container, Graphics } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'

export class CollisionBrushTool implements EditorTool {
  readonly name = '碰撞'
  readonly icon = '🚧'

  private state: EditorState
  private dragging = false
  private paintBlocked = true
  private startTX = 0
  private startTY = 0
  private endTX = 0
  private endTY = 0
  private collisionOverlay: Graphics | null = null
  private rectPreview: Graphics | null = null
  private cursorHighlight: Graphics | null = null

  constructor(state: EditorState) {
    this.state = state
  }

  activate(toolOverlay: Container): void {
    this.collisionOverlay = new Graphics()
    this.collisionOverlay.label = 'collision-overlay'
    toolOverlay.addChild(this.collisionOverlay)

    this.rectPreview = new Graphics()
    this.rectPreview.label = 'collision-rect'
    toolOverlay.addChild(this.rectPreview)

    this.cursorHighlight = new Graphics()
    this.cursorHighlight.label = 'collision-cursor'
    toolOverlay.addChild(this.cursorHighlight)

    this.redrawOverlay()
  }

  deactivate(): void {
    this.dragging = false
    this.collisionOverlay = null
    this.rectPreview = null
    this.cursorHighlight = null
  }

  onPointerDown(e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    this.paintBlocked = e.button !== 2
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
      this.updateCursor(tx, ty)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    if (!this.dragging) return
    this.dragging = false

    const minX = Math.min(this.startTX, this.endTX)
    const minY = Math.min(this.startTY, this.endTY)
    const maxX = Math.max(this.startTX, this.endTX)
    const maxY = Math.max(this.startTY, this.endTY)

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        this.state.setCollision(tx, ty, this.paintBlocked)
      }
    }

    if (this.rectPreview) this.rectPreview.clear()
    this.redrawOverlay()
  }

  /** 拖拽矩形预览 */
  private drawRect(): void {
    if (!this.rectPreview) return
    const ts = this.state.tileSize
    const minX = Math.min(this.startTX, this.endTX)
    const minY = Math.min(this.startTY, this.endTY)
    const maxX = Math.max(this.startTX, this.endTX)
    const maxY = Math.max(this.startTY, this.endTY)
    const color = this.paintBlocked ? 0xff4444 : 0x44ff44
    this.rectPreview.clear()
    this.rectPreview
      .rect(minX * ts, minY * ts, (maxX - minX + 1) * ts, (maxY - minY + 1) * ts)
      .fill({ color, alpha: 0.2 })
      .stroke({ color, alpha: 0.8, width: 1 })
  }

  private updateCursor(tx: number, ty: number): void {
    if (!this.cursorHighlight) return
    const ts = this.state.tileSize
    this.cursorHighlight.clear()
    this.cursorHighlight
      .rect(tx * ts, ty * ts, ts, ts)
      .stroke({ color: 0xffffff, alpha: 0.8, width: 1 })
  }

  /** 重绘碰撞叠加层 */
  private redrawOverlay(): void {
    if (!this.collisionOverlay) return
    const g = this.collisionOverlay
    g.clear()

    const { width, tileSize, collisionGrid } = this.state
    for (let i = 0; i < collisionGrid.length; i++) {
      if (collisionGrid[i] === 0) continue
      const tx = i % width
      const ty = Math.floor(i / width)
      g.rect(tx * tileSize, ty * tileSize, tileSize, tileSize)
        .fill({ color: 0xff4444, alpha: 0.3 })
    }
  }
}
