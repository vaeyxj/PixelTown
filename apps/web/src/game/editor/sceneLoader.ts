/**
 * 场景加载器 — 加载 scene JSON 和瓦片集纹理
 */
import { Assets, Texture, Rectangle, ImageSource } from 'pixi.js'
import type { SceneData, TilesetDef } from './types'

/** 每个瓦片集加载后的运行时数据 */
export interface LoadedTileset {
  readonly def: TilesetDef
  /** 按 tileIndex 索引的纹理数组 */
  readonly textures: readonly Texture[]
}

/** 场景加载结果 */
export interface LoadedScene {
  readonly data: SceneData
  readonly tilesets: ReadonlyMap<string, LoadedTileset>
}

/** 从图片文件（File/Blob）加载瓦片集纹理 */
export async function loadTilesetFromBlob(file: Blob, def: TilesetDef): Promise<LoadedTileset> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  await img.decode()
  const source = new ImageSource({ resource: img })
  const baseTexture = new Texture({ source })
  URL.revokeObjectURL(url)
  const textures = sliceTileset(baseTexture, def)
  return { def, textures }
}

/** 将瓦片集图片切割为 Texture 数组 */
function sliceTileset(baseTexture: Texture, def: TilesetDef): Texture[] {
  const textures: Texture[] = []
  const { tileWidth, tileHeight, columns, tileCount } = def

  for (let i = 0; i < tileCount; i++) {
    const col = i % columns
    const row = Math.floor(i / columns)
    const frame = new Rectangle(col * tileWidth, row * tileHeight, tileWidth, tileHeight)
    textures.push(new Texture({ source: baseTexture.source, frame }))
  }

  return textures
}

const SCENE_STORAGE_KEY = 'pixeltown-scene'
const TILESET_STORAGE_PREFIX = 'pixeltown-tileset-'

/** 将场景数据 + 瓦片集图片写入 localStorage，供游戏引擎读取 */
export function applySceneToGame(data: SceneData, tilesetImages: ReadonlyMap<string, string>): void {
  localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(data))
  for (const [id, dataUrl] of tilesetImages) {
    localStorage.setItem(TILESET_STORAGE_PREFIX + id, dataUrl)
  }
}

/** 加载场景 JSON — 优先读 localStorage，否则 fetch 文件 */
export async function loadScene(jsonPath: string): Promise<LoadedScene> {
  const stored = localStorage.getItem(SCENE_STORAGE_KEY)
  let raw: Record<string, unknown>
  if (stored) {
    raw = JSON.parse(stored)
  } else {
    const response = await fetch(jsonPath)
    if (!response.ok) {
      throw new Error(`场景加载失败: ${response.status} ${jsonPath}`)
    }
    raw = await response.json()
  }
  const data = normalizeSceneData(raw)

  const tilesets = new Map<string, LoadedTileset>()

  // 并行加载所有瓦片集图片
  await Promise.all(
    data.tilesets.map(async (def) => {
      // 优先从 localStorage 读取 data URL
      const storedImage = localStorage.getItem(TILESET_STORAGE_PREFIX + def.id)
      let texture: Texture
      if (storedImage) {
        const img = new Image()
        img.src = storedImage
        await img.decode()
        const source = new ImageSource({ resource: img })
        texture = new Texture({ source })
      } else {
        texture = await Assets.load<Texture>(def.imagePath)
      }
      const textures = sliceTileset(texture, def)
      tilesets.set(def.id, { def, textures })
    }),
  )

  return { data, tilesets }
}

/** 兼容旧格式 JSON：确保 collisionGrid/objectGrid 存在，过滤非 tile 图层 */
function normalizeSceneData(raw: Record<string, unknown>): SceneData {
  const width = (raw.width as number) ?? 96
  const height = (raw.height as number) ?? 56
  const gridSize = width * height
  return {
    ...(raw as unknown as SceneData),
    collisionGrid: (raw.collisionGrid as number[]) ?? new Array(gridSize).fill(0),
    objectGrid: (raw.objectGrid as number[]) ?? new Array(gridSize).fill(0),
    layers: ((raw.layers as unknown[]) ?? []).filter(
      (l: unknown) => (l as { type: string }).type === 'tile'
    ) as SceneData['layers'],
  }
}
