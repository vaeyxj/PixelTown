import { Assets, Texture, Rectangle } from 'pixi.js'

/** 资源清单 — 所有预加载路径 */
const ASSET_MANIFEST = {
  tiles: {
    floor: '/tiles/floor.png',
    wall: '/tiles/wall.png',
    furniture: '/tiles/furniture.png',
    decor: '/tiles/decor.png',
  },
  sprites: {
    male: '/sprites/character_male.png',
    female: '/sprites/character_female.png',
  },
  ui: {
    panel: '/ui/panel.png',
  },
  backgrounds: {
    login: '/backgrounds/login.png',
  },
} as const

/** 瓦片集加载 — 将大图裁切为均匀的 Texture 数组 */
export async function loadTileset(
  path: string,
  tileWidth: number = 32,
  tileHeight: number = 32,
): Promise<Texture[]> {
  const base = await Assets.load(path) as Texture
  const cols = Math.floor(base.width / tileWidth)
  const rows = Math.floor(base.height / tileHeight)

  const tiles: Texture[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rect = new Rectangle(col * tileWidth, row * tileHeight, tileWidth, tileHeight)
      tiles.push(new Texture({ source: base.source, frame: rect }))
    }
  }
  return tiles
}

/** Sprite Sheet 加载 — 裁切为动画帧数组 */
export async function loadSpriteSheet(
  path: string,
  frameWidth: number = 32,
  frameHeight: number = 48,
): Promise<Texture[]> {
  const base = await Assets.load(path) as Texture
  const cols = Math.floor(base.width / frameWidth)
  const rows = Math.floor(base.height / frameHeight)

  const frames: Texture[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rect = new Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight)
      frames.push(new Texture({ source: base.source, frame: rect }))
    }
  }
  return frames
}

/** 预加载所有游戏资源 */
export async function preloadAll(): Promise<void> {
  const paths = [
    ...Object.values(ASSET_MANIFEST.tiles),
    ...Object.values(ASSET_MANIFEST.sprites),
    ...Object.values(ASSET_MANIFEST.ui),
    ...Object.values(ASSET_MANIFEST.backgrounds),
  ]

  // 并行加载，失败时降级（资源可能还未生成）
  await Promise.allSettled(paths.map(p => Assets.load(p)))
}

/** 获取资源路径清单（供外部查询） */
export function getAssetPaths() {
  return ASSET_MANIFEST
}
