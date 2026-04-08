/**
 * 对象放置工具 — 在 ObjectLayer 上放置 SceneObject
 * 从瓦片集选择后，点击画布放置为自由对象（支持后续 Select 工具变换）
 */
import { Container, Sprite, Texture } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'
import type { LoadedScene } from '../sceneLoader'
import type { SceneObject } from '../types'

let objectIdCounter = 0

export class ObjectPlaceTool implements EditorTool {
  readonly name = '放置对象'
  readonly icon = '📌'

  private state: EditorState
  private scene: LoadedScene
  private ghost: Sprite | null = null

  constructor(state: EditorState, scene: LoadedScene) {
    this.state = state
    this.scene = scene
  }

  activate(toolOverlay: Container): void {
    this.ghost = new Sprite(Texture.WHITE)
    this.ghost.alpha = 0.5
    this.ghost.visible = false
    toolOverlay.addChild(this.ghost)
  }

  deactivate(): void {
    this.ghost = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const { selectedRegion, tileSize } = this.state
    if (!selectedRegion) return

    const tsDef = this.state.tilesets.find(t => t.id === selectedRegion.tilesetId)
    if (!tsDef) return

    const tileIndex = selectedRegion.row * tsDef.columns + selectedRegion.col

    // 吸附到网格
    const snapX = Math.floor(world.x / tileSize) * tileSize
    const snapY = Math.floor(world.y / tileSize) * tileSize

    const newObj: SceneObject = {
      id: `obj_${Date.now()}_${objectIdCounter++}`,
      name: `${tsDef.name}_${tileIndex}`,
      x: snapX,
      y: snapY,
      width: tsDef.tileWidth * selectedRegion.cols,
      height: tsDef.tileHeight * selectedRegion.rows,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      tilesetId: selectedRegion.tilesetId,
      tileIndex,
      properties: {},
    }

    this.state.addObject(newObj)
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.updateGhost(world)
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {}

  private updateGhost(world: WorldPoint): void {
    if (!this.ghost) return
    const { selectedRegion, tileSize } = this.state
    if (!selectedRegion) {
      this.ghost.visible = false
      return
    }

    const loaded = this.scene.tilesets.get(selectedRegion.tilesetId)
    const tsDef = this.state.tilesets.find(t => t.id === selectedRegion.tilesetId)
    if (!loaded || !tsDef) {
      this.ghost.visible = false
      return
    }

    const tileIndex = selectedRegion.row * tsDef.columns + selectedRegion.col
    if (tileIndex >= loaded.textures.length) {
      this.ghost.visible = false
      return
    }

    const snapX = Math.floor(world.x / tileSize) * tileSize
    const snapY = Math.floor(world.y / tileSize) * tileSize

    this.ghost.texture = loaded.textures[tileIndex]
    this.ghost.x = snapX
    this.ghost.y = snapY
    this.ghost.width = tsDef.tileWidth * selectedRegion.cols
    this.ghost.height = tsDef.tileHeight * selectedRegion.rows
    this.ghost.visible = true
  }
}
