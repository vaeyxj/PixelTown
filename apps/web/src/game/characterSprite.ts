/**
 * 像素角色精灵生成器
 * 每个角色 16×24 像素，4 方向 × 4 帧行走动画
 * 用 Graphics 绘制后预缓存为独立 Texture
 */
import { Graphics, RenderTexture, Application, Texture, Rectangle } from 'pixi.js'

export type Direction = 'down' | 'up' | 'left' | 'right'
export const CHAR_W = 16
export const CHAR_H = 24
export const FRAME_COUNT = 4
const DIR_ORDER: Direction[] = ['down', 'left', 'right', 'up']

export interface CharAppearance {
  readonly skinColor: number
  readonly hairColor: number
  readonly shirtColor: number
  readonly pantsColor: number
  readonly hairStyle: 'short' | 'long' | 'spiky'
}

/** 预生成的角色帧纹理集合 */
export interface CharacterFrames {
  /** Walk animation: frames[direction][frameIndex], 4 帧 */
  readonly frames: Record<Direction, readonly Texture[]>
  /** Sit/type animation: 2 帧 (工作坐姿) */
  readonly sit: readonly Texture[]
}

const SKIN_TONES = [0xffe0bd, 0xf5c9a0, 0xe8b887, 0xd4a574, 0xc68c53] as const
const HAIR_COLORS = [0x2a1a0a, 0x4a3020, 0x6a4a30, 0x8a6a40, 0x3a2a2a, 0x1a1a2a] as const
const SHIRT_COLORS = [
  0x4a7ab5, 0x5a9a5a, 0xb54a4a, 0x8a6ab5, 0xb58a4a,
  0x4ab5a0, 0xb54a8a, 0x5a6a8a, 0x8ab54a, 0xb5704a,
] as const
const PANTS_COLORS = [0x2a3a5a, 0x3a3a3a, 0x4a4a5a, 0x2a2a2a, 0x3a4a3a] as const
const HAIR_STYLES: CharAppearance['hairStyle'][] = ['short', 'long', 'spiky']

export function generateAppearance(seed: number): CharAppearance {
  const s = Math.abs(seed * 2654435761) >>> 0
  return {
    skinColor: SKIN_TONES[s % SKIN_TONES.length],
    hairColor: HAIR_COLORS[(s >> 4) % HAIR_COLORS.length],
    shirtColor: SHIRT_COLORS[(s >> 8) % SHIRT_COLORS.length],
    pantsColor: PANTS_COLORS[(s >> 12) % PANTS_COLORS.length],
    hairStyle: HAIR_STYLES[(s >> 16) % HAIR_STYLES.length],
  }
}

function px(g: Graphics, x: number, y: number, w: number, h: number, color: number): void {
  g.rect(x, y, w, h).fill(color)
}

