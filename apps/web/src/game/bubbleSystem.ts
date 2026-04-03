/**
 * 对话气泡系统
 * 随机在在场角色头上弹出对话框
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { CharacterState } from './simulation'
import { getRandomChat } from './simulation'
import { CHAR_H } from './characterSprite'

interface ChatBubble {
  x: number
  y: number
  life: number
  readonly maxLife: number
  readonly textObj: Text
  readonly bgObj: Graphics
}

export interface CharEntryLike {
  readonly state: CharacterState
}

export interface BubbleSystem {
  update(dt: number, entries: readonly CharEntryLike[]): void
  destroy(): void
}

export function createBubbleSystem(bubbleLayer: Container): BubbleSystem {
  const chatBubbles: ChatBubble[] = []
  let nextChatTimer = 2

  function spawnBubble(entries: readonly CharEntryLike[]): void {
    const onsite = entries.filter(e => e.state.x > 0 && e.state.status === 'working')
    if (onsite.length === 0) return
    const entry = onsite[Math.floor(Math.random() * onsite.length)]
    const msg = getRandomChat()

    const textObj = new Text({
      text: msg,
      style: new TextStyle({
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: 6,
        fill: 0x2a2a2a,
        wordWrap: true,
        wordWrapWidth: 80,
      }),
    })
    textObj.anchor.set(0, 1)

    const bgObj = new Graphics()
    const pad = 4
    const bw = textObj.width + pad * 2
    const bh = textObj.height + pad * 2
    bgObj.roundRect(-pad, -bh, bw + pad, bh + pad, 4).fill({ color: 0xffffff, alpha: 0.92 })
    bgObj.roundRect(-pad, -bh, bw + pad, bh + pad, 4).stroke({ color: 0xd0d0d0, width: 0.5 })
    bgObj.moveTo(6, 0).lineTo(10, 4).lineTo(14, 0).fill({ color: 0xffffff, alpha: 0.92 })

    bubbleLayer.addChild(bgObj)
    bubbleLayer.addChild(textObj)

    chatBubbles.push({
      x: entry.state.x,
      y: entry.state.y,
      life: 4,
      maxLife: 4,
      textObj,
      bgObj,
    })
  }

  return {
    update(dt, entries) {
      nextChatTimer -= dt
      if (nextChatTimer <= 0) {
        spawnBubble(entries)
        nextChatTimer = 3 + Math.random() * 5
      }

      for (let i = chatBubbles.length - 1; i >= 0; i--) {
        const b = chatBubbles[i]
        b.life -= dt
        const alpha = Math.min(1, b.life / 0.5)
        b.textObj.x = b.x - 5
        b.textObj.y = b.y - CHAR_H * 2 - 20
        b.textObj.alpha = alpha
        b.bgObj.x = b.x - 5
        b.bgObj.y = b.y - CHAR_H * 2 - 20
        b.bgObj.alpha = alpha

        if (b.life <= 0) {
          bubbleLayer.removeChild(b.textObj)
          bubbleLayer.removeChild(b.bgObj)
          b.textObj.destroy()
          b.bgObj.destroy()
          chatBubbles.splice(i, 1)
        }
      }
    },

    destroy() {
      for (const b of chatBubbles) {
        b.textObj.destroy()
        b.bgObj.destroy()
      }
      chatBubbles.length = 0
    },
  }
}
