/**
 * 碰撞笔刷工具 — 在 CollisionLayer 上绘制可行走/不可行走区域
 * 左键绘制可行走（绿色），右键绘制不可行走（红色）
 * 碰撞层实时以半透明叠加显示
 */
import { Container, Graphics } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'

export class CollisionBrushTool implements EditorTool {
  readonly name = '碰撞'
  readonly icon = '🚧'

  private state: EditorState
  private painting = false
  private paintWalkable = true
  private collisionOverlay: Graphics | null = null
  private cursorHighlight: Graphics | null = null

  constructor(state: EditorState) {
    this.state = state
  }

  activate(toolOverlay: Container): void {
    this.collisionOverlay = new Graphics()
    this.collisionOverlay.label = 'collision-overlay'
    toolOverlay.addChild(this.collisionOverlay)

    this.cursorHighlight = new Graphics()
    this.cursorHighlight.label = 'collision-cursor'
    toolOverlay.addChild(this.cursorHighlight)

    this.redrawOverlay()
  }

  deactivate(): void {
    this.painting = false
    this.collisionOverlay = null
    this.cursorHighlight = null
  }

  onPointerDown(e: FederatedPointerEvent, world: WorldPoint): void {
    // 右键 = 不可行走，左键 = 可行走
    this.paintWalkable = e.button !== 2
    this.painting = true
    this.paintAt(world)
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.updateCursor(world)
    if (this.painting) {
      this.paintAt(world)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    this.painting = false
  }

  private paintAt(world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.state.paintCollision(tx, ty, this.paintWalkable)
    this.redrawOverlay()
  }

  private updateCursor(world: WorldPoint): void {
    if (!this.cursorHighlight) return
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.cursorHighlight.clear()
    this.cursorHighlight
      .rect(tx * ts, ty * ts, ts, ts)
      .stroke({ color: 0xffffff, alpha: 0.8, width: 1 })
  }

  /** 重绘整个碰撞叠加层 */
  private redrawOverlay(): void {
    if (!this.collisionOverlay) return
    const g = this.collisionOverlay
    g.clear()

    const layer = this.state.activeLayer
    if (!layer || layer.type !== 'collision') return

    const { width, tileSize } = this.state
    for (let i = 0; i < layer.data.length; i++) {
      const tx = i % width
      const ty = Math.floor(i / width)
      const walkable = layer.data[i] === 1
      g.rect(tx * tileSize, ty * tileSize, tileSize, tileSize)
        .fill({ color: walkable ? 0x44ff44 : 0xff4444, alpha: 0.25 })
    }
  }
}
