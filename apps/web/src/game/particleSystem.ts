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
