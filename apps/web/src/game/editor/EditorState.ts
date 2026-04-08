/**
 * 编辑器状态管理 — 可变场景数据 + 变更通知
 * 所有编辑操作都通过此模块修改数据，并通知视口刷新渲染
 */
import type {
  SceneData,
  TilesetDef,
  TileLayer,
  ZoneData,
} from './types'
import { encodeTile } from './types'

/** 变更事件类型 */
export type EditorEvent =
  | { type: 'layer-changed'; layerIndex: number }
  | { type: 'layer-list-changed' }
  | { type: 'tileset-changed' }
  | { type: 'zone-changed' }
  | { type: 'grid-changed' }
  | { type: 'scene-replaced' }

export type EditorListener = (event: EditorEvent) => void

/** 可变瓦片图层（编辑用） */
interface MutableTileLayer {
  type: 'tile'
  name: string
  visible: boolean
  opacity: number
  data: number[]
}

export class EditorState {
  width: number
  height: number
  tileSize: number
  tilesets: TilesetDef[]
  layers: MutableTileLayer[]
  /** 碰撞网格：0 = 可行走，1 = 不可通过 */
  collisionGrid: number[]
  /** 对象网格：0 = 无，1 = 可交互对象 */
  objectGrid: number[]
  zones: ZoneData[]

  /** 当前选中图层索引 */
  activeLayerIndex = 0
  /** 批量编辑模式（拖拽绘制中），结束后再 push 历史 */
  private _batchEditing = false

  get batchEditing(): boolean { return this._batchEditing }
  set batchEditing(value: boolean) {
    const wasBatching = this._batchEditing
    this._batchEditing = value
    if (wasBatching && !value) {
      this.emit({ type: 'layer-changed', layerIndex: this.activeLayerIndex })
    }
  }

  /** 当前选中瓦片区域（tilesetId + 起始列行 + 区域尺寸） */
  selectedRegion: {
    tilesetId: string
    col: number
    row: number
    cols: number
    rows: number
  } | null = null

  private listeners: Set<EditorListener> = new Set()

  constructor(data: SceneData) {
    this.width = data.width
    this.height = data.height
    this.tileSize = data.tileSize
    this.tilesets = [...data.tilesets]
    this.layers = data.layers.map(l => this.cloneLayer(l))
    this.collisionGrid = [...data.collisionGrid]
    this.objectGrid = [...data.objectGrid]
    this.zones = [...data.zones]
  }

  /** 就地替换场景数据（保留对象引用、监听器、selectedRegion） */
  loadSceneData(data: SceneData): void {
    this.width = data.width
    this.height = data.height
    this.tileSize = data.tileSize
    this.tilesets = [...data.tilesets]
    this.layers = data.layers.map(l => this.cloneLayer(l))
    this.collisionGrid = [...data.collisionGrid]
    this.objectGrid = [...data.objectGrid]
    this.zones = [...data.zones]
    if (this.activeLayerIndex >= this.layers.length) {
      this.activeLayerIndex = Math.max(0, this.layers.length - 1)
    }
    this.emit({ type: 'scene-replaced' })
  }

  // ====== 监听 ======

  on(listener: EditorListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: EditorEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  // ====== 图层操作 ======

  get activeLayer(): MutableTileLayer | undefined {
    return this.layers[this.activeLayerIndex]
  }

  setActiveLayer(index: number): void {
    if (index >= 0 && index < this.layers.length) {
      this.activeLayerIndex = index
    }
  }

  addTileLayer(name: string): void {
    const data = new Array<number>(this.width * this.height).fill(0)
    this.layers.push({ type: 'tile', name, visible: true, opacity: 1, data })
    this.emit({ type: 'layer-list-changed' })
  }

  removeLayer(index: number): void {
    if (index < 0 || index >= this.layers.length) return
    this.layers.splice(index, 1)
    if (this.activeLayerIndex >= this.layers.length) {
      this.activeLayerIndex = Math.max(0, this.layers.length - 1)
    }
    this.emit({ type: 'layer-list-changed' })
  }

  toggleLayerVisibility(index: number): void {
    const layer = this.layers[index]
    if (!layer) return
    layer.visible = !layer.visible
    this.emit({ type: 'layer-changed', layerIndex: index })
  }

  setLayerOpacity(index: number, opacity: number): void {
    const layer = this.layers[index]
    if (!layer) return
    layer.opacity = Math.max(0, Math.min(1, opacity))
    this.emit({ type: 'layer-changed', layerIndex: index })
  }

  // ====== 瓦片操作 ======

  /** 在当前活跃 TileLayer 上绘制瓦片（支持多瓦片区域） */
  paintTile(tileX: number, tileY: number): void {
    const layer = this.activeLayer
    if (!layer) return
    if (!this.selectedRegion) return

    const { tilesetId, col: rc, row: rr, cols: rcols, rows: rrows } = this.selectedRegion
    const tsIdx = this.tilesets.findIndex(t => t.id === tilesetId)
    if (tsIdx < 0) return
    const tsDef = this.tilesets[tsIdx]

    let changed = false
    for (let dy = 0; dy < rrows; dy++) {
      for (let dx = 0; dx < rcols; dx++) {
        const tx = tileX + dx
        const ty = tileY + dy
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) continue
        const tileIndex = (rr + dy) * tsDef.columns + (rc + dx)
        layer.data[ty * this.width + tx] = encodeTile(tsIdx, tileIndex)
        changed = true
      }
    }
    if (changed) this.emit({ type: 'layer-changed', layerIndex: this.activeLayerIndex })
  }

