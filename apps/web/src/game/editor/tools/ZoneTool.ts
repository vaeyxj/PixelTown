/**
 * 区域绘制工具 — 拖拽创建/选择区域矩形
 * 区域渲染为带颜色标签的半透明矩形叠加
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { EditorTool, WorldPoint } from './BaseTool'
import type { EditorState } from '../EditorState'
import type { ZoneData, ZoneType } from '../types'

const ZONE_COLORS: Record<ZoneType, number> = {
  workstation: 0x6b8e5a,
  shared_desk: 0x8ab86a,
  meeting_room: 0x2a3a6b,
  restroom: 0x6aaad4,
  storage: 0xc49a6c,
  exit: 0x7ab87a,
  hallway: 0xd4cbb8,
  service: 0xe8b4b8,
  gym: 0x5a7a5a,
}

export interface ZoneToolCallbacks {
  onSelectZone: (zone: ZoneData | null) => void
  onZoneCreated: (zone: ZoneData) => void
}

let zoneIdCounter = 0

export class ZoneTool implements EditorTool {
  readonly name = '区域'
  readonly icon = '🏷️'

  private state: EditorState
  private callbacks: ZoneToolCallbacks
  private zoneOverlay: Graphics | null = null
  private labelContainer: Container | null = null
  private drawingRect: Graphics | null = null

  // 拖拽创建状态
  private drawing = false
  private drawStartX = 0
  private drawStartY = 0

  constructor(state: EditorState, callbacks: ZoneToolCallbacks) {
    this.state = state
    this.callbacks = callbacks
  }

  activate(toolOverlay: Container): void {
    this.zoneOverlay = new Graphics()
    toolOverlay.addChild(this.zoneOverlay)

    this.labelContainer = new Container()
    toolOverlay.addChild(this.labelContainer)

    this.drawingRect = new Graphics()
    toolOverlay.addChild(this.drawingRect)

    this.redrawZones()
  }

  deactivate(): void {
    this.drawing = false
    this.zoneOverlay = null
    this.labelContainer = null
    this.drawingRect = null
  }

  onPointerDown(_e: FederatedPointerEvent, world: WorldPoint): void {
    const ts = this.state.tileSize

    // 检查是否点中了已有区域
    const hit = this.hitTestZone(world)
    if (hit) {
      this.callbacks.onSelectZone(hit)
      return
    }

    // 开始拖拽创建新区域
    this.drawing = true
    this.drawStartX = Math.floor(world.x / ts) * ts
    this.drawStartY = Math.floor(world.y / ts) * ts
    this.callbacks.onSelectZone(null)
  }

  onPointerMove(_e: FederatedPointerEvent, world: WorldPoint): void {
    if (!this.drawing || !this.drawingRect) return
    const ts = this.state.tileSize
    const endX = Math.floor(world.x / ts) * ts + ts
    const endY = Math.floor(world.y / ts) * ts + ts

    const x = Math.min(this.drawStartX, endX)
    const y = Math.min(this.drawStartY, endY)
    const w = Math.abs(endX - this.drawStartX)
    const h = Math.abs(endY - this.drawStartY)

    this.drawingRect.clear()
    this.drawingRect.rect(x, y, w, h)
      .fill({ color: 0x4a9af5, alpha: 0.2 })
      .stroke({ color: 0x4a9af5, alpha: 0.8, width: 2 })
  }

  onPointerUp(_e: FederatedPointerEvent, world: WorldPoint): void {
    if (!this.drawing) return
    this.drawing = false
    this.drawingRect?.clear()

    const ts = this.state.tileSize
    const endX = Math.floor(world.x / ts) * ts + ts
    const endY = Math.floor(world.y / ts) * ts + ts

    const px = Math.min(this.drawStartX, endX)
    const py = Math.min(this.drawStartY, endY)
    const pw = Math.abs(endX - this.drawStartX)
    const ph = Math.abs(endY - this.drawStartY)

    // 最小尺寸 1 tile
    if (pw < ts || ph < ts) return

    const newZone: ZoneData = {
      id: `zone_${Date.now()}_${zoneIdCounter++}`,
      name: `新区域`,
      type: 'hallway',
      x: px / ts,
      y: py / ts,
      width: pw / ts,
      height: ph / ts,
      properties: {},
    }

    this.state.zones.push(newZone)
    this.state['emit']({ type: 'zone-changed' })
    this.callbacks.onZoneCreated(newZone)
    this.redrawZones()
  }

  private hitTestZone(world: WorldPoint): ZoneData | null {
    const ts = this.state.tileSize
    // 反向遍历（后添加的优先）
    for (let i = this.state.zones.length - 1; i >= 0; i--) {
      const z = this.state.zones[i]
      const zx = z.x * ts
      const zy = z.y * ts
      const zw = z.width * ts
      const zh = z.height * ts
      if (world.x >= zx && world.x <= zx + zw && world.y >= zy && world.y <= zy + zh) {
        return z
      }
    }
    return null
  }

  private redrawZones(): void {
    if (!this.zoneOverlay || !this.labelContainer) return

    this.zoneOverlay.clear()
    this.labelContainer.removeChildren()

    const ts = this.state.tileSize
    for (const zone of this.state.zones) {
      const px = zone.x * ts
      const py = zone.y * ts
      const pw = zone.width * ts
      const ph = zone.height * ts
      const color = ZONE_COLORS[zone.type] ?? 0x888888

      this.zoneOverlay.rect(px, py, pw, ph)
        .fill({ color, alpha: 0.2 })
        .stroke({ color, alpha: 0.6, width: 1 })

      const label = new Text({
        text: `${zone.name} [${zone.type}]`,
        style: new TextStyle({
          fontSize: 7,
          fill: 0xffffff,
          stroke: { color: 0x000000, width: 2 },
          fontFamily: 'monospace',
        }),
      })
      label.anchor.set(0.5, 0)
      label.x = px + pw / 2
      label.y = py + 2
      this.labelContainer.addChild(label)
    }
  }
}
