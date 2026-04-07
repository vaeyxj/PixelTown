/**
 * 编辑器视口 — 管理 PixiJS Application 的编辑器画布
 * 功能：平移、缩放、网格线、场景渲染、工具分发
 */
import { Application, Container, Graphics } from 'pixi.js'
import type { EditorTool, WorldPoint } from './tools/BaseTool'
import type { LoadedScene } from './sceneLoader'
import { renderScene, type SceneRenderResult } from './sceneRenderer'

export interface EditorViewportOptions {
  /** 挂载的 DOM 元素 */
  container: HTMLElement
  /** 已加载的场景 */
  scene: LoadedScene
}

const MIN_SCALE = 0.25
const MAX_SCALE = 8
const GRID_ALPHA = 0.15

export class EditorViewport {
  readonly app: Application
  readonly worldContainer: Container
  readonly overlayContainer: Container

  private gridGraphics: Graphics
  private sceneResult: SceneRenderResult | null = null
  private currentTool: EditorTool | null = null
  private scene: LoadedScene
  private scale = 2
  private destroyed = false

  // 中键/空格拖拽
  private spacePanning = false
  private spaceLastX = 0
  private spaceLastY = 0

  constructor(
    app: Application,
    scene: LoadedScene,
  ) {
    this.app = app
    this.scene = scene

    // 世界容器（场景内容）
    this.worldContainer = new Container()
    this.worldContainer.label = 'editor-world'
    app.stage.addChild(this.worldContainer)

    // 覆盖层（网格、选择框、Gizmo）
    this.overlayContainer = new Container()
    this.overlayContainer.label = 'editor-overlay'
    app.stage.addChild(this.overlayContainer)

    // 网格图层
    this.gridGraphics = new Graphics()
    this.gridGraphics.label = 'grid'
    this.overlayContainer.addChild(this.gridGraphics)

    // 渲染场景
    this.sceneResult = renderScene(app, this.worldContainer, scene)

    // 初始位置居中
    this.worldContainer.scale.set(this.scale)
    this.overlayContainer.scale.set(this.scale)
    this.centerView()

    // 绑定交互
    this.setupInteraction()
    this.drawGrid()
  }

  get worldW(): number {
    return this.scene.data.width * this.scene.data.tileSize
  }

  get worldH(): number {
    return this.scene.data.height * this.scene.data.tileSize
  }

  get tileSize(): number {
    return this.scene.data.tileSize
  }

  /** 设置当前工具 */
  setTool(tool: EditorTool | null): void {
    if (this.currentTool) {
      this.currentTool.deactivate()
    }
    // 清理旧的工具覆盖层
    const oldOverlays = this.overlayContainer.children.filter(c => c.label === 'tool-overlay')
    for (const overlay of oldOverlays) {
      this.overlayContainer.removeChild(overlay)
      overlay.destroy({ children: true })
    }
    this.currentTool = tool
    if (tool) {
      const toolOverlay = new Container()
      toolOverlay.label = 'tool-overlay'
      this.overlayContainer.addChild(toolOverlay)
      tool.activate(toolOverlay)
    }
  }

  /** 居中视图 */
  centerView(): void {
    const { width: sw, height: sh } = this.app.screen
    this.worldContainer.x = (sw - this.worldW * this.scale) / 2
    this.worldContainer.y = (sh - this.worldH * this.scale) / 2
    this.syncOverlay()
  }

  /** 重新加载场景 */
  reloadScene(scene: LoadedScene): void {
    this.scene = scene
    this.sceneResult?.destroy()
    this.sceneResult = renderScene(this.app, this.worldContainer, scene)
    this.drawGrid()
  }

  /** 屏幕坐标 → 世界坐标 */
  screenToWorld(sx: number, sy: number): WorldPoint {
    return {
      x: (sx - this.worldContainer.x) / this.scale,
      y: (sy - this.worldContainer.y) / this.scale,
    }
  }

  /** 平移画布 */
  pan(dx: number, dy: number): void {
    this.worldContainer.x += dx
    this.worldContainer.y += dy
    this.syncOverlay()
    this.drawGrid()
  }

