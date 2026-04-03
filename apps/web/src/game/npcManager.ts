/**
 * NPC 生命周期管理器
 * 创建、更新、销毁 NPC 精灵
 */
import { Container, Sprite, Text, TextStyle } from 'pixi.js'
import {
  generateCharacterFrames,
  generateAppearance,
  CHAR_H,
  type CharacterFrames,
} from './characterSprite'
import {
  updateCharacters,
  STATUS_EMOJI,
  type CharacterState,
  type EmployeeStatus,
} from './simulation'
import type { Application } from 'pixi.js'

export interface CharEntry {
  sprite: Sprite
  nameTag: Text
  emojiTag: Text
  charFrames: CharacterFrames
  state: CharacterState
  sitTimer: number
}

export interface NpcManager {
  readonly entries: readonly CharEntry[]
  update(dt: number, hour: number, minute: number, emojiAnimTime: number): void
  destroy(): void
}

const WORKING_STATUSES: ReadonlySet<EmployeeStatus> = new Set(['working'])

export function createNpcManager(
  app: Application,
  characterLayer: Container,
  emojiLayer: Container,
  nameTagLayer: Container,
  characters: CharacterState[],
  onCharacterClick: (char: CharacterState) => void,
): NpcManager {
  const entries: CharEntry[] = characters.map(ch => {
    const appearance = generateAppearance(ch.employee.id)
    const charFrames = generateCharacterFrames(app, appearance)

    const sprite = new Sprite({
      texture: charFrames.frames.down[0],
      anchor: { x: 0.5, y: 1 },
    })
    sprite.x = ch.x
    sprite.y = ch.y
    sprite.scale.set(2)
    sprite.eventMode = 'static'
    sprite.cursor = 'pointer'
    sprite.on('pointerdown', (e) => { e.stopPropagation(); onCharacterClick(ch) })
    characterLayer.addChild(sprite)

    const nameTag = new Text({
      text: ch.employee.name,
      style: new TextStyle({
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: 6,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    nameTag.anchor.set(0.5, 1)
    nameTagLayer.addChild(nameTag)

    const emojiTag = new Text({
      text: '💻',
      style: new TextStyle({ fontSize: 8 }),
    })
    emojiTag.anchor.set(0.5, 1)
    emojiLayer.addChild(emojiTag)

    return { sprite, nameTag, emojiTag, charFrames, state: ch, sitTimer: 0 }
  })

  return {
    entries,

    update(dt, hour, minute, emojiAnimTime) {
      updateCharacters(characters, dt, hour, minute)

      for (const entry of entries) {
        const { sprite, nameTag, emojiTag, charFrames, state } = entry
        if (state.x < -100) {
          sprite.visible = false
          nameTag.visible = false
          emojiTag.visible = false
          continue
        }
        sprite.visible = true
        nameTag.visible = true
        emojiTag.visible = true

        sprite.x = state.x
        sprite.y = state.y
        sprite.zIndex = Math.floor(state.y)

        // 动画状态选择
        const isAtDesk = WORKING_STATUSES.has(state.status) && state.animFrame === 0
        if (isAtDesk && charFrames.sit.length > 0) {
          entry.sitTimer += dt
          const sitFrame = Math.floor(entry.sitTimer * 2) % 2
          sprite.texture = charFrames.sit[sitFrame]
        } else {
          sprite.texture = charFrames.frames[state.direction][state.animFrame]
        }

        nameTag.x = state.x
        nameTag.y = state.y - CHAR_H * 2 - 2

        emojiTag.text = STATUS_EMOJI[state.status]
        emojiTag.x = state.x
        emojiTag.y = state.y - CHAR_H * 2 - 12 + Math.sin(emojiAnimTime * 2 + state.employee.id) * 2
      }
    },

    destroy() {
      for (const entry of entries) {
        entry.sprite.destroy()
        entry.nameTag.destroy()
        entry.emojiTag.destroy()
      }
    },
  }
}
