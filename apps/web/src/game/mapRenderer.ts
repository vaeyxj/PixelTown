/**
 * 地图渲染器 - 绘制地板、家具、墙壁、装饰
 * 不再管理摄像机和交互，只负责往 worldContainer 里添加图层
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { MAP_ZONES, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, type MapZone } from './mapData'
import {
  drawDeskPair,
  drawMeetingRoom,
  drawPlant,
  drawLargePlant,
  drawWaterCooler,
  drawCoffeeMachine,
  drawToiletStall,
  drawSink,
  drawCorridorFloor,
  drawWoodFloor,
  drawCarpetFloor,
} from './pixelSprites'

function fillWorkstationZone(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE

  drawWoodFloor(g, px + 2, py + 2, pw - 4, ph - 4)

  const gapX = 26
  const gapY = 52
  const padX = 10
  const padY = 8
  const cols = Math.floor((pw - padX * 2) / gapX)
  const rows = Math.floor((ph - padY * 2) / gapY)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = px + padX + col * gapX
      const dy = py + padY + row * gapY
      if (dy + 48 < py + ph - 4) {
        drawDeskPair(g, dx, dy)
      }
    }
  }
}

function fillRestroomZone(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE

  const tileSize = 8
  for (let x = 0; x < pw; x += tileSize) {
    for (let y = 0; y < ph; y += tileSize) {
      const isLight = ((x + y) / tileSize) % 2 === 0
      g.rect(px + x, py + y, tileSize, tileSize).fill(isLight ? 0xc8dae8 : 0xb8cad8)
    }
  }
  const stallCount = Math.max(1, Math.floor(pw / 20))
  for (let i = 0; i < stallCount; i++) {
    drawToiletStall(g, px + 4 + i * 18, py + 4)
  }
  if (ph > 40) {
    const sinkCount = Math.max(1, Math.floor(pw / 20))
    for (let i = 0; i < sinkCount; i++) {
      drawSink(g, px + 4 + i * 18, py + ph - 20)
    }
  }
}

function fillStorageZone(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE
  g.rect(px, py, pw, ph).fill(0xc0b8a8)

  for (let y = 6; y < ph - 10; y += 14) {
    for (let x = 6; x < pw - 10; x += 26) {
      const sx = px + x
      const sy = py + y
      g.rect(sx, sy, 20, 8).fill(0x8a7a6a)
      g.rect(sx, sy, 20, 2).fill(0x9a8a7a)
      g.rect(sx + 2, sy - 4, 6, 4).fill(0xc4a468)
      g.rect(sx + 10, sy - 6, 8, 6).fill(0xb49458)
    }
  }
}

function fillExitZone(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE
  drawCorridorFloor(g, px, py, pw, ph)

  const cx = px + pw / 2
  const cy = py + ph / 2
  g.rect(cx - 16, cy - 6, 32, 12).fill(0x2a8a3a)
  g.rect(cx - 16, cy - 6, 32, 12).stroke({ color: 0x1a6a2a, width: 1 })
  g.moveTo(cx - 10, cy).lineTo(cx - 4, cy - 4).lineTo(cx - 4, cy - 1)
    .lineTo(cx + 8, cy - 1).lineTo(cx + 8, cy + 1).lineTo(cx - 4, cy + 1)
    .lineTo(cx - 4, cy + 4).closePath().fill(0xffffff)
}

function fillServiceZone(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE
  drawCarpetFloor(g, px, py, pw, ph)
  g.rect(px + 8, py + ph / 2 - 6, pw - 20, 12).fill(0xb8a890)
  g.rect(px + 8, py + ph / 2 - 6, pw - 20, 3).fill(0xc8b8a0)
}

function drawCorridors(g: Graphics): void {
  const T = TILE_SIZE
  const cw = 3 * T
  drawCorridorFloor(g, 1 * T, 11 * T, 90 * T, cw)
  drawCorridorFloor(g, 1 * T, 30 * T, 90 * T, cw)
  drawCorridorFloor(g, 1 * T, 52 * T, 90 * T, cw)
  drawCorridorFloor(g, 7 * T, 1 * T, cw, 54 * T)
  drawCorridorFloor(g, 21 * T, 1 * T, cw, 54 * T)
  drawCorridorFloor(g, 37 * T, 1 * T, cw, 54 * T)
  drawCorridorFloor(g, 57 * T, 1 * T, cw, 54 * T)
  drawCorridorFloor(g, 60 * T, 1 * T, cw, 54 * T)
}

function drawWalls(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE

  if (zone.type === 'meeting_room' || zone.type === 'restroom' || zone.type === 'storage' || zone.type === 'service') {
    g.rect(px, py, pw, 4).fill(0x9a8a7a)
    g.rect(px, py, 3, ph).fill(0xb8a890)
    g.rect(px + pw - 3, py, 3, ph).fill(0xb8a890)
    g.rect(px, py + ph - 3, pw, 3).fill(0xa89880)
    // 门
    g.rect(px + pw / 2 - 8, py + ph - 4, 16, 4).fill(0xa09080)
    g.rect(px + pw / 2 - 8, py + ph - 4, 16, 1).fill(0x7a6a5a)
    g.rect(px + pw / 2 + 4, py + ph - 3, 2, 2).fill(0xd4a840)
  }
}

function placeDecorations(g: Graphics): void {
  const T = TILE_SIZE
  const plants = [
    [8, 12], [18, 12], [19, 30], [8, 30], [8, 42],
    [37, 12], [45, 12], [60, 12], [37, 30], [58, 30],
    [70, 28], [85, 28], [22, 50], [58, 50], [88, 36],
  ]
  for (const [tx, ty] of plants) {
    if (tx % 3 === 0) drawLargePlant(g, tx * T, ty * T)
    else drawPlant(g, tx * T, ty * T)
  }

  const coolers = [[7, 20], [40, 12], [60, 28], [28, 50]]
  for (const [tx, ty] of coolers) drawWaterCooler(g, tx * T, ty * T)

  const coffees = [[15, 12], [55, 12], [20, 42]]
  for (const [tx, ty] of coffees) drawCoffeeMachine(g, tx * T, ty * T)
}

/** 在 worldContainer 中创建所有地图图层，返回 destroy 函数 */
export function createOfficeMap(
  app: Application,
  worldContainer: Container,
): { destroy: () => void } {
  const mw = MAP_WIDTH * TILE_SIZE
  const mh = MAP_HEIGHT * TILE_SIZE

  // 1. 背景
  const floor = new Graphics()
  floor.rect(0, 0, mw, mh).fill(0xd8d0c0)
  worldContainer.addChild(floor)

  // 2. 走廊
  const corridors = new Graphics()
  drawCorridors(corridors)
  worldContainer.addChild(corridors)

  // 3. 区域
  const zones = new Graphics()
  for (const zone of MAP_ZONES) {
    const px = zone.x * TILE_SIZE
    const py = zone.y * TILE_SIZE
    const pw = zone.width * TILE_SIZE
    const ph = zone.height * TILE_SIZE

    switch (zone.type) {
      case 'workstation':
      case 'shared_desk':
        fillWorkstationZone(zones, zone)
        break
      case 'meeting_room':
        drawMeetingRoom(zones, px + 3, py + 5, pw - 6, ph - 8)
        break
      case 'restroom':
        fillRestroomZone(zones, zone)
        break
      case 'storage':
        fillStorageZone(zones, zone)
        break
      case 'exit':
        fillExitZone(zones, zone)
        break
      case 'service':
        fillServiceZone(zones, zone)
        break
    }
  }
  worldContainer.addChild(zones)

  // 4. 墙壁
  const walls = new Graphics()
  for (const zone of MAP_ZONES) drawWalls(walls, zone)
  walls.rect(0, 0, 4, mh).fill(0xb8a890)
  walls.rect(mw - 4, 0, 4, mh).fill(0xb8a890)
  walls.rect(0, 0, mw, 6).fill(0x9a8a7a)
  walls.rect(0, mh - 4, mw, 4).fill(0xa89880)
  worldContainer.addChild(walls)

  // 5. 装饰
  const decos = new Graphics()
  placeDecorations(decos)
  worldContainer.addChild(decos)

  // 6. 标签
  const labels = new Container()
  for (const zone of MAP_ZONES) {
    const px = zone.x * TILE_SIZE
    const py = zone.y * TILE_SIZE
    const pw = zone.width * TILE_SIZE
    const displayName = zone.label ?? zone.name
    const fontSize = zone.type === 'meeting_room' ? 7 : 8

    const label = new Text({
      text: displayName,
      style: new TextStyle({
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
        wordWrap: true,
        wordWrapWidth: pw - 8,
        lineHeight: fontSize + 3,
      }),
    })
    label.anchor.set(0.5, 0)
    label.x = px + pw / 2
    label.y = py + 5
    labels.addChild(label)
  }
  worldContainer.addChild(labels)

  // 7. 显示器动画
  const animLayer = new Graphics()
  worldContainer.addChild(animLayer)

  interface Light { x: number; y: number; phase: number }
  const lights: Light[] = []
  for (const zone of MAP_ZONES) {
    if (zone.type !== 'workstation' && zone.type !== 'shared_desk') continue
    const zpx = zone.x * TILE_SIZE
    const zpy = zone.y * TILE_SIZE
    const pw = zone.width * TILE_SIZE
    const ph = zone.height * TILE_SIZE
    const cols = Math.floor((pw - 20) / 26)
    const rows = Math.floor((ph - 16) / 52)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = zpx + 10 + c * 26
        const dy = zpy + 8 + r * 52
        if (dy + 48 < zpy + ph - 4) {
          lights.push({ x: dx + 7, y: dy + 2, phase: Math.random() * Math.PI * 2 })
          lights.push({ x: dx + 7, y: dy + 33, phase: Math.random() * Math.PI * 2 })
        }
      }
    }
  }

  let t = 0
  const anim = () => {
    t += 0.03
    animLayer.clear()
    for (const l of lights) {
      const b = 0.4 + 0.6 * Math.abs(Math.sin(t + l.phase))
      const r = Math.floor(0x4a * b)
      const gb = Math.floor(0xba * b)
      animLayer.rect(l.x, l.y, 7, 5).fill({ color: (r << 16) | (gb << 8) | gb, alpha: 0.8 })
    }
  }
  app.ticker.add(anim)

  return {
    destroy() {
      app.ticker.remove(anim)
      worldContainer.removeChildren()
    },
  }
}
