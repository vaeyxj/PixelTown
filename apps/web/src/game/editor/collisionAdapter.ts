/**
 * 碰撞适配器 — 从 SceneData 的 CollisionLayer 生成运行时碰撞网格
 */
import type { SceneData, CollisionGrid } from './types'

/** 从场景数据提取碰撞网格 */
export function extractCollisionGrid(scene: SceneData): CollisionGrid {
  const grid = new Uint8Array(scene.width * scene.height)

  // 查找碰撞图层
  const collisionLayer = scene.layers.find((l) => l.type === 'collision')
  if (!collisionLayer || collisionLayer.type !== 'collision') {
    // 无碰撞层时默认全部可行走
    grid.fill(1)
    return grid
  }

  // 填充碰撞数据
  const len = Math.min(collisionLayer.data.length, grid.length)
  for (let i = 0; i < len; i++) {
    grid[i] = collisionLayer.data[i] === 1 ? 1 : 0
  }

  return grid
}

/** 检查像素坐标是否可行走 */
export function isWalkable(grid: CollisionGrid, tileSize: number, width: number, height: number, px: number, py: number): boolean {
  const tx = Math.floor(px / tileSize)
  const ty = Math.floor(py / tileSize)
  if (tx < 0 || tx >= width || ty < 0 || ty >= height) return false
  return grid[ty * width + tx] === 1
}

/** 尝试移动，返回实际可到达的位置（带滑墙） */
export function tryMove(
  grid: CollisionGrid,
  tileSize: number,
  width: number,
  height: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number } {
  if (isWalkable(grid, tileSize, width, height, toX, toY)) {
    return { x: toX, y: toY }
  }
  if (isWalkable(grid, tileSize, width, height, toX, fromY)) {
    return { x: toX, y: fromY }
  }
  if (isWalkable(grid, tileSize, width, height, fromX, toY)) {
    return { x: fromX, y: toY }
  }
  return { x: fromX, y: fromY }
}