function drawCharFrame(
  g: Graphics,
  offsetX: number,
  offsetY: number,
  dir: Direction,
  frame: number,
  ap: CharAppearance,
): void {
  const x = offsetX
  const y = offsetY
  const skin = ap.skinColor
  const hair = ap.hairColor
  const shirt = ap.shirtColor
  const pants = ap.pantsColor
  const shoe = 0x3a2a1a
  const eyeColor = 0x1a1a2a

  const legOffset = frame === 1 ? -1 : frame === 3 ? 1 : 0
  const bobY = (frame === 1 || frame === 3) ? -1 : 0

  // 阴影
  g.ellipse(x + 8, y + 23, 5, 2).fill({ color: 0x000000, alpha: 0.2 })

  // 头发后层
  if (ap.hairStyle === 'long') {
    px(g, x + 3, y + 2 + bobY, 10, 8, hair)
  }

  // 头部
  px(g, x + 4, y + 2 + bobY, 8, 8, skin)
  px(g, x + 3, y + 1 + bobY, 10, 3, hair)

  if (ap.hairStyle === 'spiky') {
    px(g, x + 3, y + bobY, 2, 2, hair)
    px(g, x + 7, y - 1 + bobY, 2, 2, hair)
    px(g, x + 11, y + bobY, 2, 2, hair)
  } else if (ap.hairStyle === 'short') {
    px(g, x + 3, y + 1 + bobY, 10, 2, hair)
  }

  // 眼睛
  if (dir === 'down') {
    px(g, x + 5, y + 5 + bobY, 2, 2, eyeColor)
    px(g, x + 9, y + 5 + bobY, 2, 2, eyeColor)
    px(g, x + 7, y + 8 + bobY, 2, 1, 0xd09070)
  } else if (dir === 'up') {
    px(g, x + 3, y + 2 + bobY, 10, 4, hair)
  } else if (dir === 'left') {
    px(g, x + 4, y + 5 + bobY, 2, 2, eyeColor)
    px(g, x + 6, y + 8 + bobY, 1, 1, 0xd09070)
  } else {
    px(g, x + 10, y + 5 + bobY, 2, 2, eyeColor)
    px(g, x + 9, y + 8 + bobY, 1, 1, 0xd09070)
  }

  // 身体
  px(g, x + 3, y + 10 + bobY, 10, 7, shirt)
  px(g, x + 4, y + 11 + bobY, 2, 3, lighten(shirt, 20))
  px(g, x + 11, y + 11 + bobY, 1, 5, darken(shirt, 30))

  // 手臂
  if (dir === 'left') {
    const armSwing = legOffset
    px(g, x + 2, y + 11 + bobY + armSwing, 2, 5, shirt)
    px(g, x + 2, y + 16 + bobY + armSwing, 2, 2, skin)
  } else if (dir === 'right') {
    const armSwing = legOffset
    px(g, x + 12, y + 11 + bobY + armSwing, 2, 5, shirt)
    px(g, x + 12, y + 16 + bobY + armSwing, 2, 2, skin)
  } else {
    const armSwingL = -legOffset
    const armSwingR = legOffset
    px(g, x + 1, y + 11 + bobY + armSwingL, 3, 5, shirt)
    px(g, x + 1, y + 16 + bobY + armSwingL, 3, 1, skin)
    px(g, x + 12, y + 11 + bobY + armSwingR, 3, 5, shirt)
    px(g, x + 12, y + 16 + bobY + armSwingR, 3, 1, skin)
  }

  // 腿
  if (dir === 'down' || dir === 'up') {
    px(g, x + 4, y + 17, 4, 4 + legOffset, pants)
    px(g, x + 4, y + 21 + legOffset, 4, 2, shoe)
    px(g, x + 8, y + 17, 4, 4 - legOffset, pants)
    px(g, x + 8, y + 21 - legOffset, 4, 2, shoe)
  } else {
    px(g, x + 5, y + 17, 3, 4 + legOffset, pants)
    px(g, x + 5, y + 21 + legOffset, 3, 2, shoe)
    px(g, x + 8, y + 17, 3, 4 - legOffset, pants)
    px(g, x + 8, y + 21 - legOffset, 3, 2, shoe)
  }
}