  /** 缩放（以指定屏幕点为中心） */
  zoom(delta: number, centerX: number, centerY: number): void {
    const oldScale = this.scale
    const factor = delta > 0 ? 0.9 : 1.1
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.scale * factor))
    if (newScale === oldScale) return

    // 以鼠标位置为中心缩放
    const wx = (centerX - this.worldContainer.x) / oldScale
    const wy = (centerY - this.worldContainer.y) / oldScale
    this.scale = newScale
    this.worldContainer.scale.set(this.scale)
    this.worldContainer.x = centerX - wx * this.scale
    this.worldContainer.y = centerY - wy * this.scale
    this.overlayContainer.scale.set(this.scale)
    this.syncOverlay()
    this.drawGrid()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.currentTool?.deactivate()
    this.sceneResult?.destroy()
    this.removeInteraction()
    this.app.stage.removeChildren()
  }

  // ====== 私有方法 ======

  private syncOverlay(): void {
    this.overlayContainer.x = this.worldContainer.x
    this.overlayContainer.y = this.worldContainer.y
  }

  private drawGrid(): void {
    const g = this.gridGraphics
    g.clear()

    const ts = this.tileSize
    // 自适应网格：缩放较小时隐藏细网格
    if (this.scale < 0.5) return

    const alpha = this.scale < 1 ? GRID_ALPHA * 0.5 : GRID_ALPHA
    const color = 0x888888

    // 垂直线
    for (let x = 0; x <= this.worldW; x += ts) {
      g.moveTo(x, 0).lineTo(x, this.worldH).stroke({ color, alpha, width: 1 / this.scale })
    }
    // 水平线
    for (let y = 0; y <= this.worldH; y += ts) {
      g.moveTo(0, y).lineTo(this.worldW, y).stroke({ color, alpha, width: 1 / this.scale })
    }

    // 粗网格（每 8 格）
    if (this.scale >= 1) {
      const bigStep = ts * 8
      for (let x = 0; x <= this.worldW; x += bigStep) {
        g.moveTo(x, 0).lineTo(x, this.worldH).stroke({ color: 0x666666, alpha: alpha * 2, width: 2 / this.scale })
      }
      for (let y = 0; y <= this.worldH; y += bigStep) {
        g.moveTo(0, y).lineTo(this.worldW, y).stroke({ color: 0x666666, alpha: alpha * 2, width: 2 / this.scale })
      }
    }
  }

  // ====== 交互绑定 ======

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.zoom(e.deltaY, e.offsetX, e.offsetY)
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !this.spacePanning) {
      this.spacePanning = true
      e.preventDefault()
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spacePanning = false
    }
  }

  private removeInteraction: () => void = () => {}

  private setupInteraction(): void {
    const canvas = this.app.canvas as HTMLCanvasElement
    canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    // PixiJS 交互事件
    const stage = this.app.stage
    stage.eventMode = 'static'
    stage.hitArea = this.app.screen

    let middleDragging = false
    let middleLastX = 0
    let middleLastY = 0

    const onPointerDown = (e: import('pixi.js').FederatedPointerEvent) => {
      // 中键拖拽
      if (e.button === 1) {
        middleDragging = true
        middleLastX = e.globalX
        middleLastY = e.globalY
        return
      }

      // 空格+左键拖拽
      if (this.spacePanning && e.button === 0) {
        this.spaceLastX = e.globalX
        this.spaceLastY = e.globalY
        return
      }

      // 左键交给工具
      if (e.button === 0 && this.currentTool) {
        const world = this.screenToWorld(e.globalX, e.globalY)
        this.currentTool.onPointerDown(e, world)
      }
    }

    const onPointerMove = (e: import('pixi.js').FederatedPointerEvent) => {
      if (middleDragging) {
        this.pan(e.globalX - middleLastX, e.globalY - middleLastY)
        middleLastX = e.globalX
        middleLastY = e.globalY
        return
      }

      if (this.spacePanning && (e.buttons & 1)) {
        this.pan(e.globalX - this.spaceLastX, e.globalY - this.spaceLastY)
        this.spaceLastX = e.globalX
        this.spaceLastY = e.globalY
        return
      }

      if (this.currentTool) {
        const world = this.screenToWorld(e.globalX, e.globalY)
        this.currentTool.onPointerMove(e, world)
      }
    }

    const onPointerUp = (e: import('pixi.js').FederatedPointerEvent) => {
      if (e.button === 1) {
        middleDragging = false
        return
      }

      if (this.currentTool) {
        const world = this.screenToWorld(e.globalX, e.globalY)
        this.currentTool.onPointerUp(e, world)
      }
    }

    stage.on('pointerdown', onPointerDown)
    stage.on('pointermove', onPointerMove)
    stage.on('pointerup', onPointerUp)
    stage.on('pointerupoutside', onPointerUp)

    this.removeInteraction = () => {
      canvas.removeEventListener('wheel', this.handleWheel)
      window.removeEventListener('keydown', this.handleKeyDown)
      window.removeEventListener('keyup', this.handleKeyUp)
      stage.off('pointerdown', onPointerDown)
      stage.off('pointermove', onPointerMove)
      stage.off('pointerup', onPointerUp)
      stage.off('pointerupoutside', onPointerUp)
    }
  }
}
