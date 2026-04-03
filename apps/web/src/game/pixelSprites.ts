/**
 * 像素风格家具和物件绘制函数
 * 所有函数接收 Graphics 对象和像素坐标(px, py)，在该位置绘制物件
 * 每个物件占据一个固定的像素区域
 */
import { Graphics } from 'pixi.js'

// ====== 色板 ======
const C = {
  // 桌面
  deskTop: 0xc4a882,
  deskSide: 0xa68a64,
  deskLeg: 0x8a7050,
  // 显示器
  monitorFrame: 0x3a3a3a,
  monitorScreen: 0x1a3a5a,
  monitorScreenOn: 0x4a8aba,
  monitorStand: 0x4a4a4a,
  monitorGlow: 0x6aaadd,
  // 椅子
  chairSeat: 0x2a2a2a,
  chairBack: 0x3a3a4a,
  chairWheel: 0x5a5a5a,
  // 键盘鼠标
  keyboard: 0xd8d8d8,
  mouse: 0xc0c0c0,
  // 会议
  meetingTable: 0x6a5040,
  meetingTableTop: 0x8a7060,
  whiteboard: 0xf0f0f0,
  whiteboardFrame: 0xb0b0b0,
  whiteboardMark: 0x3a6aaa,
  tvScreen: 0x1a1a2a,
  tvFrame: 0x2a2a2a,
  // 植物
  potBrown: 0x8a6040,
  potDark: 0x6a4a30,
  leafGreen: 0x4a8a3a,
  leafDark: 0x3a6a2a,
  leafLight: 0x6aaa5a,
  // 卫生间
  tilePale: 0xc8dae8,
  tileGrout: 0xaabaca,
  sink: 0xe0e8f0,
  sinkBowl: 0xd0d8e4,
  mirror: 0xc0d8ea,
  // 地板
  floorWood: 0xd4c4a8,
  floorWoodDark: 0xc4b498,
  floorCarpet: 0x7a8a9a,
  floorCarpetLight: 0x8a9aaa,
  corridorTile: 0xd8d0c0,
  corridorTileDark: 0xc8c0b0,
  // 墙
  wallTop: 0x9a8a7a,
  wallFront: 0xb8a890,
  doorFrame: 0x7a6a5a,
  door: 0xa09080,
  // 咖啡机/饮水机
  machineMetal: 0xb0b8c0,
  machineDark: 0x6a7080,
  coffee: 0x6a4a2a,
  water: 0x6aaad8,
} as const

/** 绘制一个工位（朝下）：桌子 + 显示器 + 键盘 + 椅子，尺寸约 20x24 px */
export function drawDeskDown(g: Graphics, px: number, py: number): void {
  // 桌面
  g.rect(px, py + 4, 20, 10).fill(C.deskTop)
  g.rect(px, py + 13, 20, 2).fill(C.deskSide)
  // 桌腿
  g.rect(px + 1, py + 15, 2, 3).fill(C.deskLeg)
  g.rect(px + 17, py + 15, 2, 3).fill(C.deskLeg)
  // 显示器
  g.rect(px + 6, py + 1, 9, 7).fill(C.monitorFrame)
  g.rect(px + 7, py + 2, 7, 5).fill(C.monitorScreen)
  g.rect(px + 9, py + 8, 3, 2).fill(C.monitorStand)
  // 键盘
  g.rect(px + 5, py + 10, 8, 3).fill(C.keyboard)
  // 鼠标
  g.rect(px + 15, py + 10, 3, 2).fill(C.mouse)
  // 椅子（下方）
  g.rect(px + 5, py + 19, 10, 4).fill(C.chairBack)
  g.rect(px + 6, py + 18, 8, 4).fill(C.chairSeat)
  // 椅轮
  g.rect(px + 6, py + 23, 2, 1).fill(C.chairWheel)
  g.rect(px + 12, py + 23, 2, 1).fill(C.chairWheel)
}

/** 绘制一个工位（朝上）：椅子在上 */
export function drawDeskUp(g: Graphics, px: number, py: number): void {
  // 椅子（上方）
  g.rect(px + 5, py, 10, 4).fill(C.chairBack)
  g.rect(px + 6, py + 1, 8, 4).fill(C.chairSeat)
  g.rect(px + 6, py, 2, 1).fill(C.chairWheel)
  g.rect(px + 12, py, 2, 1).fill(C.chairWheel)
  // 桌面
  g.rect(px, py + 7, 20, 10).fill(C.deskTop)
  g.rect(px, py + 17, 20, 2).fill(C.deskSide)
  // 桌腿
  g.rect(px + 1, py + 19, 2, 2).fill(C.deskLeg)
  g.rect(px + 17, py + 19, 2, 2).fill(C.deskLeg)
  // 显示器（背面朝上）
  g.rect(px + 6, py + 8, 9, 7).fill(C.monitorFrame)
  g.rect(px + 7, py + 9, 7, 5).fill(C.monitorScreen)
  g.rect(px + 9, py + 15, 3, 2).fill(C.monitorStand)
  // 键盘
  g.rect(px + 5, py + 8, 8, 3).fill(C.keyboard)
}

