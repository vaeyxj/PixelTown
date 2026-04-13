export const GAME_CONFIG = {
  // 玩家
  playerSpeed: 180, // px / sec
  playerSize: { w: 16, h: 24 }, // 视觉大小（占位色块）
  // 脚下采样点（相对于角色中心点的偏移），代表"实际踩在地上的足印"
  footprint: [
    { x: -5, y: 10 },
    { x: 0, y: 12 },
    { x: 5, y: 10 },
  ],
  collisionThreshold: 128, // R < 此值视为阻挡
  zoom: 2, // 相机缩放
  startPos: { x: 2400, y: 1800 }, // 背景中部（4800x3584）
} as const
