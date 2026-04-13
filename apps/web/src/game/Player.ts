import Phaser from 'phaser'
import { GAME_CONFIG } from './config'
import type { CollisionMask } from './CollisionMask'

export class Player {
  readonly sprite: Phaser.GameObjects.Rectangle
  private x: number
  private y: number
  private readonly mask: CollisionMask

  constructor(scene: Phaser.Scene, startX: number, startY: number, mask: CollisionMask) {
    this.x = startX
    this.y = startY
    this.mask = mask
    const { w, h } = GAME_CONFIG.playerSize
    this.sprite = scene.add.rectangle(startX, startY, w, h, 0xffcc66).setDepth(10)
    scene.add.rectangle(startX, startY + h / 2 - 1, w - 4, 2, 0x884400).setDepth(10)
  }

  update(dt: number, input: { dx: number; dy: number }) {
    let { dx, dy } = input
    if (dx === 0 && dy === 0) return
    const len = Math.hypot(dx, dy)
    dx /= len
    dy /= len
    const step = GAME_CONFIG.playerSpeed * dt

    // 轴分离试探，实现贴墙滑行
    const nx = this.x + dx * step
    if (!this.collidesAt(nx, this.y)) this.x = nx
    const ny = this.y + dy * step
    if (!this.collidesAt(this.x, ny)) this.y = ny

    this.sprite.setPosition(Math.round(this.x), Math.round(this.y))
  }

  private collidesAt(cx: number, cy: number): boolean {
    for (const p of GAME_CONFIG.footprint) {
      if (this.mask.isBlocked(cx + p.x, cy + p.y)) return true
    }
    return false
  }

  get pos() {
    return { x: this.x, y: this.y }
  }
}
