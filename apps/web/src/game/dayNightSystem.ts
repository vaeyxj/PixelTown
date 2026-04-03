/**
 * 日夜系统 — 天色遮罩 + 黎明/黄昏大气粒子
 * 从 engine.ts 提取，统一管理全局光照效果
 */
import { Container, Graphics } from 'pixi.js'
import { getDaylightOverlay } from './simulation'
import type { ParticleSystem } from './particleSystem'

// 黎明 (6–9h) 金白色，黄昏 (17–20h) 暖橙色
const DAWN_COLOR = 0xffe4a0
const DUSK_COLOR = 0xff9040

export interface DayNightSystem {
  update(
    hour: number,
    minute: number,
    dt: number,
    camX: number,
    camY: number,
    camScale: number,
    screenW: number,
    screenH: number,
    lowPerf?: boolean,
  ): void
  destroy(): void
}

export function createDayNightSystem(
  worldContainer: Container,
  worldW: number,
  worldH: number,
  particleSystem: ParticleSystem,
): DayNightSystem {
  const overlay = new Graphics()
  worldContainer.addChild(overlay)

  let dustTimer = 0

  return {
    update(hour, minute, dt, camX, camY, camScale, screenW, screenH, lowPerf = false) {
      // 天色遮罩
      const daylight = getDaylightOverlay(hour, minute)
      overlay.clear()
      if (daylight.alpha > 0) {
        overlay.rect(0, 0, worldW, worldH).fill({ color: daylight.color, alpha: daylight.alpha })
      }

      // 大气粒子：黎明 (6–9h) 或黄昏 (17–20h)
      const t = hour + minute / 60
      const isDawn = t >= 6 && t < 9
      const isDusk = t >= 17 && t < 20
      if (!isDawn && !isDusk) { dustTimer = 0; return }

      if (lowPerf) { dustTimer = 0; return }
      dustTimer += dt
      // 每 100ms 发射一颗粒子
      while (dustTimer >= 0.1) {
        dustTimer -= 0.1
        // 在当前视口内随机位置发射（世界坐标）
        const vx = -camX / camScale
        const vy = -camY / camScale
        const vw = screenW / camScale
        const vh = screenH / camScale
        const ex = vx + Math.random() * vw
        const ey = vy + Math.random() * vh
        particleSystem.emitAtmosphericDust(ex, ey, isDusk ? DUSK_COLOR : DAWN_COLOR)
      }
    },

    destroy() {
      overlay.destroy()
    },
  }
}
