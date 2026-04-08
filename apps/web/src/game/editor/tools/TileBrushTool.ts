/**
 * 瓦片笔刷工具 — 在 TileLayer 上绘制瓦片
 * 支持单击放置和拖拽连续绘制，移动时显示半透明预览
 */
import { Container, Graphics } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'
import type { LoadedScene } from '../sceneLoader'
import { buildRegionGhost } from './ghostHelper'

export class TileBrushTool implements EditorTool {
  readonly name = '笔刷'
  readonly icon = '🖌️'

  private state: EditorState
  private scene: LoadedScene
  private ghostContainer: Container | null = null
  private painting = false

  constructor(state: EditorState, scene: LoadedScene) {
    this.state = state
    this.scene = scene
  }

  activate(toolOverlay: Container): void {
    this.ghostContainer = new Container()
    this.ghostContainer.alpha = 0.5
    this.ghostContainer.visible = false
    toolOverlay.addChild(this.ghostContainer)
  }

  deactivate(): void {
    this.painting = false
    this.ghostContainer = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.painting = true
    this.paintAt(world)
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.updateGhost(world)
    if (this.painting) {
      this.paintAt(world)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    this.painting = false
  }

  private paintAt(world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.state.paintTile(tx, ty)
  }

  private updateGhost(world: WorldPoint): void {
    if (!this.ghostContainer) return
    const { selectedRegion, tileSize } = this.state

    const built = buildRegionGhost(this.ghostContainer, selectedRegion, this.state, this.scene)
    if (!built) return

    const tx = Math.floor(world.x / tileSize)
    const ty = Math.floor(world.y / tileSize)
    this.ghostContainer.x = tx * tileSize
    this.ghostContainer.y = ty * tileSize
    this.ghostContainer.visible = true
  }
}

/**
 * 瓦片橡皮擦工具
 */
export class TileEraserTool implements EditorTool {
  readonly name = '橡皮擦'
  readonly icon = '🧹'

  private state: EditorState
  private erasing = false
  private highlight: Graphics | null = null

  constructor(state: EditorState) {
    this.state = state
  }

  activate(toolOverlay: Container): void {
    this.highlight = new Graphics()
    toolOverlay.addChild(this.highlight)
  }

  deactivate(): void {
    this.erasing = false
    this.highlight = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.erasing = true
    this.eraseAt(world)
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    this.updateHighlight(world)
    if (this.erasing) {
      this.eraseAt(world)
    }
  }

  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {
    this.erasing = false
  }

  private eraseAt(world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.state.eraseTile(tx, ty)
  }

  private updateHighlight(world: WorldPoint): void {
    if (!this.highlight) return
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.highlight.clear()
    this.highlight.rect(tx * ts, ty * ts, ts, ts)
      .fill({ color: 0xff4444, alpha: 0.3 })
      .stroke({ color: 0xff4444, alpha: 0.6, width: 1 })
  }
}

/**
 * 油漆桶填充工具
 */
export class TileFillTool implements EditorTool {
  readonly name = '填充'
  readonly icon = '🪣'

  private state: EditorState

  constructor(state: EditorState) {
    this.state = state
  }

  activate(_toolOverlay: Container): void {}
  deactivate(): void {}

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize
    const tx = Math.floor(world.x / ts)
    const ty = Math.floor(world.y / ts)
    this.state.fillTiles(tx, ty)
  }

  onPointerMove(_e: FederatedPointerEvent, _world: WorldPoint): void {}
  onPointerUp(_e: FederatedPointerEvent, _world: WorldPoint): void {}
}
