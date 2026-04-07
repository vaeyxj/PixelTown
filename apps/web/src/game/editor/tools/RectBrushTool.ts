/**
 * 矩形笔刷工具 — 拖拽绘制矩形区域的瓦片
 * 按下起点 → 拖拽 → 松开终点，填充矩形内所有瓦片
 */
import { Graphics, Sprite, Texture, Container } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'
import type { LoadedScene } from '../sceneLoader'

export class RectBrushTool implements EditorTool {
  readonly name = '矩形'
  readonly icon = '⬜'

  private readonly state: EditorState
  private readonly scene: LoadedScene
  private overlay: Container | null = null
  private preview: Graphics | null = null
  private ghost: Sprite | null = null
  private dragging = false
  private startTX = 0
  private startTY = 0
  private endTX = 0
  private endTY = 0

  constructor(state: EditorState, scene: LoadedScene) {
    this.state = state
    this.scene = scene
  }

  activate(toolOverlay: Container): void {
    this.overlay = toolOverlay
    this.preview = new Graphics()
    this.ghost = new Sprite(Texture.WHITE)
    this.ghost.alpha = 0.4
    this.ghost.visible = false
    toolOverlay.addChild(this.preview)
    toolOverlay.addChild(this.ghost)
  }

  deactivate(): void {
    this.dragging = false
    this.overlay = null
    this.preview = null
    this.ghost = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    this.startTX = Math.floor(world.x / ts)
    this.startTY = Math.floor(world.y / ts)
    this.endTX = this.startTX
    this.endTY = this.startTY
    this.dragging = true
    this.drawPreview()
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)

    if (this.dragging) {
      this.endTX = tx
      this.endTY = ty
      this.drawPreview()
    } else {
      this.updateGhost(tx, ty)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    if (!this.dragging) return
    this.dragging = false

    const minX = Math.min(this.startTX, this.endTX)
    const maxX = Math.max(this.startTX, this.endTX)
    const minY = Math.min(this.startTY, this.endTY)
    const maxY = Math.max(this.startTY, this.endTY)

    const coords: { x: number; y: number }[] = []
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        coords.push({ x, y })
      }
    }
    this.state.paintTiles(coords)
    this.preview?.clear()
  }

  private drawPreview(): void {
    if (!this.preview) return
    const ts = this.state.tileSize
    const minX = Math.min(this.startTX, this.endTX)
    const maxX = Math.max(this.startTX, this.endTX)
    const minY = Math.min(this.startTY, this.endTY)
    const maxY = Math.max(this.startTY, this.endTY)

    const px = minX * ts
    const py = minY * ts
    const pw = (maxX - minX + 1) * ts
    const ph = (maxY - minY + 1) * ts

    this.preview.clear()
    this.preview.rect(px, py, pw, ph)
      .fill({ color: 0x4a9af5, alpha: 0.2 })
      .stroke({ color: 0x4a9af5, alpha: 0.7, width: 1 })

    // 隐藏单格 ghost
    if (this.ghost) this.ghost.visible = false
  }

  private updateGhost(tx: number, ty: number): void {
    if (!this.ghost) return
    const { selectedTile, tileSize } = this.state
    if (!selectedTile) {
      this.ghost.visible = false
      return
    }
    const loaded = this.scene.tilesets.get(selectedTile.tilesetId)
    if (!loaded || selectedTile.tileIndex >= loaded.textures.length) {
      this.ghost.visible = false
      return
    }
    this.ghost.texture = loaded.textures[selectedTile.tileIndex]
    this.ghost.x = tx * tileSize
    this.ghost.y = ty * tileSize
    this.ghost.width = tileSize
    this.ghost.height = tileSize
    this.ghost.visible = true
  }
}
