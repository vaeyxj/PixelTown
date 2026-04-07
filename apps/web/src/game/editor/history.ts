/**
 * 撤销/重做历史系统 — 基于快照的 undo/redo
 * 每次编辑操作后保存一份完整的 SceneData 快照
 * 简单可靠，适合中小规模地图数据
 */
import type { SceneData } from './types'

const MAX_HISTORY = 50

export class EditorHistory {
  private undoStack: string[] = []
  private redoStack: string[] = []

  /** 保存当前快照 */
  push(data: SceneData): void {
    this.undoStack.push(JSON.stringify(data))
    // 新操作清空 redo
    this.redoStack.length = 0
    // 限制历史大小
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift()
    }
  }

  /** 撤销，返回上一个快照；无历史则返回 null */
  undo(currentData: SceneData): SceneData | null {
    if (this.undoStack.length === 0) return null
    // 当前状态推入 redo
    this.redoStack.push(JSON.stringify(currentData))
    const snapshot = this.undoStack.pop()!
    return JSON.parse(snapshot) as SceneData
  }

  /** 重做，返回下一个快照；无记录则返回 null */
  redo(currentData: SceneData): SceneData | null {
    if (this.redoStack.length === 0) return null
    // 当前状态推入 undo
    this.undoStack.push(JSON.stringify(currentData))
    const snapshot = this.redoStack.pop()!
    return JSON.parse(snapshot) as SceneData
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear(): void {
    this.undoStack.length = 0
    this.redoStack.length = 0
  }
}
