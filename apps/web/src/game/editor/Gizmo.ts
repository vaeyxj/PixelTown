/**
 * 变换 Gizmo — 选中对象时显示的缩放/旋转/移动手柄
 */
import { Container, Graphics } from 'pixi.js'

/** Gizmo 手柄类型 */
export type GizmoHandle =
  | 'move'
  | 'tl' | 'tc' | 'tr'
  | 'ml' | 'mr'
  | 'bl' | 'bc' | 'br'
  | 'rotate'

const HANDLE_SIZE = 6
const HANDLE_COLOR = 0x2196f3
const HANDLE_FILL = 0xffffff
const ROTATE_COLOR = 0x4caf50
const BORDER_COLOR = 0x2196f3
const BORDER_ALPHA = 0.8

export class Gizmo {
  readonly container: Container
  private border: Graphics
  private handles: Map<GizmoHandle, Graphics> = new Map()
  private rotateHandle: Graphics

  /** 当前包围盒（世界坐标） */
  private bx = 0
  private by = 0
  private bw = 0
  private bh = 0

  constructor() {
    this.container = new Container()
    this.container.label = 'gizmo'
    this.container.visible = false

    // 选择边框
    this.border = new Graphics()
    this.container.addChild(this.border)

    // 8 个缩放手柄
    const handleNames: GizmoHandle[] = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br']
    for (const name of handleNames) {
      const g = new Graphics()
      g.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
        .fill(HANDLE_FILL)
        .stroke({ color: HANDLE_COLOR, width: 1.5 })
      g.eventMode = 'static'
      g.cursor = this.handleCursor(name)
      this.container.addChild(g)
      this.handles.set(name, g)
    }

    // 旋转手柄（顶部上方的圆形）
    this.rotateHandle = new Graphics()
    this.rotateHandle.circle(0, 0, 5).fill(ROTATE_COLOR).stroke({ color: 0xffffff, width: 1 })
    this.rotateHandle.eventMode = 'static'
    this.rotateHandle.cursor = 'crosshair'
    this.container.addChild(this.rotateHandle)
    this.handles.set('rotate', this.rotateHandle)
  }

  /** 显示 Gizmo 包围指定矩形（世界坐标） */
  show(x: number, y: number, w: number, h: number): void {
    this.bx = x
    this.by = y
    this.bw = w
    this.bh = h
    this.container.visible = true
    this.updatePositions()
  }

  /** 隐藏 Gizmo */
  hide(): void {
    this.container.visible = false
  }

  /** 检测点击了哪个手柄（世界坐标），返回 null 表示未命中 */
  hitTest(wx: number, wy: number): GizmoHandle | null {
    if (!this.container.visible) return null

    const threshold = HANDLE_SIZE + 2

    // 旋转手柄
    const rx = this.bx + this.bw / 2
    const ry = this.by - 20
    if (Math.abs(wx - rx) < threshold && Math.abs(wy - ry) < threshold) {
      return 'rotate'
    }

    // 8 个缩放手柄
    const positions = this.getHandlePositions()
    for (const [name, pos] of positions) {
      if (name === 'rotate') continue
      if (Math.abs(wx - pos.x) < threshold && Math.abs(wy - pos.y) < threshold) {
        return name
      }
    }

    // 包围盒内部 = move
    if (wx >= this.bx && wx <= this.bx + this.bw && wy >= this.by && wy <= this.by + this.bh) {
      return 'move'
    }

    return null
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }

  // ====== 私有方法 ======

  private updatePositions(): void {
    const { bx, by, bw, bh } = this

    // 边框
    this.border.clear()
    this.border.rect(bx, by, bw, bh).stroke({ color: BORDER_COLOR, alpha: BORDER_ALPHA, width: 1.5 })
    // 连接到旋转手柄的线
    this.border.moveTo(bx + bw / 2, by).lineTo(bx + bw / 2, by - 15)
      .stroke({ color: ROTATE_COLOR, alpha: 0.6, width: 1 })

    // 手柄位置
    const positions = this.getHandlePositions()
    for (const [name, pos] of positions) {
      const g = this.handles.get(name)
      if (g) {
        g.x = pos.x
        g.y = pos.y
      }
    }
  }

  private getHandlePositions(): Map<GizmoHandle, { x: number; y: number }> {
    const { bx, by, bw, bh } = this
    const cx = bx + bw / 2
    const cy = by + bh / 2

    return new Map<GizmoHandle, { x: number; y: number }>([
      ['tl', { x: bx, y: by }],
      ['tc', { x: cx, y: by }],
      ['tr', { x: bx + bw, y: by }],
      ['ml', { x: bx, y: cy }],
      ['mr', { x: bx + bw, y: cy }],
      ['bl', { x: bx, y: by + bh }],
      ['bc', { x: cx, y: by + bh }],
      ['br', { x: bx + bw, y: by + bh }],
      ['rotate', { x: cx, y: by - 20 }],
    ])
  }

  private handleCursor(handle: GizmoHandle): string {
    switch (handle) {
      case 'tl': case 'br': return 'nwse-resize'
      case 'tr': case 'bl': return 'nesw-resize'
      case 'tc': case 'bc': return 'ns-resize'
      case 'ml': case 'mr': return 'ew-resize'
      default: return 'move'
    }
  }
}