  /** 批量绘制瓦片（矩形/直线等，只触发一次事件，每个坐标放置完整区域） */
  paintTiles(coords: ReadonlyArray<{ x: number; y: number }>): void {
    const layer = this.activeLayer
    if (!layer) return
    if (!this.selectedRegion) return

    const { tilesetId, col: rc, row: rr, cols: rcols, rows: rrows } = this.selectedRegion
    const tsIdx = this.tilesets.findIndex(t => t.id === tilesetId)
    if (tsIdx < 0) return
    const tsDef = this.tilesets[tsIdx]

    let changed = false
    for (const { x, y } of coords) {
      for (let dy = 0; dy < rrows; dy++) {
        for (let dx = 0; dx < rcols; dx++) {
          const tx = x + dx
          const ty = y + dy
          if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) continue
          const tileIndex = (rr + dy) * tsDef.columns + (rc + dx)
          layer.data[ty * this.width + tx] = encodeTile(tsIdx, tileIndex)
          changed = true
        }
      }
    }
    if (changed) this.emit({ type: 'layer-changed', layerIndex: this.activeLayerIndex })
  }

  /** 擦除瓦片 */
  eraseTile(tileX: number, tileY: number): void {
    const layer = this.activeLayer
    if (!layer) return

    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return
    const idx = tileY * this.width + tileX
    layer.data[idx] = 0
    this.emit({ type: 'layer-changed', layerIndex: this.activeLayerIndex })
  }

  /** 油漆桶填充（使用区域左上角瓦片） */
  fillTiles(startX: number, startY: number): void {
    const layer = this.activeLayer
    if (!layer) return
    if (!this.selectedRegion) return

    const { tilesetId, col: rc, row: rr } = this.selectedRegion
    const tsIdx = this.tilesets.findIndex(t => t.id === tilesetId)
    if (tsIdx < 0) return
    const tsDef = this.tilesets[tsIdx]

    if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height) return

    const tileIndex = rr * tsDef.columns + rc
    const fillValue = encodeTile(tsIdx, tileIndex)
    const startIdx = startY * this.width + startX
    const targetValue = layer.data[startIdx]
    if (targetValue === fillValue) return

    // BFS 填充
    const visited = new Uint8Array(this.width * this.height)
    const queue: number[] = [startIdx]
    visited[startIdx] = 1

    while (queue.length > 0) {
      const idx = queue.pop()!
      const x = idx % this.width
      const y = Math.floor(idx / this.width)
      layer.data[idx] = fillValue

      const neighbors = [
        y > 0 ? idx - this.width : -1,
        y < this.height - 1 ? idx + this.width : -1,
        x > 0 ? idx - 1 : -1,
        x < this.width - 1 ? idx + 1 : -1,
      ]

      for (const n of neighbors) {
        if (n >= 0 && !visited[n] && layer.data[n] === targetValue) {
          visited[n] = 1
          queue.push(n)
        }
      }
    }

    this.emit({ type: 'layer-changed', layerIndex: this.activeLayerIndex })
  }

  // ====== 碰撞网格操作 ======

  /** 设置碰撞标记（blocked = true 表示不可通过） */
  setCollision(tileX: number, tileY: number, blocked: boolean): void {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return
    const idx = tileY * this.width + tileX
    this.collisionGrid[idx] = blocked ? 1 : 0
    this.emit({ type: 'grid-changed' })
  }

  // ====== 对象网格操作 ======

  /** 切换对象标记 */
  toggleObject(tileX: number, tileY: number): void {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return
    const idx = tileY * this.width + tileX
    this.objectGrid[idx] = this.objectGrid[idx] === 1 ? 0 : 1
    this.emit({ type: 'grid-changed' })
  }

  /** 设置对象标记 */
  setObject(tileX: number, tileY: number, hasObject: boolean): void {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return
    const idx = tileY * this.width + tileX
    this.objectGrid[idx] = hasObject ? 1 : 0
    this.emit({ type: 'grid-changed' })
  }

  // ====== 区域操作 ======

  /** 删除区域 */
  removeZone(id: string): void {
    const idx = this.zones.findIndex(z => z.id === id)
    if (idx >= 0) {
      this.zones.splice(idx, 1)
      this.emit({ type: 'zone-changed' })
    }
  }

  /** 更新区域属性 */
  updateZone(id: string, changes: Partial<ZoneData>): void {
    const idx = this.zones.findIndex(z => z.id === id)
    if (idx >= 0) {
      this.zones[idx] = { ...this.zones[idx], ...changes }
      this.emit({ type: 'zone-changed' })
    }
  }

  /** 根据 ID 获取最新区域 */
  getZone(id: string): ZoneData | undefined {
    return this.zones.find(z => z.id === id)
  }

  // ====== 瓦片集操作 ======

  /** 添加瓦片集 */
  addTileset(tileset: TilesetDef): void {
    this.tilesets.push(tileset)
    this.emit({ type: 'tileset-changed' })
  }

  // ====== 序列化 ======

  /** 导出为不可变 SceneData */
  toSceneData(): SceneData {
    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      tilesets: [...this.tilesets],
      layers: this.layers.map(l => this.freezeLayer(l)),
      collisionGrid: [...this.collisionGrid],
      objectGrid: [...this.objectGrid],
      zones: [...this.zones],
    }
  }

  // ====== 私有方法 ======

  private cloneLayer(layer: TileLayer): MutableTileLayer {
    return { type: 'tile', name: layer.name, visible: layer.visible, opacity: layer.opacity, data: [...layer.data] }
  }

  private freezeLayer(layer: MutableTileLayer): TileLayer {
    return { type: 'tile', name: layer.name, visible: layer.visible, opacity: layer.opacity, data: [...layer.data] }
  }
}
