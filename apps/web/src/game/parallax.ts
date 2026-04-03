/**
 * 视差层管理器
 * 各层以不同速率随相机滚动，制造立体纵深感
 */
import { Application, Container, Graphics } from 'pixi.js'

export interface ParallaxLayer {
  readonly container: Container
  /** 0 = 固定不动, 1 = 与相机同步, 1.05 = 比相机稍快（前景） */
  readonly scrollFactor: number
}

/**
 * 根据相机位置更新各层的 x/y
 * @param layers - 视差层列表
 * @param baseX - factor=1 时 container.x 应有的值
 * @param baseY - factor=1 时 container.y 应有的值
 */
export function applyParallax(
  layers: readonly ParallaxLayer[],
  baseX: number,
  baseY: number,
  screenW: number,
  screenH: number,
): void {
  for (const layer of layers) {
    const f = layer.scrollFactor
    // factor=1 时与主容器同步；其他因子按比例偏移
    layer.container.x = baseX * f + (screenW / 2) * (1 - f)
    layer.container.y = baseY * f + (screenH / 2) * (1 - f)
  }
}

/** 创建背景层：远景天际线，用简单像素风格绘制 */
export function createBackgroundLayer(app: Application): Container {
  const bg = new Container()
  bg.label = 'background'

  const g = new Graphics()
  const w = app.screen.width * 3  // 足够宽以覆盖视差移动
  const h = app.screen.height * 3

  // 渐变天空（用多个矩形模拟）
  const skyColors = [0x1a2040, 0x2a3060, 0x3a4080, 0x4a5090, 0x5a60a0]
  const bandH = h * 0.6 / skyColors.length
  for (let i = 0; i < skyColors.length; i++) {
    g.rect(0, i * bandH, w, bandH + 1).fill(skyColors[i])
  }

  // 远景建筑轮廓
  const buildingColor = 0x0a1020
  const buildingHighlight = 0x1a2040
  const buildings = [
    { x: 50, w: 60, h: 120 },
    { x: 130, w: 40, h: 90 },
    { x: 190, w: 80, h: 140 },
    { x: 290, w: 50, h: 100 },
    { x: 360, w: 70, h: 130 },
    { x: 450, w: 45, h: 80 },
    { x: 510, w: 90, h: 150 },
    { x: 620, w: 55, h: 110 },
    { x: 700, w: 65, h: 95 },
    { x: 780, w: 40, h: 120 },
  ]
  const groundY = h * 0.6
  for (const b of buildings) {
    g.rect(b.x, groundY - b.h, b.w, b.h).fill(buildingColor)
    g.rect(b.x, groundY - b.h, b.w, 3).fill(buildingHighlight)
    // 窗户
    for (let wy = 10; wy < b.h - 10; wy += 14) {
      for (let wx = 6; wx < b.w - 6; wx += 14) {
        const lit = Math.sin(b.x * 0.1 + wx + wy) > 0.3
        g.rect(b.x + wx, groundY - b.h + wy, 6, 8).fill(lit ? 0xffe080 : 0x1a2840)
      }
    }
  }

  bg.addChild(g)
  return bg
}