/** 绘制一对面对面工位（两人一组），尺寸约 20x40 px */
export function drawDeskPair(g: Graphics, px: number, py: number): void {
  drawDeskDown(g, px, py)
  drawDeskUp(g, px, py + 24)
}

/** 绘制会议长桌 + 椅子，尺寸根据 w/h 自适应 */
export function drawMeetingRoom(g: Graphics, px: number, py: number, w: number, h: number): void {
  // 地毯地板
  g.rect(px, py, w, h).fill(0x4a5568)

  const tableW = Math.min(w - 24, Math.max(30, w * 0.5))
  const tableH = Math.min(h - 20, Math.max(16, h * 0.4))
  const tx = px + (w - tableW) / 2
  const ty = py + (h - tableH) / 2

  // 桌子阴影
  g.rect(tx + 2, ty + 2, tableW, tableH).fill(0x3a4050)
  // 桌子
  g.rect(tx, ty, tableW, tableH).fill(C.meetingTableTop)
  g.rect(tx, ty, tableW, 2).fill(0x9a8070)
  g.rect(tx + 1, ty + 1, tableW - 2, tableH - 2).stroke({ color: C.meetingTable, width: 1 })

  // 椅子（上下排）
  const chairCount = Math.max(2, Math.floor(tableW / 12))
  const chairSpacing = tableW / (chairCount + 1)
  for (let i = 1; i <= chairCount; i++) {
    const cx = tx + i * chairSpacing - 4
    // 上排椅子
    g.rect(cx, ty - 7, 8, 5).fill(C.chairBack)
    g.rect(cx + 1, ty - 5, 6, 4).fill(0x4a6a8a)
    // 下排椅子
    g.rect(cx, ty + tableH + 2, 8, 5).fill(C.chairBack)
    g.rect(cx + 1, ty + tableH + 2, 6, 4).fill(0x4a6a8a)
  }

  // 白板（顶部墙上）
  if (h > 36) {
    const wbW = Math.min(w - 16, 36)
    const wbX = px + (w - wbW) / 2
    g.rect(wbX, py + 3, wbW, 12).fill(C.whiteboardFrame)
    g.rect(wbX + 1, py + 4, wbW - 2, 10).fill(C.whiteboard)
    // 白板上的标记
    g.rect(wbX + 4, py + 6, 12, 1).fill(C.whiteboardMark)
    g.rect(wbX + 4, py + 9, 18, 1).fill(0xaa3a3a)
    g.rect(wbX + 4, py + 12, 8, 1).fill(0x3aaa3a)
  }

  // TV 屏幕（如果房间够大）
  if (w > 60) {
    g.rect(px + w - 20, py + 4, 16, 10).fill(C.tvFrame)
    g.rect(px + w - 19, py + 5, 14, 8).fill(C.tvScreen)
    // 屏幕上的光点
    g.rect(px + w - 17, py + 7, 4, 2).fill(0x3a5a8a)
    g.rect(px + w - 11, py + 7, 6, 2).fill(0x4a7aaa)
  }
}

/** 绘制盆栽植物，尺寸约 10x14 px */
export function drawPlant(g: Graphics, px: number, py: number): void {
  // 花盆
  g.rect(px + 2, py + 8, 6, 5).fill(C.potBrown)
  g.rect(px + 1, py + 7, 8, 2).fill(C.potDark)
  // 叶子
  g.circle(px + 5, py + 4, 4).fill(C.leafGreen)
  g.circle(px + 3, py + 3, 3).fill(C.leafDark)
  g.circle(px + 7, py + 2, 3).fill(C.leafLight)
  g.circle(px + 5, py + 1, 2).fill(C.leafGreen)
}

