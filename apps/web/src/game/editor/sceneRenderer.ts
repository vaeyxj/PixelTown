/**
 * 场景渲染器 — 将 SceneData 渲染为 PixiJS 显示对象
 * - TileLayer: 烘焙为 RenderTexture（静态，高性能）
 * - collisionGrid / objectGrid: 不渲染（仅在编辑器工具叠加显示）
 */
import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  Text,
  TextStyle,
} from 'pixi.js'
import type { TileLayer, ZoneData } from './types'
import { decodeTile } from './types'
import type { LoadedScene } from './sceneLoader'

export interface SceneRenderResult {
  /** 调用以销毁所有渲染资源 */
  destroy: () => void
  /** 动画更新回调，需要每帧调用 */
  animTicker: () => void
}

/** 渲染瓦片图层到一个 RenderTexture */
function renderTileLayer(
  app: Application,
  layer: TileLayer,
  scene: LoadedScene,
  worldW: number,
  worldH: number,
): Sprite | null {
  if (!layer.visible) return null

  const { data, tilesets } = scene
  const { width, tileSize } = data
  const tempContainer = new Container()

  for (let i = 0; i < layer.data.length; i++) {
    const decoded = decodeTile(layer.data[i])
    if (!decoded) continue

    const [tilesetIdx, tileIdx] = decoded
    const tilesetDef = data.tilesets[tilesetIdx]
    if (!tilesetDef) continue

    const loaded = tilesets.get(tilesetDef.id)
    if (!loaded || tileIdx >= loaded.textures.length) continue

    const col = i % width
    const row = Math.floor(i / width)
    const sprite = new Sprite(loaded.textures[tileIdx])
    sprite.x = col * tileSize
    sprite.y = row * tileSize
    sprite.width = tileSize
    sprite.height = tileSize
    tempContainer.addChild(sprite)
  }

  // 烘焙到 RenderTexture
  const rt = RenderTexture.create({ width: worldW, height: worldH })
  app.renderer.render({ container: tempContainer, target: rt })
  tempContainer.destroy({ children: true })

  const layerSprite = new Sprite(rt)
  layerSprite.alpha = layer.opacity
  layerSprite.label = `tile:${layer.name}`
  return layerSprite
}

/** 渲染区域标签 */
function renderZoneLabels(zones: readonly ZoneData[], tileSize: number): Container {
  const labels = new Container()
  labels.label = 'zone-labels'

  for (const zone of zones) {
    const px = zone.x * tileSize
    const py = zone.y * tileSize
    const pw = zone.width * tileSize
    const displayName = (zone.properties['label'] as string) ?? zone.name
    const fontSize = zone.type === 'meeting_room' ? 7 : 8

    const label = new Text({
      text: displayName,
      style: new TextStyle({
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
        wordWrap: true,
        wordWrapWidth: pw - 8,
        lineHeight: fontSize + 3,
      }),
    })
    label.anchor.set(0.5, 0)
    label.x = px + pw / 2
    label.y = py + 5
    labels.addChild(label)
  }

  return labels
}

/**
 * 将完整场景渲染到 worldContainer
 * 返回 destroy 函数和动画 ticker
 */
export function renderScene(
  app: Application,
  worldContainer: Container,
  scene: LoadedScene,
): SceneRenderResult {
  const { data } = scene
  const worldW = data.width * data.tileSize
  const worldH = data.height * data.tileSize
  const renderTextures: RenderTexture[] = []

  // 底色背景
  const bg = new Graphics()
  bg.rect(0, 0, worldW, worldH).fill(0xd8d0c0)
  bg.label = 'background'
  worldContainer.addChild(bg)

  // 只渲染瓦片图层
  for (const layer of data.layers) {
    const sprite = renderTileLayer(app, layer, scene, worldW, worldH)
    if (sprite) {
      worldContainer.addChild(sprite)
      if (sprite.texture instanceof RenderTexture) {
        renderTextures.push(sprite.texture)
      }
    }
  }

  // 区域标签
  const labels = renderZoneLabels(data.zones, data.tileSize)
  worldContainer.addChild(labels)

  const animTicker = () => {}

  return {
    animTicker,
    destroy() {
      worldContainer.removeChildren()
      for (const rt of renderTextures) {
        rt.destroy(true)
      }
    },
  }
}
