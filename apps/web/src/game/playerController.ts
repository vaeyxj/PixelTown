/**
 * 玩家输入控制器 — 键盘状态管理
 */

export interface PlayerInput {
  dx: number  // -1, 0, 1
  dy: number  // -1, 0, 1
}

export interface PlayerController {
  getInput(): PlayerInput
  destroy(): void
}

export function createPlayerController(): PlayerController {
  const keys: Record<string, boolean> = {}

  const onKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true }
  const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  return {
    getInput() {
      let dx = 0
      let dy = 0
      if (keys['w'] || keys['arrowup']) dy = -1
      if (keys['s'] || keys['arrowdown']) dy = 1
      if (keys['a'] || keys['arrowleft']) dx = -1
      if (keys['d'] || keys['arrowright']) dx = 1
      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(2)
        dx /= len
        dy /= len
      }
      return { dx, dy }
    },

    destroy() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    },
  }
}
