/**
 * 游戏主引擎
 * - 摄像机跟随 + 键盘控制
 * - 角色动画 + emoji 状态气泡
 * - 随机对话气泡
 * - 昼夜灯光遮罩
 */
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from 'pixi.js'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from './mapData'
import { createOfficeMap } from './mapRenderer'
import {
  generateCharacterFrames,
  generateAppearance,
  CHAR_H,
  type CharacterFrames,
} from './characterSprite'
import {
  generateEmployees,
  initCharacterStates,
  updateCharacters,
  getStatusCounts,
  getEntrancePosition,
  SimClock,
  getDaylightOverlay,
  STATUS_EMOJI,
  getRandomChat,
  type CharacterState,
  type EmployeeStatus,
} from './simulation'

export interface GameCallbacks {
  onStatsUpdate: (stats: Record<EmployeeStatus, number>, timeStr: string, onlineCount: number) => void
  onMiniMapUpdate: (chars: readonly CharacterState[], cameraRect: { x: number; y: number; w: number; h: number }) => void
  onCharacterClick: (char: CharacterState) => void
  onReady: () => void
}

export interface GameEngine {
  destroy: () => void
  startEntryAnimation: () => void
}

const PLAYER_SPEED = 100
const TARGET_SCALE = 3 // 更大的缩放，看得更清楚

// ====== 对话气泡系统 ======
interface ChatBubble {
  text: string
  x: number
  y: number
  life: number    // 剩余秒数
  maxLife: number
  textObj: Text
  bgObj: Graphics
}

