/**
 * 粒子系统 — 对象池复用
 * 效果：
 * - 角色行走时脚下尘土粒子
 */
import { Container, Graphics } from 'pixi.js'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
  active: boolean
}

const POOL_SIZE = 128

export interface ParticleSystem {
  emitWalkDust(x: number, y: number): void
  /** NPC 工作时键盘上方微光粒子 */
  emitKeyboardGlow(x: number, y: number): void
  /** 黎明/黄昏大气光斑粒子 */
  emitAtmosphericDust(x: number, y: number, color: number): void
  update(dt: number): void
  destroy(): void
}

export function createParticleSystem(layer: Container): ParticleSystem {
  const pool: Particle[] = Array.from({ length: POOL_SIZE }, () => ({
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 0.4,
    size: 1, color: 0xc8b898,
    active: false,
  }))

  const g = new Graphics()
  layer.addChild(g)

  function acquire(): Particle | null {
    return pool.find(p => !p.active) ?? null
  }

  return {
    emitWalkDust(x, y) {
      for (let i = 0; i < 2; i++) {
        const p = acquire()
        if (!p) return
        p.active = true
        p.x = x + (Math.random() - 0.5) * 4
        p.y = y + 1
        p.vx = (Math.random() - 0.5) * 8
        p.vy = -4 - Math.random() * 4
        p.life = 0.3 + Math.random() * 0.15
        p.maxLife = p.life
        p.size = 1 + Math.random()
        p.color = 0xc0a880
      }
    },

    emitKeyboardGlow(x, y) {
      for (let i = 0; i < 3; i++) {
        const p = acquire()
        if (!p) return
        p.active = true
        p.x = x + (Math.random() - 0.5) * 8
        p.y = y - 8 + (Math.random() - 0.5) * 3
        p.vx = (Math.random() - 0.5) * 5
        p.vy = -6 - Math.random() * 5
        p.life = 0.5 + Math.random() * 0.3
        p.maxLife = p.life
        p.size = 0.5 + Math.random() * 0.5
        p.color = Math.random() > 0.5 ? 0xffffff : 0xffe080
      }
    },

    emitAtmosphericDust(x, y, color) {
      const p = acquire()
      if (!p) return
      p.active = true
      p.x = x + (Math.random() - 0.5) * 30
      p.y = y + (Math.random() - 0.5) * 30
      p.vx = 4 + Math.random() * 6   // 缓慢水平漂移
      p.vy = -0.5 - Math.random()    // 极慢上浮
      p.life = 2.0 + Math.random() * 2.0
      p.maxLife = p.life
      p.size = 1 + Math.random() * 1.5
      p.color = color
    },

    update(dt) {
      g.clear()
      for (const p of pool) {
        if (!p.active) continue
        p.life -= dt
        if (p.life <= 0) { p.active = false; continue }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 12 * dt  // gravity
        const alpha = p.life / p.maxLife * 0.7
        g.rect(p.x, p.y, p.size, p.size).fill({ color: p.color, alpha })
      }
    },

    destroy() {
      g.destroy()
    },
  }
}
