import Phaser from 'phaser'
import { GAME_CONFIG } from './config'
import { CollisionMask } from './CollisionMask'
import { Player } from './Player'

class MainScene extends Phaser.Scene {
  private player!: Player
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>
  private mask!: CollisionMask

  constructor() {
    super('main')
  }

  preload() {
    this.load.image('bg', '/background.png')
    // 前景可选：不存在时静默失败
    this.load.image('fg', '/foreground.png')
    this.load.on(`loaderror`, (file: Phaser.Loader.File) => {
      if (file.key === 'fg') {
        // foreground.png 缺失，不是错误
      }
    })
  }

  async create() {
    const bg = this.add.image(0, 0, 'bg').setOrigin(0, 0).setDepth(0)
    const W = bg.width
    const H = bg.height

    if (this.textures.exists('fg')) {
      this.add.image(0, 0, 'fg').setOrigin(0, 0).setDepth(20)
    }

    // 加载碰撞掩码（异步）
    const loaded = await CollisionMask.load('/collision.png', GAME_CONFIG.collisionThreshold)
    this.mask = loaded ?? CollisionMask.empty(W, H)
    if (!loaded) {
      console.warn('[PixelTown] collision.png 未找到，使用空掩码（全图可走）。请先到 /?mode=collision 绘制并导出。')
    }

    this.player = new Player(this, GAME_CONFIG.startPos.x, GAME_CONFIG.startPos.y, this.mask)

    // 相机
    this.cameras.main.setBounds(0, 0, W, H)
    this.cameras.main.setZoom(GAME_CONFIG.zoom)
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15)
    this.cameras.main.roundPixels = true

    // 输入
    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    }) as typeof this.keys

    this.addHud()
  }

  override update(_time: number, deltaMs: number) {
    if (!this.player) return
    const dt = deltaMs / 1000
    const dx = (this.keys.A.isDown || this.keys.LEFT.isDown ? -1 : 0) + (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0)
    const dy = (this.keys.W.isDown || this.keys.UP.isDown ? -1 : 0) + (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0)
    this.player.update(dt, { dx, dy })
  }

  private addHud() {
    const hud = this.add
      .text(10, 10, 'WASD / 方向键 移动    编辑器: ?mode=collision  或  ?mode=foreground', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
    hud.setScale(1 / GAME_CONFIG.zoom)
  }
}

export function startGame(root: HTMLElement) {
  root.innerHTML = ''
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: root,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    scene: [MainScene],
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  })
}
