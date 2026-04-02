import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from 'pixi.js'
import { MAP_ZONES, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, type MapZone } from './mapData'

const FLOOR_COLOR = 0xe8e0d0
const WALL_COLOR = 0x8a7a6a
const GRID_COLOR = 0xd8d0c0

/** Draw a pixel-art desk pattern inside a workstation zone */
function drawDeskPattern(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE

  const deskW = 10
  const deskH = 6
  const gapX = 14
  const gapY = 12
  const padding = 8

  const cols = Math.floor((pw - padding * 2) / gapX)
  const rows = Math.floor((ph - padding * 2) / gapY)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = px + padding + col * gapX
      const dy = py + padding + row * gapY
      // Desk surface
      g.rect(dx, dy, deskW, deskH)
      g.fill({ color: 0xdad0c0 })
      g.stroke({ color: 0xb0a090, width: 1 })
      // Chair (small dot)
      g.circle(dx + deskW / 2, dy + deskH + 2, 2)
      g.fill({ color: 0x5a5a5a })
    }
  }
}

/** Draw a pixel-art meeting table inside a meeting room */
function drawMeetingTable(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE

  const tableW = Math.min(pw - 16, 40)
  const tableH = Math.min(ph - 12, 20)
  const tx = px + (pw - tableW) / 2
  const ty = py + (ph - tableH) / 2

  // Table
  g.roundRect(tx, ty, tableW, tableH, 3)
  g.fill({ color: 0x6a5a4a })
  g.stroke({ color: 0x4a3a2a, width: 1 })

  // Chairs around table
  const chairSize = 3
  const chairGap = 10
  // Top and bottom chairs
  const topChairs = Math.max(1, Math.floor(tableW / chairGap))
  for (let i = 0; i < topChairs; i++) {
    const cx = tx + 4 + i * chairGap
    g.circle(cx, ty - 4, chairSize)
    g.fill({ color: 0x4a6a8a })
    g.circle(cx, ty + tableH + 4, chairSize)
    g.fill({ color: 0x4a6a8a })
  }
}

/** Draw restroom icon */
function drawRestroomIcon(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE
  const cx = px + pw / 2
  const cy = py + ph / 2

  // Tile pattern
  const tileGap = 8
  for (let tx = px + 2; tx < px + pw - 2; tx += tileGap) {
    for (let ty = py + 2; ty < py + ph - 2; ty += tileGap) {
      g.rect(tx, ty, tileGap - 1, tileGap - 1)
      g.fill({ color: 0x9ac4e0 })
    }
  }

  // Simple person icon
  g.circle(cx - 8, cy - 8, 4)
  g.fill({ color: 0x2a4a6a })
  g.rect(cx - 12, cy - 3, 8, 12)
  g.fill({ color: 0x2a4a6a })

  g.circle(cx + 8, cy - 8, 4)
  g.fill({ color: 0x8a2a4a })
  g.rect(cx + 4, cy - 3, 8, 12)
  g.fill({ color: 0x8a2a4a })
  // Skirt triangle for female icon
  g.moveTo(cx + 4, cy + 2)
  g.lineTo(cx + 12, cy + 9)
  g.lineTo(cx + 4, cy + 9)
  g.closePath()
  g.fill({ color: 0x8a2a4a })
}

/** Draw exit arrow */
function drawExitArrow(g: Graphics, zone: MapZone): void {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE
  const cx = px + pw / 2
  const cy = py + ph / 2

  // Arrow pointing left
  g.moveTo(cx - 12, cy)
  g.lineTo(cx - 2, cy - 6)
  g.lineTo(cx - 2, cy - 2)
  g.lineTo(cx + 12, cy - 2)
  g.lineTo(cx + 12, cy + 2)
  g.lineTo(cx - 2, cy + 2)
  g.lineTo(cx - 2, cy + 6)
  g.closePath()
  g.fill({ color: 0xffffff })
}

