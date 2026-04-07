/**
 * 场景加载器 — 加载 scene JSON 和瓦片集纹理
 */
import { Assets, Texture, Rectangle } from 'pixi.js'
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

/** 加载场景 JSON 和所有瓦片集 */
export async function loadScene(jsonPath: string): Promise<LoadedScene> {
  const response = await fetch(jsonPath)
  if (!response.ok) {
    throw new Error(`场景加载失败: ${response.status} ${jsonPath}`)
  }
  const data: SceneData = await response.json()

  const tilesets = new Map<string, LoadedTileset>()

  // 并行加载所有瓦片集图片
  await Promise.all(
    data.tilesets.map(async (def) => {
      const texture = await Assets.load<Texture>(def.imagePath)
      const textures = sliceTileset(texture, def)
      tilesets.set(def.id, { def, textures })
    }),
  )

  return { data, tilesets }
}