/** 绘制大型盆栽，尺寸约 14x18 px */
export function drawLargePlant(g: Graphics, px: number, py: number): void {
  // 花盆
  g.rect(px + 3, py + 11, 8, 6).fill(C.potBrown)
  g.rect(px + 2, py + 10, 10, 2).fill(C.potDark)
  // 树干
  g.rect(px + 6, py + 6, 2, 5).fill(0x6a5030)
  // 树冠
  g.circle(px + 7, py + 4, 5).fill(C.leafGreen)
  g.circle(px + 4, py + 3, 4).fill(C.leafDark)
  g.circle(px + 10, py + 2, 4).fill(C.leafLight)
  g.circle(px + 7, py + 0, 3).fill(C.leafGreen)
}

/** 绘制饮水机，尺寸约 10x16 px */
export function drawWaterCooler(g: Graphics, px: number, py: number): void {
  // 机身
  g.rect(px + 2, py + 4, 6, 10).fill(C.machineMetal)
  g.rect(px + 2, py + 4, 6, 2).fill(0xc0c8d0)
  // 水桶
  g.rect(px + 3, py, 4, 5).fill(0xb0d8f0)
  g.rect(px + 3, py, 4, 1).fill(0x90b8d0)
  // 出水口
  g.rect(px + 4, py + 8, 2, 1).fill(C.machineDark)
  // 底座
  g.rect(px + 1, py + 14, 8, 2).fill(C.machineDark)
}

/** 绘制洗手台，尺寸约 14x10 px */
export function drawSink(g: Graphics, px: number, py: number): void {
  // 台面
  g.rect(px, py + 3, 14, 6).fill(C.sink)
  // 水槽凹陷
  g.rect(px + 2, py + 4, 10, 4).fill(C.sinkBowl)
  // 水龙头
  g.rect(px + 6, py, 2, 4).fill(0xc0c0c0)
  g.rect(px + 5, py, 4, 1).fill(0xd0d0d0)
  // 镜子（上方）
  g.rect(px + 1, py - 8, 12, 7).fill(C.mirror)
  g.rect(px + 1, py - 8, 12, 7).stroke({ color: 0xa0b0c0, width: 1 })
}

/** 绘制马桶隔间，尺寸约 14x16 px */
export function drawToiletStall(g: Graphics, px: number, py: number): void {
  // 隔间墙
  g.rect(px, py, 14, 16).fill(C.tilePale)
  g.rect(px, py, 14, 16).stroke({ color: C.tileGrout, width: 1 })
  // 门
  g.rect(px + 3, py + 11, 8, 5).fill(C.door)
  g.rect(px + 3, py + 11, 8, 1).fill(C.doorFrame)
  // 马桶
  g.rect(px + 4, py + 2, 6, 7).fill(0xf0f0f0)
  g.rect(px + 3, py + 1, 8, 2).fill(0xe8e8e8)
  g.rect(px + 5, py + 5, 4, 3).fill(0xe0e8f0)
}

/** 绘制走廊地板（棋盘格纹），填充指定矩形区域 */
export function drawCorridorFloor(g: Graphics, px: number, py: number, w: number, h: number): void {
  const tileSize = 8
  for (let x = 0; x < w; x += tileSize) {
    for (let y = 0; y < h; y += tileSize) {
      const isLight = ((x + y) / tileSize) % 2 === 0
      const tw = Math.min(tileSize, w - x)
      const th = Math.min(tileSize, h - y)
      g.rect(px + x, py + y, tw, th).fill(isLight ? C.corridorTile : C.corridorTileDark)
    }
  }
}

/** 绘制木地板纹理 */
export function drawWoodFloor(g: Graphics, px: number, py: number, w: number, h: number): void {
  const plankH = 6
  for (let y = 0; y < h; y += plankH) {
    const offset = (Math.floor(y / plankH) % 2) * 12
    for (let x = 0; x < w; x += 24) {
      const pw = Math.min(24, w - x)
      const ph = Math.min(plankH, h - y)
      const isAlt = ((x + offset) / 24 + y / plankH) % 2 === 0
      g.rect(px + x + offset % w, py + y, pw, ph).fill(isAlt ? C.floorWood : C.floorWoodDark)
    }
  }
  // 木板间隙线
  for (let y = 0; y < h; y += plankH) {
    g.moveTo(px, py + y).lineTo(px + w, py + y).stroke({ color: 0xb0a080, width: 0.5, alpha: 0.3 })
  }
}

/** 绘制地毯地板 */
export function drawCarpetFloor(g: Graphics, px: number, py: number, w: number, h: number): void {
  g.rect(px, py, w, h).fill(C.floorCarpet)
  // 细微纹理
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      if ((x + y) % 8 === 0) {
        g.rect(px + x, py + y, 2, 2).fill(C.floorCarpetLight)
      }
    }
  }
}

