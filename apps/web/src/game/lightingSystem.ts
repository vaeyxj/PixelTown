/**
 * 区域灯光系统 — 逐房间灯光开关
 * - 夜间（darkness > 0.05）时，有人的房间自动亮灯
 * - 点击房间可手动切换灯光
 * - 灯光渲染为暖色矩形叠加在暗色遮罩之上
 */
import { Container, Graphics } from 'pixi.js'
import type { MapZone } from './editor/types'
import { getDarknessLevel, type CharacterState } from './simulation'

interface RoomLight {
  zone: MapZone
  lit: boolean
  manualOverride: boolean  // 用户手动切换过
  graphic: Graphics
  iconGraphic: Graphics    // 灯泡图标
}

export interface LightingSystem {
  update(hour: number, minute: number, characters: readonly CharacterState[]): void
  toggleLight(zoneId: string): void
  destroy(): void
}

const LIGHTABLE_TYPES = new Set(['meeting_room', 'gym', 'service', 'restroom', 'storage'])

function isInZone(ch: CharacterState, zone: MapZone, tileSize: number): boolean {
  const zx = zone.x * tileSize
  const zy = zone.y * tileSize
  const zw = zone.width * tileSize
  const zh = zone.height * tileSize
  return ch.x >= zx && ch.x < zx + zw && ch.y >= zy && ch.y < zy + zh
}

export function createLightingSystem(
  worldContainer: Container,
  zones: readonly MapZone[],
  tileSize: number,
): LightingSystem {
  const container = new Container()
  container.label = 'lighting'
  worldContainer.addChild(container)

  const roomLights: Map<string, RoomLight> = new Map()

  for (const zone of zones) {
    if (!LIGHTABLE_TYPES.has(zone.type)) continue

    // 灯光矩形
    const graphic = new Graphics()
    container.addChild(graphic)

    // 灯泡图标（右上角）
    const iconGraphic = new Graphics()
    iconGraphic.x = (zone.x + zone.width) * tileSize - 12
    iconGraphic.y = zone.y * tileSize + 4
    iconGraphic.eventMode = 'static'
    iconGraphic.cursor = 'pointer'
    iconGraphic.hitArea = { contains: (x: number, y: number) => x >= -4 && x <= 12 && y >= -4 && y <= 12 }
    iconGraphic.on('pointerdown', (e) => {
      e.stopPropagation()
      toggleLight(zone.id)
    })
    container.addChild(iconGraphic)

    roomLights.set(zone.id, {
      zone,
      lit: false,
      manualOverride: false,
      graphic,
      iconGraphic,
    })
  }

  function toggleLight(zoneId: string): void {
    const light = roomLights.get(zoneId)
    if (!light) return
    light.manualOverride = true
    light.lit = !light.lit
  }

  function drawLightIcon(g: Graphics, lit: boolean, darkness: number): void {
    g.clear()
    if (darkness < 0.03) return  // 白天不显示灯泡图标
    // 灯泡底座
    g.rect(2, 6, 4, 2).fill(0x8a8a8a)
    // 灯泡
    g.circle(4, 4, 3).fill(lit ? 0xffee44 : 0x4a4a4a)
    if (lit) {
      // 发光效果
      g.circle(4, 4, 5).fill({ color: 0xffee44, alpha: 0.2 })
    }
  }

  return {
    update(hour, minute, characters) {
      const darkness = getDarknessLevel(hour, minute)

      for (const [, light] of roomLights) {
        const { zone, graphic, iconGraphic } = light

        // 自动灯光：有人且天黑时自动开灯（除非手动关闭）
        if (!light.manualOverride) {
          const hasOccupants = characters.some(c => c.x > 0 && isInZone(c, zone, tileSize))
          light.lit = hasOccupants && darkness > 0.05
        }

        graphic.clear()
        if (light.lit && darkness > 0) {
          const px = zone.x * tileSize
          const py = zone.y * tileSize
          const pw = zone.width * tileSize
          const ph = zone.height * tileSize

          // 暖色灯光效果 — 抵消暗色遮罩
          graphic.rect(px + 2, py + 2, pw - 4, ph - 4)
            .fill({ color: 0xffeecc, alpha: Math.min(0.4, darkness * 1.5) })

          // 中心光斑（更亮）
          const cx = px + pw / 2
          const cy = py + ph / 2
          const rw = pw * 0.4
          const rh = ph * 0.4
          graphic.rect(cx - rw / 2, cy - rh / 2, rw, rh)
            .fill({ color: 0xffffff, alpha: Math.min(0.15, darkness * 0.5) })
        }

        drawLightIcon(iconGraphic, light.lit, darkness)
      }
    },

    toggleLight,

    destroy() {
      container.destroy({ children: true })
    },
  }
}