export function createOfficeMap(app: Application): {
  container: Container
  destroy: () => void
} {
  const worldContainer = new Container()
  worldContainer.label = 'world'

  // -- Floor background --
  const floor = new Graphics()
  floor.rect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
  floor.fill({ color: FLOOR_COLOR })
  worldContainer.addChild(floor)

  // -- Grid lines (subtle) --
  const grid = new Graphics()
  for (let x = 0; x <= MAP_WIDTH; x++) {
    grid.moveTo(x * TILE_SIZE, 0)
    grid.lineTo(x * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
  }
  for (let y = 0; y <= MAP_HEIGHT; y++) {
    grid.moveTo(0, y * TILE_SIZE)
    grid.lineTo(MAP_WIDTH * TILE_SIZE, y * TILE_SIZE)
  }
  grid.stroke({ color: GRID_COLOR, width: 0.5, alpha: 0.3 })
  worldContainer.addChild(grid)

  // -- Outer walls --
  const walls = new Graphics()
  walls.rect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
  walls.stroke({ color: WALL_COLOR, width: 4 })
  worldContainer.addChild(walls)

  // -- Zones --
  const zoneGraphics = new Graphics()
  const labelContainer = new Container()
  labelContainer.label = 'labels'

  const tooltipText = new Text({
    text: '',
    style: new TextStyle({
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      fontSize: 11,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
    }),
  })
  tooltipText.visible = false
  tooltipText.zIndex = 1000

  for (const zone of MAP_ZONES) {
    const px = zone.x * TILE_SIZE
    const py = zone.y * TILE_SIZE
    const pw = zone.width * TILE_SIZE
    const ph = zone.height * TILE_SIZE

    // Zone fill
    zoneGraphics.rect(px, py, pw, ph)
    zoneGraphics.fill({ color: zone.color })
    zoneGraphics.stroke({ color: zone.borderColor, width: 2 })

    // Draw interior details based on type
    if (zone.type === 'workstation' || zone.type === 'shared_desk') {
      drawDeskPattern(zoneGraphics, zone)
    } else if (zone.type === 'meeting_room') {
      drawMeetingTable(zoneGraphics, zone)
    } else if (zone.type === 'restroom') {
      drawRestroomIcon(zoneGraphics, zone)
    } else if (zone.type === 'exit') {
      drawExitArrow(zoneGraphics, zone)
    }

    // Zone label
    const displayName = zone.label ?? zone.name
    const fontSize = zone.type === 'meeting_room' ? 9 : 10
    const label = new Text({
      text: displayName,
      style: new TextStyle({
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
        align: 'center',
        wordWrap: true,
        wordWrapWidth: pw - 4,
      }),
    })
    label.anchor.set(0.5, 0.5)
    label.x = px + pw / 2
    label.y = py + ph / 2
    labelContainer.addChild(label)
  }

  worldContainer.addChild(zoneGraphics)
  worldContainer.addChild(labelContainer)

  // -- Title --
  const title = new Text({
    text: 'D区 共417个有效工位',
    style: new TextStyle({
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x2a2a2a,
      stroke: { color: 0xffffff, width: 3 },
    }),
  })
  title.x = 12
  title.y = 4
  worldContainer.addChild(title)

  // -- Interaction state --
  let dragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragContainerStartX = 0
  let dragContainerStartY = 0

  // -- Tooltip on hover --
  worldContainer.addChild(tooltipText)
  worldContainer.eventMode = 'static'
  worldContainer.hitArea = {
    contains: () => true,
  }

  worldContainer.on('pointermove', (e: FederatedPointerEvent) => {
    if (dragging) {
      tooltipText.visible = false
      return
    }

    const pos = e.getLocalPosition(worldContainer)
    const tileX = pos.x / TILE_SIZE
    const tileY = pos.y / TILE_SIZE

    const hoveredZone = MAP_ZONES.find(
      (z) => tileX >= z.x && tileX <= z.x + z.width && tileY >= z.y && tileY <= z.y + z.height,
    )

    if (hoveredZone) {
      const lines = [hoveredZone.name]
      if (hoveredZone.seats) lines.push(`工位: ${hoveredZone.seats}`)
      if (hoveredZone.group) lines.push(`区域: ${hoveredZone.group}`)
      tooltipText.text = lines.join('\n')
      tooltipText.x = pos.x + 12
      tooltipText.y = pos.y - 10
      tooltipText.visible = true
    } else {
      tooltipText.visible = false
    }
  })

  // -- Zoom and Pan --
  let scale = 1
  const MIN_SCALE = 0.3
  const MAX_SCALE = 3

  // Center the map initially
  const centerMap = () => {
    const screenW = app.screen.width
    const screenH = app.screen.height
    const mapW = MAP_WIDTH * TILE_SIZE
    const mapH = MAP_HEIGHT * TILE_SIZE

    scale = Math.min(screenW / mapW, screenH / mapH) * 0.9
    worldContainer.scale.set(scale)
    worldContainer.x = (screenW - mapW * scale) / 2
    worldContainer.y = (screenH - mapH * scale) / 2
  }

  centerMap()

  // Wheel zoom
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const direction = e.deltaY < 0 ? 1 : -1
    const factor = 1 + direction * 0.1

    const rect = app.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const worldX = (mouseX - worldContainer.x) / scale
    const worldY = (mouseY - worldContainer.y) / scale

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor))
    worldContainer.scale.set(newScale)
    worldContainer.x = mouseX - worldX * newScale
    worldContainer.y = mouseY - worldY * newScale
    scale = newScale
  }

  app.canvas.addEventListener('wheel', onWheel, { passive: false })

  // Drag pan
  worldContainer.on('pointerdown', (e: FederatedPointerEvent) => {
    dragging = true
    dragStartX = e.globalX
    dragStartY = e.globalY
    dragContainerStartX = worldContainer.x
    dragContainerStartY = worldContainer.y
  })

  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  app.stage.on('pointermove', (e: FederatedPointerEvent) => {
    if (!dragging) return
    worldContainer.x = dragContainerStartX + (e.globalX - dragStartX)
    worldContainer.y = dragContainerStartY + (e.globalY - dragStartY)
  })
  app.stage.on('pointerup', () => { dragging = false })
  app.stage.on('pointerupoutside', () => { dragging = false })

  app.stage.addChild(worldContainer)

  const destroy = () => {
    app.canvas.removeEventListener('wheel', onWheel)
    worldContainer.removeAllListeners()
    app.stage.removeChild(worldContainer)
    worldContainer.destroy({ children: true })
  }

  return { container: worldContainer, destroy }
}