export function createGameEngine(app: Application, callbacks: GameCallbacks): GameEngine {
  const worldW = MAP_WIDTH * TILE_SIZE
  const worldH = MAP_HEIGHT * TILE_SIZE

  const worldContainer = new Container()
  worldContainer.label = 'world'
  app.stage.addChild(worldContainer)

  // 地图
  const { destroy: destroyMap } = createOfficeMap(app, worldContainer)

  // 角色层
  const characterLayer = new Container()
  characterLayer.label = 'characters'
  characterLayer.sortableChildren = true
  worldContainer.addChild(characterLayer)

  // emoji 层（角色头顶）
  const emojiLayer = new Container()
  emojiLayer.label = 'emoji'
  worldContainer.addChild(emojiLayer)

  // 对话气泡层
  const bubbleLayer = new Container()
  bubbleLayer.label = 'bubbles'
  worldContainer.addChild(bubbleLayer)

  // 名牌层
  const nameTagLayer = new Container()
  nameTagLayer.label = 'nameTags'
  worldContainer.addChild(nameTagLayer)

  // 昼夜灯光遮罩（覆盖整个世界，最上层）
  const daylightOverlay = new Graphics()
  daylightOverlay.rect(0, 0, worldW, worldH).fill({ color: 0x000000, alpha: 0 })
  worldContainer.addChild(daylightOverlay)

  // ====== 员工 ======
  const employees = generateEmployees(60)
  const clock = new SimClock(10, 30, 30) // 30x: 2秒真实 = 1分钟游戏，从10:30开始（所有人已到岗）
  const { hour, minute } = clock.getTime()
  const characters = initCharacterStates(employees, hour, minute)

  interface CharEntry {
    sprite: Sprite
    nameTag: Text
    emojiTag: Text
    charFrames: CharacterFrames
    state: CharacterState
  }

  const charEntries: CharEntry[] = []

  for (const ch of characters) {
    const appearance = generateAppearance(ch.employee.id)
    const charFrames = generateCharacterFrames(app, appearance)

    const sprite = new Sprite({
      texture: charFrames.frames.down[0],
      anchor: { x: 0.5, y: 1 },
    })
    sprite.x = ch.x
    sprite.y = ch.y
    sprite.scale.set(1.5)
    sprite.eventMode = 'static'
    sprite.cursor = 'pointer'
    const charState = ch
    sprite.on('pointerdown', (e) => { e.stopPropagation(); callbacks.onCharacterClick(charState) })
    characterLayer.addChild(sprite)

    // 名牌
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

    // emoji 状态图标
    const emojiTag = new Text({
      text: '💻',
      style: new TextStyle({ fontSize: 8 }),
    })
    emojiTag.anchor.set(0.5, 1)
    emojiLayer.addChild(emojiTag)

    charEntries.push({ sprite, nameTag, emojiTag, charFrames, state: ch })
  }

  // ====== 玩家角色 ======
  const playerFrames = generateCharacterFrames(app, { ...generateAppearance(9999), shirtColor: 0xe84040 })
  const entrance = getEntrancePosition()

  const playerState: CharacterState = {
    x: entrance.x, y: entrance.y,
    targetX: entrance.x, targetY: entrance.y,
    direction: 'down', status: 'idle',
    animFrame: 0, animTimer: 0,
    employee: {
      id: -1, name: '我', department: '', deskZoneId: '',
      deskOffsetX: entrance.x, deskOffsetY: entrance.y,
      arriveOffset: 0, lunchOffset: 0, dinnerOffset: 0, leaveOffset: 0,
      hasOvertimeToday: false, meetingSlots: [],
    },
    path: [],
  }

  const playerSprite = new Sprite({
    texture: playerFrames.frames.down[0],
    anchor: { x: 0.5, y: 1 },
  })
  playerSprite.x = entrance.x
  playerSprite.y = entrance.y
  playerSprite.scale.set(1.5)
  playerSprite.zIndex = 9999
  characterLayer.addChild(playerSprite)

  // 玩家名牌 + 指示箭头
  const playerNameTag = new Text({
    text: '▼ 我',
    style: new TextStyle({
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: 8,
      fill: 0xffdd44,
      stroke: { color: 0x000000, width: 3 },
      fontWeight: 'bold',
    }),
  })
  playerNameTag.anchor.set(0.5, 1)
  nameTagLayer.addChild(playerNameTag)

  // ====== 对话气泡 ======
  const chatBubbles: ChatBubble[] = []
  let nextChatTimer = 2 // 2秒后第一个气泡

  function spawnChatBubble(): void {
    // 随机选一个在场的角色
    const onsite = charEntries.filter(e => e.state.x > 0 && e.state.status === 'working')
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
    // 小三角
    bgObj.moveTo(6, 0).lineTo(10, 4).lineTo(14, 0).fill({ color: 0xffffff, alpha: 0.92 })

    bubbleLayer.addChild(bgObj)
    bubbleLayer.addChild(textObj)

    chatBubbles.push({
      text: msg,
      x: entry.state.x,
      y: entry.state.y,
      life: 4,
      maxLife: 4,
      textObj,
      bgObj,
    })
  }

  // ====== 键盘 ======
  const keys: Record<string, boolean> = {}
  const onKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true }
  const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // ====== 摄像机 ======
  let cameraX = entrance.x
  let cameraY = entrance.y
  let currentScale = TARGET_SCALE

  function updateCamera(): void {
    cameraX += (playerState.x - cameraX) * 0.08
    cameraY += (playerState.y - cameraY) * 0.08
    const sw = app.screen.width
    const sh = app.screen.height
    worldContainer.x = sw / 2 - cameraX * currentScale
    worldContainer.y = sh / 2 - cameraY * currentScale
    worldContainer.x = Math.min(0, Math.max(sw - worldW * currentScale, worldContainer.x))
    worldContainer.y = Math.min(0, Math.max(sh - worldH * currentScale, worldContainer.y))
  }

  // ====== 入场动画 ======
  let entryAnimating = false
  let entryProgress = 0

  function startEntryAnimation(): void {
    entryAnimating = true
    entryProgress = 0
    const fitScale = Math.min(app.screen.width / worldW, app.screen.height / worldH) * 0.95
    currentScale = fitScale
    worldContainer.scale.set(fitScale)
  }

  function updateEntryAnimation(dt: number): boolean {
    if (!entryAnimating) return false
    entryProgress += dt * 0.3
    if (entryProgress >= 1) {
      entryAnimating = false
      currentScale = TARGET_SCALE
      worldContainer.scale.set(currentScale)
      updateCamera()
      callbacks.onReady()
      return false
    }

    // Smooth ease
    const t = entryProgress < 0.5
      ? 4 * entryProgress * entryProgress * entryProgress
      : 1 - Math.pow(-2 * entryProgress + 2, 3) / 2

    const fitScale = Math.min(app.screen.width / worldW, app.screen.height / worldH) * 0.95
    currentScale = fitScale + (TARGET_SCALE - fitScale) * t
    worldContainer.scale.set(currentScale)

    const cx = worldW / 2 + (playerState.x - worldW / 2) * t
    const cy = worldH / 2 + (playerState.y - worldH / 2) * t
    worldContainer.x = app.screen.width / 2 - cx * currentScale
    worldContainer.y = app.screen.height / 2 - cy * currentScale
    return true
  }

  // ====== 主循环 ======
  let lastTime = performance.now()
  let emojiAnimTime = 0

  const gameLoop = () => {
    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now

    if (updateEntryAnimation(dt)) return

    const { hour: h, minute: m, timeStr } = clock.getTime()
    emojiAnimTime += dt

    // ---- 玩家移动 ----
    let pdx = 0, pdy = 0
    if (keys['w'] || keys['arrowup']) pdy = -1
    if (keys['s'] || keys['arrowdown']) pdy = 1
    if (keys['a'] || keys['arrowleft']) pdx = -1
    if (keys['d'] || keys['arrowright']) pdx = 1

    if (pdx !== 0 || pdy !== 0) {
      const len = Math.sqrt(pdx * pdx + pdy * pdy)
      pdx /= len; pdy /= len
      playerState.x = Math.max(8, Math.min(worldW - 8, playerState.x + pdx * PLAYER_SPEED * dt))
      playerState.y = Math.max(8, Math.min(worldH - 8, playerState.y + pdy * PLAYER_SPEED * dt))
      playerState.direction = Math.abs(pdx) > Math.abs(pdy) ? (pdx > 0 ? 'right' : 'left') : (pdy > 0 ? 'down' : 'up')
      playerState.animTimer += dt
      if (playerState.animTimer > 0.12) { playerState.animTimer = 0; playerState.animFrame = (playerState.animFrame + 1) % 4 }
    } else {
      playerState.animFrame = 0; playerState.animTimer = 0
    }

    playerSprite.x = playerState.x
    playerSprite.y = playerState.y
    playerSprite.texture = playerFrames.frames[playerState.direction][playerState.animFrame]
    playerSprite.zIndex = Math.floor(playerState.y)
    playerNameTag.x = playerState.x
    playerNameTag.y = playerState.y - CHAR_H * 1.5 - 8

    // ---- NPC 更新 ----
    updateCharacters(characters, dt, h, m)

    for (const entry of charEntries) {
      const { sprite, nameTag, emojiTag, charFrames, state } = entry
      if (state.x < -100) {
        sprite.visible = false; nameTag.visible = false; emojiTag.visible = false
        continue
      }
      sprite.visible = true; nameTag.visible = true; emojiTag.visible = true
      sprite.x = state.x; sprite.y = state.y
      sprite.zIndex = Math.floor(state.y)
      sprite.texture = charFrames.frames[state.direction][state.animFrame]
      nameTag.x = state.x; nameTag.y = state.y - CHAR_H * 1.5 - 2
      // emoji 浮动效果
      const emoji = STATUS_EMOJI[state.status]
      emojiTag.text = emoji
      emojiTag.x = state.x
      emojiTag.y = state.y - CHAR_H * 1.5 - 12 + Math.sin(emojiAnimTime * 2 + state.employee.id) * 2
    }

    // ---- 对话气泡 ----
    nextChatTimer -= dt
    if (nextChatTimer <= 0) {
      spawnChatBubble()
      nextChatTimer = 3 + Math.random() * 5 // 3~8秒一个
    }

    for (let i = chatBubbles.length - 1; i >= 0; i--) {
      const b = chatBubbles[i]
      b.life -= dt
      const alpha = Math.min(1, b.life / 0.5) // 淡出
      b.textObj.x = b.x - 5
      b.textObj.y = b.y - CHAR_H * 1.5 - 20
      b.textObj.alpha = alpha
      b.bgObj.x = b.x - 5
      b.bgObj.y = b.y - CHAR_H * 1.5 - 20
      b.bgObj.alpha = alpha

      if (b.life <= 0) {
        bubbleLayer.removeChild(b.textObj)
        bubbleLayer.removeChild(b.bgObj)
        b.textObj.destroy()
        b.bgObj.destroy()
        chatBubbles.splice(i, 1)
      }
    }

    // ---- 昼夜灯光 ----
    const daylight = getDaylightOverlay(h, m)
    daylightOverlay.clear()
    if (daylight.alpha > 0) {
      daylightOverlay.rect(0, 0, worldW, worldH).fill({ color: daylight.color, alpha: daylight.alpha })
    }

    // ---- 摄像机 ----
    updateCamera()

    // ---- 回调 ----
    const stats = getStatusCounts(characters)
    const onlineCount = characters.filter(c => c.x > 0).length
    callbacks.onStatsUpdate(stats, timeStr, onlineCount)

    const s = currentScale
    callbacks.onMiniMapUpdate(characters, {
      x: -worldContainer.x / s,
      y: -worldContainer.y / s,
      w: app.screen.width / s,
      h: app.screen.height / s,
    })
  }

  app.ticker.add(gameLoop)

  // 鼠标滚轮缩放
  const onWheel = (e: WheelEvent) => {
    if (entryAnimating) return
    e.preventDefault()
    const dir = e.deltaY < 0 ? 1 : -1
    currentScale = Math.max(1.5, Math.min(5, currentScale * (1 + dir * 0.12)))
    worldContainer.scale.set(currentScale)
    updateCamera()
  }
  app.canvas.addEventListener('wheel', onWheel, { passive: false })

  return {
    destroy() {
      app.ticker.remove(gameLoop)
      app.canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      destroyMap()
      worldContainer.destroy({ children: true })
    },
    startEntryAnimation,
  }
}
