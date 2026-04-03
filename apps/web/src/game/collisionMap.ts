/**
 * 碰撞地图 — tile 级别的可行走网格
 * 走廊、走道可行走；房间、工位区域不可穿越
 * 门口位置标记为可行走（进出通道）
 */
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, MAP_ZONES } from './mapData'

/** 0 = 不可行走, 1 = 可行走 */
export type CollisionGrid = Uint8Array

/** 生成碰撞网格 (MAP_WIDTH × MAP_HEIGHT) */
export function createCollisionGrid(): CollisionGrid {
  const grid = new Uint8Array(MAP_WIDTH * MAP_HEIGHT)

  // 默认：全部不可行走
  // 先标记走廊为可行走
  markCorridors(grid)

  // 标记出口区域可行走
  const exitZone = MAP_ZONES.find(z => z.id === 'exit_c')
  if (exitZone) {
    fillRect(grid, exitZone.x, exitZone.y, exitZone.width, exitZone.height, 1)
  }

  // 标记每个封闭房间的门口为可行走（底部中央 2 tile 宽）
  for (const zone of MAP_ZONES) {
    if (
      zone.type === 'meeting_room' ||
      zone.type === 'restroom' ||
      zone.type === 'storage' ||
      zone.type === 'service' ||
      zone.type === 'gym'
    ) {
      const doorX = Math.floor(zone.x + zone.width / 2) - 1
      const doorY = Math.floor(zone.y + zone.height)
      // 门口 2 tile 宽，向外延伸 1 tile
      fillRect(grid, doorX, doorY, 2, 1, 1)
      // 门口内侧也标记
      fillRect(grid, doorX, doorY - 1, 2, 1, 1)
    }
  }

  return grid
}

function markCorridors(grid: CollisionGrid): void {
  // 水平走廊 (y=11..13, y=30..32, y=52..54)，x=1..90
  fillRect(grid, 1, 11, 90, 3, 1)
  fillRect(grid, 1, 30, 90, 3, 1)
  fillRect(grid, 1, 52, 90, 3, 1)

  // 垂直走廊，y=1..54
  fillRect(grid, 7, 1, 3, 54, 1)
  fillRect(grid, 21, 1, 3, 54, 1)
  fillRect(grid, 37, 1, 3, 54, 1)
  fillRect(grid, 57, 1, 3, 54, 1)
  fillRect(grid, 60, 1, 3, 54, 1)

  // 工位区域内的走道（工位之间的通道）
  // 每个 workstation zone 的左右两侧紧邻走廊，不额外标记
  // 但 workstation 内部的过道需要标记
  for (const zone of MAP_ZONES) {
    if (zone.type === 'workstation' || zone.type === 'shared_desk') {
      // 工位区域的顶部和底部各 1 tile 走道
      fillRect(grid, zone.x, zone.y, zone.width, 1, 1)
      fillRect(grid, zone.x, zone.y + zone.height - 1, zone.width, 1, 1)
      // 每隔 ~3 tile 高度留一条水平走道
      for (let dy = 3; dy < zone.height - 1; dy += 3) {
        fillRect(grid, zone.x, zone.y + dy, zone.width, 1, 1)
      }
    }
  }
}

function fillRect(grid: CollisionGrid, x: number, y: number, w: number, h: number, value: number): void {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(MAP_WIDTH, Math.floor(x + w))
  const y1 = Math.min(MAP_HEIGHT, Math.floor(y + h))
  for (let ty = y0; ty < y1; ty++) {
    for (let tx = x0; tx < x1; tx++) {
      grid[ty * MAP_WIDTH + tx] = value
    }
  }
}

/** 检查像素坐标是否可行走 */
export function isWalkable(grid: CollisionGrid, px: number, py: number): boolean {
  const tx = Math.floor(px / TILE_SIZE)
  const ty = Math.floor(py / TILE_SIZE)
  if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false
  return grid[ty * MAP_WIDTH + tx] === 1
}

/** 尝试移动，返回实际可到达的位置 */
export function tryMove(
  grid: CollisionGrid,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number } {
  // 先尝试完整移动
  if (isWalkable(grid, toX, toY)) {
    return { x: toX, y: toY }
  }
  // 尝试只移动 X 轴（滑墙）
  if (isWalkable(grid, toX, fromY)) {
    return { x: toX, y: fromY }
  }
  // 尝试只移动 Y 轴
  if (isWalkable(grid, fromX, toY)) {
    return { x: fromX, y: toY }
  }
  // 都不行，原地不动
  return { x: fromX, y: fromY }
}
