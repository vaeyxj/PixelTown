/**
 * 选择工具 — 点击选中对象，拖拽变换手柄进行旋转/缩放/平移
 */
import type { FederatedPointerEvent, Container } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { SceneObject } from '../types'
import { Gizmo, type GizmoHandle } from '../Gizmo'

export interface SelectToolCallbacks {
  /** 获取当前场景所有对象 */
  getObjects: () => readonly SceneObject[]
  /** 选中对象变更 */
  onSelect: (obj: SceneObject | null) => void
  /** 对象变换更新 */
  onTransform: (objectId: string, changes: Partial<Pick<SceneObject, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'scaleX' | 'scaleY'>>) => void
}

export class SelectTool implements EditorTool {
  readonly name = '选择'
  readonly icon = '🖱️'

  private gizmo: Gizmo
  private callbacks: SelectToolCallbacks
  private selected: SceneObject | null = null

  // 拖拽状态
  private dragging = false
  private dragHandle: GizmoHandle | null = null
  private dragStartWorld: WorldPoint = { x: 0, y: 0 }
  private dragStartObj = { x: 0, y: 0, w: 0, h: 0, rotation: 0 }

  constructor(callbacks: SelectToolCallbacks) {
    this.callbacks = callbacks
    this.gizmo = new Gizmo()
  }

  activate(toolOverlay: Container): void {
    toolOverlay.addChild(this.gizmo.container)
  }

  deactivate(): void {
    this.gizmo.hide()
    this.selected = null
    this.dragging = false
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    // 先检查是否点到了 Gizmo 手柄
    if (this.selected) {
      const handle = this.gizmo.hitTest(world.x, world.y)
      if (handle) {
        this.dragging = true
        this.dragHandle = handle
        this.dragStartWorld = world
        this.dragStartObj = {
          x: this.selected.x,
          y: this.selected.y,
          w: this.selected.width * this.selected.scaleX,
          h: this.selected.height * this.selected.scaleY,
          rotation: this.selected.rotation,
        }
        return
      }
    }

    // 否则尝试选中对象
    const objects = this.callbacks.getObjects()
    // 反向遍历（顶层优先）
    let hit: SceneObject | null = null
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      const ox = obj.x
      const oy = obj.y
      const ow = obj.width * obj.scaleX
      const oh = obj.height * obj.scaleY
      if (world.x >= ox && world.x <= ox + ow && world.y >= oy && world.y <= oy + oh) {
        hit = obj
        break
      }
    }

    this.selected = hit
    this.callbacks.onSelect(hit)

    if (hit) {
      const ow = hit.width * hit.scaleX
      const oh = hit.height * hit.scaleY
      this.gizmo.show(hit.x, hit.y, ow, oh)

      // 如果点中了对象，立即开始 move 拖拽
      this.dragging = true
      this.dragHandle = 'move'
      this.dragStartWorld = world
      this.dragStartObj = { x: hit.x, y: hit.y, w: ow, h: oh, rotation: hit.rotation }
    } else {
      this.gizmo.hide()
    }
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    if (!this.dragging || !this.selected || !this.dragHandle) return

    const dx = world.x - this.dragStartWorld.x
    const dy = world.y - this.dragStartWorld.y

    if (this.dragHandle === 'move') {
      this.callbacks.onTransform(this.selected.id, {
        x: this.dragStartObj.x + dx,
        y: this.dragStartObj.y + dy,
      })
      this.gizmo.show(
        this.dragStartObj.x + dx,
        this.dragStartObj.y + dy,
        this.dragStartObj.w,
        this.dragStartObj.h,
      )
    } else if (this.dragHandle === 'rotate') {
      // 旋转：计算鼠标相对于对象中心的角度
      const cx = this.dragStartObj.x + this.dragStartObj.w / 2
      const cy = this.dragStartObj.y + this.dragStartObj.h / 2
      const angle = Math.atan2(world.y - cy, world.x - cx) * (180 / Math.PI) + 90
      this.callbacks.onTransform(this.selected.id, { rotation: angle })
    } else {
      // 缩放手柄
      this.handleScaleDrag(dx, dy)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    this.dragging = false
    this.dragHandle = null
  }

  // ====== 私有方法 ======

  private handleScaleDrag(dx: number, dy: number): void {
    if (!this.selected || !this.dragHandle) return

    const { x: sx, y: sy, w: sw, h: sh } = this.dragStartObj
    let newX = sx
    let newY = sy
    let newW = sw
    let newH = sh

    const handle = this.dragHandle

    // X 方向
    if (handle === 'tl' || handle === 'ml' || handle === 'bl') {
      newX = sx + dx
      newW = sw - dx
    }
    if (handle === 'tr' || handle === 'mr' || handle === 'br') {
      newW = sw + dx
    }

    // Y 方向
    if (handle === 'tl' || handle === 'tc' || handle === 'tr') {
      newY = sy + dy
      newH = sh - dy
    }
    if (handle === 'bl' || handle === 'bc' || handle === 'br') {
      newH = sh + dy
    }

    // 最小尺寸
    const minSize = 4
    if (newW < minSize) { newW = minSize; newX = sx + sw - minSize }
    if (newH < minSize) { newH = minSize; newY = sy + sh - minSize }

    const scaleX = newW / this.selected.width
    const scaleY = newH / this.selected.height

    this.callbacks.onTransform(this.selected.id, {
      x: newX,
      y: newY,
      scaleX,
      scaleY,
    })

    this.gizmo.show(newX, newY, newW, newH)
  }
}
