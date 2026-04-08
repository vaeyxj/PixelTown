/**
 * 对象标记工具 — 在 EditorState.objectGrid 上标记可交互网格
 * 左键标记为对象，右键取消标记
 */
import { Container, Graphics } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'

export class ObjectMarkTool implements EditorTool {
  readonly name = '对象标记'
  readonly icon = '📌'

  private state: EditorState
  private painting = false
  private paintObject = true
  private objectOverlay: Graphics | null = null
  private cursorHighlight: Graphics | null = null

  constructor(state: EditorState) {
    this.state = state
  }

  activate(toolOverlay: Container): void {
    this.objectOverlay = new Graphics()
    this.objectOverlay.label = 'object-overlay'
    toolOverlay.addChild(this.objectOverlay)

    this.cursorHighlight = new Graphics()
    this.cursorHighlight.label = 'object-cursor'
    toolOverlay.addChild(this.cursorHighlight)

    this.redrawOverlay()
  }

  deactivate(): void {
    this.painting = false
    this.objectOverlay = null
    this.cursorHighlight = null
  }

  onPointerDown(e: FederatedPointerEvent, world: WorldPoint): void {
    // 左键 = 标记对象，右键 = 取消
    this.paintObject = e.button !== 2
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
    this.state.setObject(tx, ty, this.paintObject)
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

  /** 重绘对象标记叠加层 */
  private redrawOverlay(): void {
    if (!this.objectOverlay) return
    const g = this.objectOverlay
    g.clear()

    const { width, tileSize, objectGrid } = this.state
    for (let i = 0; i < objectGrid.length; i++) {
      if (objectGrid[i] === 0) continue
      const tx = i % width
      const ty = Math.floor(i / width)
      // 蓝色 = 可交互对象
      g.rect(tx * tileSize, ty * tileSize, tileSize, tileSize)
        .fill({ color: 0x4488ff, alpha: 0.3 })
    }
  }
}
