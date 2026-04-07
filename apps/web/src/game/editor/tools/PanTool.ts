/**
 * 平移工具 — 拖拽画布平移视口
 */
import type { FederatedPointerEvent, Container } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'

export class PanTool implements EditorTool {
  readonly name = '平移'
  readonly icon = '✋'

  private dragging = false
  private lastScreenX = 0
  private lastScreenY = 0
  /** 外部回调：平移世界容器 */
  private readonly onPan: (dx: number, dy: number) => void

  constructor(onPan: (dx: number, dy: number) => void) {
    this.onPan = onPan
  }

  activate(_overlay: Container): void {
    // no-op
  }

  deactivate(): void {
    this.dragging = false
  }

  onPointerDown(e: FederatedPointerEvent, _world: WorldPoint): void {
    this.dragging = true
    this.lastScreenX = e.globalX
    this.lastScreenY = e.globalY
  }

  onPointerMove(e: FederatedPointerEvent, _world: WorldPoint): void {
    if (!this.dragging) return
    const dx = e.globalX - this.lastScreenX
    const dy = e.globalY - this.lastScreenY
    this.lastScreenX = e.globalX
    this.lastScreenY = e.globalY
    this.onPan(dx, dy)
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    this.dragging = false
  }
}
