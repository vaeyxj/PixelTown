/**
 * 相机控制器
 * - 平滑跟随玩家
 * - 入场缩放动画
 * - 鼠标滚轮缩放
 */
import { Application, Container } from 'pixi.js'

const TARGET_SCALE = 3
const MIN_SCALE = 1.5
const MAX_SCALE = 5

export interface CameraController {
  readonly x: number
  readonly y: number
  readonly scale: number
  onAnimationEnd: (() => void) | null
  update(targetX: number, targetY: number): void
  startEntryAnimation(): void
  /** 返回 true 表示动画还在播放 */
  updateEntryAnimation(dt: number): boolean
  addWheelZoom(canvas: HTMLCanvasElement): () => void
}

export function createCamera(
  app: Application,
  worldContainer: Container,
  worldW: number,
  worldH: number,
  initX: number,
  initY: number,
): CameraController {
  let cameraX = initX
  let cameraY = initY
  let scale = TARGET_SCALE
  let entryAnimating = false
  let entryProgress = 0
  let onAnimationEnd: (() => void) | null = null

  function applyToContainer(): void {
    const sw = app.screen.width
    const sh = app.screen.height
    let wx = sw / 2 - cameraX * scale
    let wy = sh / 2 - cameraY * scale
    wx = Math.min(0, Math.max(sw - worldW * scale, wx))
    wy = Math.min(0, Math.max(sh - worldH * scale, wy))
    worldContainer.x = wx
    worldContainer.y = wy
    worldContainer.scale.set(scale)
  }

  return {
    get x() { return cameraX },
    get y() { return cameraY },
    get scale() { return scale },
    get onAnimationEnd() { return onAnimationEnd },
    set onAnimationEnd(fn) { onAnimationEnd = fn },

    update(targetX, targetY) {
      cameraX += (targetX - cameraX) * 0.08
      cameraY += (targetY - cameraY) * 0.08
      applyToContainer()
    },

    startEntryAnimation() {
      const fitScale = Math.min(app.screen.width / worldW, app.screen.height / worldH) * 0.95
      scale = fitScale
      entryProgress = 0
      entryAnimating = true
      worldContainer.scale.set(fitScale)
    },

    updateEntryAnimation(dt) {
      if (!entryAnimating) return false
      entryProgress += dt * 0.3
      if (entryProgress >= 1) {
        entryAnimating = false
        scale = TARGET_SCALE
        worldContainer.scale.set(TARGET_SCALE)
        applyToContainer()
        onAnimationEnd?.()
        return false
      }
      const t = entryProgress < 0.5
        ? 4 * entryProgress ** 3
        : 1 - Math.pow(-2 * entryProgress + 2, 3) / 2
      const fitScale = Math.min(app.screen.width / worldW, app.screen.height / worldH) * 0.95
      scale = fitScale + (TARGET_SCALE - fitScale) * t
      worldContainer.scale.set(scale)
      const cx = worldW / 2 + (cameraX - worldW / 2) * t
      const cy = worldH / 2 + (cameraY - worldH / 2) * t
      worldContainer.x = app.screen.width / 2 - cx * scale
      worldContainer.y = app.screen.height / 2 - cy * scale
      return true
    },

    addWheelZoom(canvas) {
      const onWheel = (e: WheelEvent) => {
        if (entryAnimating) return
        e.preventDefault()
        const dir = e.deltaY < 0 ? 1 : -1
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * (1 + dir * 0.12)))
        applyToContainer()
      }
      canvas.addEventListener('wheel', onWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', onWheel)
    },
  }
}
