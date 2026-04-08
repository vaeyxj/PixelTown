/**
 * 多瓦片区域 ghost 预览构建器
 * 在 Container 中生成选中区域所有瓦片的半透明预览
 */
import { Container, Sprite } from 'pixi.js'
import type { EditorState } from '../EditorState'
import type { LoadedScene } from '../sceneLoader'

/**
 * 构建区域 ghost 预览。返回 true 表示成功，false 表示无可用区域。
 * 调用方需自行设置 container.x/y 和 visible。
 */
export function buildRegionGhost(
  container: Container,
  region: EditorState['selectedRegion'],
  state: EditorState,
  scene: LoadedScene,
): boolean {
  container.removeChildren()

  if (!region) {
    container.visible = false
    return false
  }

  const loaded = scene.tilesets.get(region.tilesetId)
  const tsDef = state.tilesets.find(t => t.id === region.tilesetId)
  if (!loaded || !tsDef) {
    container.visible = false
    return false
  }

  const { tileSize } = state
  for (let dy = 0; dy < region.rows; dy++) {
    for (let dx = 0; dx < region.cols; dx++) {
      const tileIndex = (region.row + dy) * tsDef.columns + (region.col + dx)
      if (tileIndex >= loaded.textures.length) continue
      const sprite = new Sprite(loaded.textures[tileIndex])
      sprite.x = dx * tileSize
      sprite.y = dy * tileSize
      sprite.width = tileSize
      sprite.height = tileSize
      container.addChild(sprite)
    }
  }

  return container.children.length > 0
}
