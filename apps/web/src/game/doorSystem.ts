/**
 * 会议室门系统 — 开关门动画
 * - 每个会议室/健身房底部中央有一扇门
 * - NPC 进入房间时门自动打开，1.5s 后自动关闭
 * - 门有开/关/过渡三种状态
 */
import { Container, Graphics } from 'pixi.js'
import type { MapZone } from './editor/types'
import type { CharacterState } from './simulation'

interface DoorState {
  zone: MapZone
  /** 0 = 关闭, 1 = 完全打开 */
  openAmount: number
  /** 目标状态 */
  targetOpen: number
  /** 上次有人通过的时间 (performance.now) */
  lastTraffic: number
  graphic: Graphics
}

export interface DoorSystem {
  update(dt: number, characters: readonly CharacterState[]): void
  destroy(): void
}

const DOOR_TYPES = new Set(['meeting_room', 'gym'])
const DOOR_SPEED = 3     // 每秒开关速度
const AUTO_CLOSE_DELAY = 1.5  // 秒

export function createDoorSystem(worldContainer: Container, zones: readonly MapZone[], tileSize: number): DoorSystem {
  const container = new Container()
  container.label = 'doors'
  worldContainer.addChild(container)

  const doors: DoorState[] = []

  for (const zone of zones) {
    if (!DOOR_TYPES.has(zone.type)) continue

    const graphic = new Graphics()
    container.addChild(graphic)

    doors.push({
      zone,
      openAmount: 0,
      targetOpen: 0,
      lastTraffic: 0,
      graphic,
    })
  }

  function isNearDoor(ch: CharacterState, zone: MapZone): boolean {
    const doorX = (zone.x + zone.width / 2) * tileSize
    const doorY = (zone.y + zone.height) * tileSize
    const dx = Math.abs(ch.x - doorX)
    const dy = Math.abs(ch.y - doorY)
    return dx < 20 && dy < 20
  }

  let now = performance.now()

  return {
    update(dt, characters) {
      now = performance.now()

      for (const door of doors) {
        const { zone, graphic } = door
        const px = zone.x * tileSize
        const py = zone.y * tileSize
        const pw = zone.width * tileSize
        const ph = zone.height * tileSize

        // 检测是否有人在门口附近
        const hasTraffic = characters.some(c => c.x > 0 && isNearDoor(c, zone))
        if (hasTraffic) {
          door.lastTraffic = now
          door.targetOpen = 1
        } else if (now - door.lastTraffic > AUTO_CLOSE_DELAY * 1000) {
          door.targetOpen = 0
        }

        // 平滑过渡
        if (door.openAmount < door.targetOpen) {
          door.openAmount = Math.min(door.targetOpen, door.openAmount + DOOR_SPEED * dt)
        } else if (door.openAmount > door.targetOpen) {
          door.openAmount = Math.max(door.targetOpen, door.openAmount - DOOR_SPEED * dt)
        }

        // 绘制门
        graphic.clear()
        const doorCenterX = px + pw / 2
        const doorY = py + ph - 4
        const halfDoorW = 8  // 半扇门宽
        const openOffset = door.openAmount * halfDoorW

        // 门框
        graphic.rect(doorCenterX - halfDoorW - 2, doorY - 1, halfDoorW * 2 + 4, 6)
          .fill(0x7a6a5a)

        // 左扇门（向左滑开）
        const leftDoorX = doorCenterX - halfDoorW - openOffset
        const leftDoorW = halfDoorW - (door.openAmount > 0.9 ? 1 : 0)
        graphic.rect(leftDoorX, doorY, leftDoorW, 4).fill(0xa09080)

        // 右扇门（向右滑开）
        const rightDoorX = doorCenterX + openOffset
        graphic.rect(rightDoorX, doorY, leftDoorW, 4).fill(0xa09080)

        // 门把手（关闭时显示）
        if (door.openAmount < 0.3) {
          graphic.rect(doorCenterX - 2, doorY + 1, 1, 2).fill(0xd4a840)
          graphic.rect(doorCenterX + 1, doorY + 1, 1, 2).fill(0xd4a840)
        }
      }
    },

    destroy() {
      container.destroy({ children: true })
    },
  }
}
