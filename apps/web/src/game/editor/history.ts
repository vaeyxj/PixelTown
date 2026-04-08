/**
 * 撤销/重做历史系统 — 基于快照的 undo/redo
 * 维护 lastCommitted 表示当前已提交的状态
 * undo 栈存放的都是「之前」的状态，不包含当前状态
 */
import type { SceneData } from './types'

const MAX_HISTORY = 50

export class EditorHistory {
  private undoStack: string[] = []
  private redoStack: string[] = []
  private lastCommitted: string | null = null

  /** 提交新快照：把上一个状态推入 undo 栈，记录新状态为 lastCommitted */
  push(data: SceneData): void {
    if (this.lastCommitted !== null) {
      this.undoStack.push(this.lastCommitted)
      if (this.undoStack.length > MAX_HISTORY) {
        this.undoStack.shift()
      }
    }
    this.lastCommitted = JSON.stringify(data)
    this.redoStack.length = 0
  }

  /** 撤销：返回上一个快照，当前状态推入 redo */
  undo(): SceneData | null {
    if (this.undoStack.length === 0) return null
    if (this.lastCommitted !== null) {
      this.redoStack.push(this.lastCommitted)
    }
    this.lastCommitted = this.undoStack.pop()!
    return JSON.parse(this.lastCommitted) as SceneData
  }

  /** 重做：返回下一个快照，当前状态推入 undo */
  redo(): SceneData | null {
    if (this.redoStack.length === 0) return null
    if (this.lastCommitted !== null) {
      this.undoStack.push(this.lastCommitted)
    }
    this.lastCommitted = this.redoStack.pop()!
    return JSON.parse(this.lastCommitted) as SceneData
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
    this.lastCommitted = null
  }
}
