/**
 * 玩家输入控制器 — 键盘 + 移动端虚拟摇杆
 */

export interface PlayerInput {
  dx: number  // -1 ~ 1
  dy: number  // -1 ~ 1
}

export interface PlayerController {
  getInput(): PlayerInput
  setMobileInput(dx: number, dy: number): void
  destroy(): void
}

export function createPlayerController(): PlayerController {
  const keys: Record<string, boolean> = {}
  let mobileDx = 0
  let mobileDy = 0

  const onKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true }
  const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  return {
    getInput() {
      let dx = mobileDx
      let dy = mobileDy
      if (keys['w'] || keys['arrowup']) dy = -1
      if (keys['s'] || keys['arrowdown']) dy = 1
      if (keys['a'] || keys['arrowleft']) dx = -1
      if (keys['d'] || keys['arrowright']) dx = 1
      if (dx !== 0 && dy !== 0 && (Math.abs(dx) === 1 && Math.abs(dy) === 1)) {
        const len = Math.sqrt(2)
        dx /= len
        dy /= len
      }
      return { dx, dy }
    },

    setMobileInput(dx: number, dy: number) {
      mobileDx = dx
      mobileDy = dy
    },

    destroy() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    },
  }
}