/** 坐姿帧 — 角色在工位坐下打字 (16×24) */
function drawSitFrame(
  g: Graphics,
  offsetX: number,
  offsetY: number,
  frame: number,
  ap: CharAppearance,
): void {
  const x = offsetX
  const y = offsetY
  const skin = ap.skinColor
  const hair = ap.hairColor
  const shirt = ap.shirtColor
  const pants = ap.pantsColor

  // 阴影（小，被桌子遮挡）
  g.ellipse(x + 8, y + 23, 3, 1).fill({ color: 0x000000, alpha: 0.12 })

  // 头发后层
  if (ap.hairStyle === 'long') {
    px(g, x + 3, y + 2, 10, 8, hair)
  }

  // 头部（正面朝下，看键盘）
  px(g, x + 4, y + 2, 8, 8, skin)
  px(g, x + 3, y + 1, 10, 3, hair)
  if (ap.hairStyle === 'spiky') {
    px(g, x + 3, y, 2, 2, hair)
    px(g, x + 7, y - 1, 2, 2, hair)
    px(g, x + 11, y, 2, 2, hair)
  } else if (ap.hairStyle === 'short') {
    px(g, x + 3, y + 1, 10, 2, hair)
  }
  // 眼睛（低头看屏幕）
  px(g, x + 5, y + 6, 2, 1, 0x1a1a2a)
  px(g, x + 9, y + 6, 2, 1, 0x1a1a2a)

  // 身体
  px(g, x + 3, y + 10, 10, 7, shirt)
  px(g, x + 4, y + 11, 2, 3, lighten(shirt, 20))
  px(g, x + 11, y + 11, 1, 5, darken(shirt, 30))

  // 手臂平放，第 frame=1 时轻微上移模拟打字
  const typingOffset = frame === 1 ? -1 : 0
  px(g, x + 1, y + 15 + typingOffset, 4, 2, shirt)
  px(g, x + 1, y + 16 + typingOffset, 3, 1, skin)
  px(g, x + 11, y + 15 + typingOffset, 4, 2, shirt)
  px(g, x + 12, y + 16 + typingOffset, 3, 1, skin)

  // 腿（坐姿，腿弯曲）
  px(g, x + 4, y + 18, 4, 5, pants)
  px(g, x + 8, y + 18, 4, 5, pants)
  px(g, x + 2, y + 21, 5, 2, pants)
  px(g, x + 9, y + 21, 5, 2, pants)
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount)
  const gg = Math.min(255, ((color >> 8) & 0xff) + amount)
  const b = Math.min(255, (color & 0xff) + amount)
  return (r << 16) | (gg << 8) | b
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - amount)
  const gg = Math.max(0, ((color >> 8) & 0xff) - amount)
  const b = Math.max(0, (color & 0xff) - amount)
  return (r << 16) | (gg << 8) | b
}

/**
 * 生成角色所有帧的独立纹理 (预缓存，不在游戏循环中创建)
 * 返回 CharacterFrames，包含行走帧和坐姿帧
 */
export function generateCharacterFrames(app: Application, appearance: CharAppearance): CharacterFrames {
  const SIT_FRAMES = 2
  const sheetW = CHAR_W * Math.max(FRAME_COUNT, SIT_FRAMES)
  const sheetH = CHAR_H * (DIR_ORDER.length + 1) // +1 行坐姿

  // 1. 绘制整张精灵图到 RenderTexture
  const g = new Graphics()
  for (let di = 0; di < DIR_ORDER.length; di++) {
    for (let fi = 0; fi < FRAME_COUNT; fi++) {
      drawCharFrame(g, fi * CHAR_W, di * CHAR_H, DIR_ORDER[di], fi, appearance)
    }
  }
  // 坐姿帧（第 DIR_ORDER.length 行）
  const sitRowY = DIR_ORDER.length * CHAR_H
  for (let fi = 0; fi < SIT_FRAMES; fi++) {
    drawSitFrame(g, fi * CHAR_W, sitRowY, fi, appearance)
  }

  const rt = RenderTexture.create({ width: sheetW, height: sheetH })
  app.renderer.render({ container: g, target: rt })
  g.destroy()

  // 2. 从精灵图切出每帧独立纹理
  const frames = {} as Record<Direction, Texture[]>
  for (let di = 0; di < DIR_ORDER.length; di++) {
    const dir = DIR_ORDER[di]
    frames[dir] = []
    for (let fi = 0; fi < FRAME_COUNT; fi++) {
      const frame = new Rectangle(fi * CHAR_W, di * CHAR_H, CHAR_W, CHAR_H)
      frames[dir].push(new Texture({ source: rt.source, frame }))
    }
  }

  // 坐姿帧
  const sit: Texture[] = []
  for (let fi = 0; fi < SIT_FRAMES; fi++) {
    sit.push(new Texture({ source: rt.source, frame: new Rectangle(fi * CHAR_W, sitRowY, CHAR_W, CHAR_H) }))
  }

  return { frames, sit }
}
