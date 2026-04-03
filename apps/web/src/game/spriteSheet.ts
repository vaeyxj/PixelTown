import { Texture } from 'pixi.js'
import { loadSpriteSheet } from './spriteLoader'

/** 角色行走方向 */
export type Direction = 'down' | 'left' | 'right' | 'up'

/** 角色姿态 */
export type Pose = 'walk' | 'stand' | 'sit' | 'type'

/**
 * 标准角色 Sprite Sheet 布局（32×48px 每帧）
 *
 * 行排列（从上到下）:
 *   row 0: 面向下 站立+行走 4帧
 *   row 1: 面向左 站立+行走 4帧
 *   row 2: 面向右 站立+行走 4帧
 *   row 3: 面向上 站立+行走 4帧
 *   row 4: 坐姿 + 打字姿态（各 2 帧）
 */
const DIRECTION_ROW: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
}

const FRAMES_PER_ROW = 4

export class CharacterSpriteSheet {
  private readonly path: string
  private frames: Texture[] = []
  private loaded = false

  constructor(path: string) {
    this.path = path
  }

  async load(): Promise<void> {
    this.frames = await loadSpriteSheet(this.path, 32, 48)
    this.loaded = true
  }

  /** 获取指定方向和帧的 Texture */
  getFrame(direction: Direction, frameIndex: number): Texture {
    if (!this.loaded || this.frames.length === 0) {
      return Texture.WHITE
    }
    const row = DIRECTION_ROW[direction]
    const col = frameIndex % FRAMES_PER_ROW
    const idx = row * FRAMES_PER_ROW + col
    return this.frames[idx] ?? Texture.WHITE
  }

  /** 获取站立帧（行走动画第 0 帧） */
  getStandFrame(direction: Direction): Texture {
    return this.getFrame(direction, 0)
  }

  /** 获取坐姿帧 */
  getSitFrame(): Texture {
    const sitRowStart = 4 * FRAMES_PER_ROW
    return this.frames[sitRowStart] ?? Texture.WHITE
  }

  /** 获取打字姿态帧（坐姿行交替） */
  getTypeFrame(tick: number): Texture {
    const sitRowStart = 4 * FRAMES_PER_ROW
    const frameIdx = sitRowStart + (tick % 2 === 0 ? 0 : 1)
    return this.frames[frameIdx] ?? Texture.WHITE
  }

  get isLoaded(): boolean {
    return this.loaded
  }
}

/** 瓦片集管理 — 按索引访问裁切后的瓦片 */
export class TilesetManager {
  private readonly path: string
  private readonly tileWidth: number
  private readonly tileHeight: number
  private tiles: Texture[] = []

  constructor(path: string, tileWidth = 32, tileHeight = 32) {
    this.path = path
    this.tileWidth = tileWidth
    this.tileHeight = tileHeight
  }

  async load(): Promise<void> {
    const { loadTileset } = await import('./spriteLoader')
    this.tiles = await loadTileset(this.path, this.tileWidth, this.tileHeight)
  }

  getTile(index: number): Texture {
    return this.tiles[index] ?? Texture.WHITE
  }

  get count(): number {
    return this.tiles.length
  }
}
