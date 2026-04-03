/**
 * 游戏主引擎 — 组装并启动各子系统
 */
import { Application, Container, Sprite, Text, TextStyle } from 'pixi.js'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from './mapData'
import { createOfficeMap } from './mapRenderer'
import { generateCharacterFrames, generateAppearance, CHAR_H } from './characterSprite'
import {
  generateEmployees,
  initCharacterStates,
  getEntrancePosition,
  SimClock,
  type CharacterState,
  type EmployeeStatus,
} from './simulation'
import { createCamera } from './camera'
import { createPlayerController } from './playerController'
import { createNpcManager } from './npcManager'
import { createBubbleSystem } from './bubbleSystem'
import { createParticleSystem } from './particleSystem'
import { applyParallax, createBackgroundLayer, createForegroundLayer } from './parallax'
import { createDayNightSystem } from './dayNightSystem'

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

export function createGameEngine(app: Application, callbacks: GameCallbacks): GameEngine {
  const worldW = MAP_WIDTH * TILE_SIZE
  const worldH = MAP_HEIGHT * TILE_SIZE

  const bgLayer = createBackgroundLayer(app)
  app.stage.addChild(bgLayer)

  const worldContainer = new Container()
  worldContainer.label = 'world'
  app.stage.addChild(worldContainer)

  const fgLayer = createForegroundLayer(worldW, worldH)
  app.stage.addChild(fgLayer)

  const { destroy: destroyMap } = createOfficeMap(app, worldContainer)

  const characterLayer = new Container()
  characterLayer.label = 'characters'
  characterLayer.sortableChildren = true
  worldContainer.addChild(characterLayer)

  const emojiLayer = new Container()
  worldContainer.addChild(emojiLayer)
  const bubbleLayer = new Container()
  worldContainer.addChild(bubbleLayer)
  const nameTagLayer = new Container()
  worldContainer.addChild(nameTagLayer)
  const particleLayer = new Container()
  worldContainer.addChild(particleLayer)

  const employees = generateEmployees(60)
  const clock = new SimClock(10, 30, 30)
  const { hour, minute } = clock.getTime()
  const characters = initCharacterStates(employees, hour, minute)

  const particleSystem = createParticleSystem(particleLayer)
  const dayNightSystem = createDayNightSystem(worldContainer, worldW, worldH, particleSystem)
  const npcManager = createNpcManager(app, characterLayer, emojiLayer, nameTagLayer, characters, callbacks.onCharacterClick, particleSystem)

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
  const playerSprite = new Sprite({ texture: playerFrames.frames.down[0], anchor: { x: 0.5, y: 1 } })
  playerSprite.x = entrance.x; playerSprite.y = entrance.y
  playerSprite.scale.set(2); playerSprite.zIndex = 9999
  characterLayer.addChild(playerSprite)

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

  const parallaxLayers = [{ container: bgLayer, scrollFactor: 0.3 }, { container: fgLayer, scrollFactor: 1.05 }]
  const bubbleSystem = createBubbleSystem(bubbleLayer)
  const playerController = createPlayerController()
  const camera = createCamera(app, worldContainer, worldW, worldH, entrance.x, entrance.y)
  camera.onAnimationEnd = callbacks.onReady

  const removeWheel = camera.addWheelZoom(app.canvas as HTMLCanvasElement)

  let lastTime = performance.now()
  let emojiAnimTime = 0
  let lastPlayerX = entrance.x

  const gameLoop = () => {
    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now

    if (camera.updateEntryAnimation(dt)) return

    const { hour: h, minute: m, timeStr } = clock.getTime()
    emojiAnimTime += dt

    // 玩家移动
    const { dx, dy } = playerController.getInput()
    if (dx !== 0 || dy !== 0) {
      playerState.x = Math.max(8, Math.min(worldW - 8, playerState.x + dx * PLAYER_SPEED * dt))
      playerState.y = Math.max(8, Math.min(worldH - 8, playerState.y + dy * PLAYER_SPEED * dt))
      playerState.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
      playerState.animTimer += dt
      if (playerState.animTimer > 0.12) { playerState.animTimer = 0; playerState.animFrame = (playerState.animFrame + 1) % 4 }

      if (Math.abs(playerState.x - lastPlayerX) > 2) {
        particleSystem.emitWalkDust(playerState.x, playerState.y)
      }
    } else {
      playerState.animFrame = 0; playerState.animTimer = 0
    }
    lastPlayerX = playerState.x

    playerSprite.x = playerState.x
    playerSprite.y = playerState.y
    playerSprite.texture = playerFrames.frames[playerState.direction][playerState.animFrame]
    playerSprite.zIndex = Math.floor(playerState.y)
    playerNameTag.x = playerState.x
    playerNameTag.y = playerState.y - CHAR_H * 2 - 8

    npcManager.update(dt, h, m, emojiAnimTime, bubbleSystem.talkingIds)
    bubbleSystem.update(dt, npcManager.entries)
    particleSystem.update(dt)
    dayNightSystem.update(h, m, dt, worldContainer.x, worldContainer.y, camera.scale, app.screen.width, app.screen.height)

    camera.update(playerState.x, playerState.y)
    applyParallax(parallaxLayers, worldContainer.x, worldContainer.y, app.screen.width, app.screen.height)

    const s = camera.scale
    const statuses = ['working', 'meeting', 'lunch', 'dinner', 'walking', 'idle', 'away'] as const
    const stats = Object.fromEntries(statuses.map(k => [k, characters.filter(c => c.status === k).length])) as Record<EmployeeStatus, number>
    callbacks.onStatsUpdate(stats, timeStr, characters.filter(c => c.x > 0).length)
    callbacks.onMiniMapUpdate(characters, { x: -worldContainer.x / s, y: -worldContainer.y / s, w: app.screen.width / s, h: app.screen.height / s })
  }

  app.ticker.add(gameLoop)

  return {
    destroy() {
      app.ticker.remove(gameLoop)
      removeWheel()
      playerController.destroy()
      npcManager.destroy()
      bubbleSystem.destroy()
      particleSystem.destroy()
      dayNightSystem.destroy()
      destroyMap()
      bgLayer.destroy({ children: true })
      fgLayer.destroy({ children: true })
      worldContainer.destroy({ children: true })
    },
    startEntryAnimation() {
      camera.startEntryAnimation()
    },
  }
}
