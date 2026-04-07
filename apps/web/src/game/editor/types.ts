/**
 * 场景编辑器数据类型定义
 * 定义地图的完整数据结构，用于序列化/反序列化和运行时渲染
 */

// ====== 瓦片集 ======

export interface TilesetDef {
  readonly id: string
  readonly name: string
  /** 图片路径（相对于 public/） */
  readonly imagePath: string
  readonly tileWidth: number
  readonly tileHeight: number
  readonly columns: number
  readonly tileCount: number
}

// ====== 图层 ======

export interface TileLayer {
  readonly type: 'tile'
  readonly name: string
  readonly visible: boolean
  readonly opacity: number
  /**
   * 瓦片数据数组，长度 = width * height
   * 编码：高 16 位 = tileset 在 tilesets 数组中的索引 + 1，低 16 位 = tile 索引
   * 0 = 空瓦片
   */
  readonly data: readonly number[]
}

export interface ObjectLayer {
  readonly type: 'object'
  readonly name: string
  readonly visible: boolean
  readonly objects: readonly SceneObject[]
}

export interface CollisionLayer {
  readonly type: 'collision'
  readonly name: string
  readonly visible: boolean
  /** 0 = 不可行走, 1 = 可行走 */
  readonly data: readonly number[]
}

export type Layer = TileLayer | ObjectLayer | CollisionLayer

// ====== 场景对象 ======

export interface AnimationDef {
  readonly frames: readonly AnimationFrame[]
  readonly loop: boolean
}

export interface AnimationFrame {
  readonly tileIndex: number
  /** 帧持续时间（毫秒） */
  readonly duration: number
}

export interface SceneObject {
  readonly id: string
  readonly name: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  /** 旋转角度（度） */
  readonly rotation: number
  readonly scaleX: number
  readonly scaleY: number
  readonly tilesetId?: string
  readonly tileIndex?: number
  readonly animation?: AnimationDef
  readonly properties: Readonly<Record<string, string | number | boolean>>
}

// ====== 区域 ======

export type ZoneType =
  | 'workstation'
  | 'meeting_room'
  | 'restroom'
  | 'storage'
  | 'exit'
  | 'hallway'
  | 'service'
  | 'shared_desk'
  | 'gym'

export interface ZoneData {
  readonly id: string
  readonly name: string
  readonly type: ZoneType
  /** 瓦片坐标 */
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly properties: Readonly<Record<string, string | number | boolean>>
}

// ====== 场景数据（顶层） ======

export interface SceneData {
  /** 地图宽度（瓦片数） */
  readonly width: number
  /** 地图高度（瓦片数） */
  readonly height: number
  /** 瓦片尺寸（像素） */
  readonly tileSize: number
  readonly tilesets: readonly TilesetDef[]
  /** 图层列表（渲染顺序：从底到顶） */
  readonly layers: readonly Layer[]
  /** 区域定义 */
  readonly zones: readonly ZoneData[]
}

// ====== 运行时类型（兼容现有系统） ======

/** 兼容现有 MapZone 接口 */
export interface MapZone {
  readonly id: string
  readonly name: string
  readonly type: ZoneType
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly color: number
  readonly borderColor: number
  readonly label?: string
  readonly seats?: number
  readonly group?: string
}

/** 碰撞网格 — 与现有 CollisionGrid 类型一致 */
export type CollisionGrid = Uint8Array

// ====== 瓦片编码工具 ======

/** 编码瓦片值：tilesetIndex (1-based) + tileIndex */
export function encodeTile(tilesetIndex: number, tileIndex: number): number {
  return ((tilesetIndex + 1) << 16) | tileIndex
}

/** 解码瓦片值，返回 [tilesetIndex (0-based), tileIndex]，空瓦片返回 null */
export function decodeTile(value: number): [number, number] | null {
  if (value === 0) return null
  const tilesetIdx = (value >>> 16) - 1
  const tileIdx = value & 0xffff
  return [tilesetIdx, tileIdx]
}
