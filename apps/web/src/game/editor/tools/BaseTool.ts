/**
 * 编辑器工具基类接口
 * 所有工具（选择、平移、瓦片笔刷、碰撞笔刷等）都实现此接口
 */
import type { FederatedPointerEvent, Container } from 'pixi.js'

/** 世界坐标系中的点 */
export interface WorldPoint {
  readonly x: number
  readonly y: number
}

/** 工具接口 */
export interface EditorTool {
  /** 工具名称（用于 UI 显示） */
  readonly name: string
  /** 工具图标（emoji） */
  readonly icon: string

  /** 激活工具时调用（切换到此工具） */
  activate(overlay: Container): void
  /** 停用工具时调用（切换到其他工具） */
  deactivate(): void

  /** 指针按下 */
  onPointerDown(e: FederatedPointerEvent, world: WorldPoint): void
  /** 指针移动 */
  onPointerMove(e: FederatedPointerEvent, world: WorldPoint): void
  /** 指针抬起 */
  onPointerUp(e: FederatedPointerEvent, world: WorldPoint): void
}