/** 绘制墙体（顶视角3D效果），顶部有厚度 */
export function drawWall(g: Graphics, px: number, py: number, w: number, h: number): void {
  const wallThickness = 4
  // 墙壁正面
  g.rect(px, py, w, h).fill(C.wallFront)
  // 墙壁顶面（深色）
  g.rect(px, py, w, wallThickness).fill(C.wallTop)
  // 阴影
  g.rect(px, py + h, w, 2).fill({ color: 0x000000, alpha: 0.15 })
}

/** 绘制门 */
export function drawDoor(g: Graphics, px: number, py: number, horizontal: boolean): void {
  if (horizontal) {
    g.rect(px, py, 16, 4).fill(C.door)
    g.rect(px, py, 16, 1).fill(C.doorFrame)
    g.rect(px, py + 3, 16, 1).fill(C.doorFrame)
    // 门把手
    g.rect(px + 12, py + 1, 2, 2).fill(0xd4a840)
  } else {
    g.rect(px, py, 4, 16).fill(C.door)
    g.rect(px, py, 1, 16).fill(C.doorFrame)
    g.rect(px + 3, py, 1, 16).fill(C.doorFrame)
    g.rect(px + 1, py + 12, 2, 2).fill(0xd4a840)
  }
}

/** 绘制咖啡机，尺寸约 10x12 px */
export function drawCoffeeMachine(g: Graphics, px: number, py: number): void {
  g.rect(px + 1, py + 2, 8, 8).fill(C.machineMetal)
  g.rect(px + 1, py + 2, 8, 2).fill(0xd0d0d0)
  // 咖啡出口
  g.rect(px + 3, py + 5, 4, 3).fill(C.machineDark)
  g.rect(px + 4, py + 6, 2, 2).fill(C.coffee)
  // 杯子
  g.rect(px + 3, py + 8, 4, 3).fill(0xf0f0f0)
  // 底座
  g.rect(px, py + 10, 10, 2).fill(C.machineDark)
}

/** 绘制跑步机，尺寸约 16x20 px */
export function drawTreadmill(g: Graphics, px: number, py: number): void {
  // 底座
  g.rect(px + 1, py + 14, 14, 5).fill(0x4a4a4a)
  g.rect(px + 2, py + 15, 12, 3).fill(0x3a3a3a)
  // 跑带
  g.rect(px + 2, py + 8, 12, 7).fill(0x5a5a5a)
  g.rect(px + 3, py + 9, 10, 5).fill(0x6a6a6a)
  // 扶手
  g.rect(px + 1, py + 2, 2, 12).fill(0x8a8a8a)
  g.rect(px + 13, py + 2, 2, 12).fill(0x8a8a8a)
  // 显示屏
  g.rect(px + 4, py, 8, 4).fill(0x2a2a2a)
  g.rect(px + 5, py + 1, 6, 2).fill(0x4aba6a)
}

/** 绘制哑铃架，尺寸约 14x16 px */
export function drawDumbbellRack(g: Graphics, px: number, py: number): void {
  // 架子
  g.rect(px + 2, py + 2, 10, 12).fill(0x6a5a4a)
  g.rect(px + 2, py + 2, 10, 2).fill(0x7a6a5a)
  // 哑铃（3层）
  for (let i = 0; i < 3; i++) {
    const dy = py + 4 + i * 4
    // 左片
    g.rect(px + 3, dy, 2, 3).fill(0x3a3a3a)
    // 杆
    g.rect(px + 5, dy + 1, 4, 1).fill(0x8a8a8a)
    // 右片
    g.rect(px + 9, dy, 2, 3).fill(0x3a3a3a)
  }
  // 底座
  g.rect(px + 1, py + 14, 12, 2).fill(0x5a4a3a)
}

/** 绘制瑜伽垫，尺寸约 12x20 px */
export function drawYogaMat(g: Graphics, px: number, py: number): void {
  g.rect(px + 1, py + 2, 10, 16).fill(0x6a5aaa)
  g.rect(px + 2, py + 3, 8, 14).fill(0x7a6aba)
  // 卷起的一端
  g.rect(px + 1, py, 10, 3).fill(0x5a4a9a)
  g.circle(px + 6, py + 1, 2).fill(0x6a5aaa)
}

/** 绘制指示牌/标识，尺寸约 12x14 px */
export function drawSign(g: Graphics, px: number, py: number, _text: string): void {
  // 牌子
  g.rect(px + 1, py, 10, 8).fill(0x2a4a6a)
  g.rect(px + 1, py, 10, 8).stroke({ color: 0x1a3a5a, width: 1 })
  // 杆子
  g.rect(px + 5, py + 8, 2, 6).fill(0x8a8a8a)
}
