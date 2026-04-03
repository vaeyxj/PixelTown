/**
 * D区办公地图数据定义
 * 坐标系：左上角为原点，单位为瓦片（1 tile = 16px）
 * 整体地图尺寸：约 96 x 56 tiles (1536 x 896 px)
 */

export type ZoneType =
  | 'workstation'
  | 'meeting_room'
  | 'restroom'
  | 'storage'
  | 'exit'
  | 'hallway'
  | 'service'
  | 'shared_desk'
  | 'gym'

export interface MapZone {
  readonly id: string
  readonly name: string
  readonly type: ZoneType
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly color: number
  readonly borderColor: number
  readonly label?: string
  readonly seats?: number
  readonly group?: string
}

// Color palette (pixel-art style, limited palette)
const COLORS = {
  // Workstation areas
  workGreen: 0x6b8e5a,
  workRed: 0xc45c5c,
  workCyan: 0x5aacb8,
  workGray: 0x8a8a8a,
  workYellow: 0xd4a843,
  workBlue: 0x4a7fb5,

  // Meeting rooms (dark blue tones)
  meetingDark: 0x2a3a6b,
  meetingMid: 0x3a4f8a,
  meetingLight: 0x4a5f9a,

  // Functional areas
  storage: 0xc49a6c,
  service: 0xe8b4b8,
  restroom: 0x6aaad4,
  exit: 0x7ab87a,
  hallway: 0xd4cbb8,
  sharedDesk: 0x8ab86a,

  // Gym
  gym: 0x5a7a5a,

  // Borders
  borderDark: 0x2a2a2a,
  borderLight: 0x5a5a5a,
} as const

export const MAP_WIDTH = 96
export const MAP_HEIGHT = 56
export const TILE_SIZE = 16

// ========== TOP ROW ==========

const topLeftRooms: readonly MapZone[] = [
  {
    id: 'storage',
    name: '库房',
    type: 'storage',
    x: 1,
    y: 2,
    width: 6,
    height: 6,
    color: COLORS.storage,
    borderColor: COLORS.borderDark,
  },
  {
    id: 'customer_service',
    name: '客服部',
    type: 'service',
    x: 8,
    y: 2,
    width: 7,
    height: 6,
    color: COLORS.service,
    borderColor: COLORS.borderDark,
  },
  {
    id: 'restroom_top_left',
    name: '🚻',
    type: 'restroom',
    x: 16,
    y: 5,
    width: 3,
    height: 3,
    color: COLORS.restroom,
    borderColor: COLORS.borderDark,
  },
  {
    id: 'exit_c',
    name: '←通往C区',
    type: 'exit',
    x: 1,
    y: 10,
    width: 6,
    height: 2,
    color: COLORS.exit,
    borderColor: COLORS.borderDark,
  },
]

// Top row workstations: 14排 共151个有效工位
const topWorkstations: readonly MapZone[] = [
  {
    id: 'ws_ops_brand',
    name: '运营/品牌/教研',
    type: 'workstation',
    x: 20,
    y: 2,
    width: 14,
    height: 8,
    color: COLORS.workGreen,
    borderColor: 0x4a6e3a,
    seats: 58,
    group: '14排',
    label: '运营·品牌·教研 58席',
  },
  {
    id: 'ws_14_mid',
    name: '14排中段',
    type: 'workstation',
    x: 35,
    y: 2,
    width: 12,
    height: 8,
    color: COLORS.workRed,
    borderColor: 0xa43c3c,
    seats: 29,
    group: '14排',
    label: '小学产研 29席',
  },
  {
    id: 'ws_war',
    name: 'WAR',
    type: 'workstation',
    x: 48,
    y: 2,
    width: 8,
    height: 8,
    color: COLORS.workCyan,
    borderColor: 0x3a8c98,
    seats: 16,
    group: '14排',
    label: 'WAR 16席',
  },
  {
    id: 'ws_gp',
    name: 'GP',
    type: 'workstation',
    x: 57,
    y: 2,
    width: 12,
    height: 8,
    color: COLORS.workGray,
    borderColor: 0x6a6a6a,
    seats: 48,
    group: '14排',
    label: 'GP 48席',
  },
]

// Top right area
const topRightRooms: readonly MapZone[] = [
  {
    id: 'restroom_top_right',
    name: '🚻 卫生间',
    type: 'restroom',
    x: 70,
    y: 2,
    width: 6,
    height: 8,
    color: COLORS.restroom,
    borderColor: COLORS.borderDark,
  },
]

// ========== MIDDLE ROW ==========

// Left meeting rooms column (blue)
const leftMeetingRooms: readonly MapZone[] = [
  {
    id: 'mr_qidian',
    name: '奇点',
    type: 'meeting_room',
    x: 2,
    y: 14,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_fanshi',
    name: '范式',
    type: 'meeting_room',
    x: 2,
    y: 18,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_chaoqun',
    name: '超群',
    type: 'meeting_room',
    x: 2,
    y: 22,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_xianzhi',
    name: '先知',
    type: 'meeting_room',
    x: 2,
    y: 26,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
]

// Middle workstations: 4排 54 seats
const middleWorkstations: readonly MapZone[] = [
  {
    id: 'ws_4row',
    name: '4排工位',
    type: 'workstation',
    x: 9,
    y: 14,
    width: 12,
    height: 15,
    color: COLORS.workYellow,
    borderColor: 0xb48823,
    seats: 54,
    group: '4排',
    label: '4排 54席',
  },
]

// Center meeting rooms
const centerMeetingRooms: readonly MapZone[] = [
  {
    id: 'mr_liangdu',
    name: '梁度',
    type: 'meeting_room',
    x: 23,
    y: 14,
    width: 6,
    height: 3,
    color: COLORS.meetingMid,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_juzhen',
    name: '矩阵',
    type: 'meeting_room',
    x: 23,
    y: 17.5,
    width: 6,
    height: 3,
    color: COLORS.meetingMid,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_moxing',
    name: '模型',
    type: 'meeting_room',
    x: 30,
    y: 14,
    width: 6,
    height: 3,
    color: COLORS.meetingMid,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_ai',
    name: 'AI°',
    type: 'meeting_room',
    x: 30,
    y: 17.5,
    width: 6,
    height: 5,
    color: COLORS.meetingLight,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_suanfa',
    name: '算法',
    type: 'meeting_room',
    x: 23,
    y: 21,
    width: 6,
    height: 3,
    color: COLORS.meetingMid,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_xiangliang',
    name: '向量',
    type: 'meeting_room',
    x: 23,
    y: 24.5,
    width: 6,
    height: 3,
    color: COLORS.meetingMid,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_shuju',
    name: '数据',
    type: 'meeting_room',
    x: 30,
    y: 24.5,
    width: 6,
    height: 3,
    color: COLORS.meetingMid,
    borderColor: COLORS.borderLight,
  },
]

// Middle right workstations: 5排 58 seats
const middleRightWorkstations: readonly MapZone[] = [
  {
    id: 'ws_5row',
    name: '5排工位',
    type: 'workstation',
    x: 46,
    y: 14,
    width: 14,
    height: 15,
    color: COLORS.workCyan,
    borderColor: 0x3a8c98,
    seats: 58,
    group: '5排',
    label: '5排 58席',
  },
]

// Right meeting rooms column (dark blue - named after thinkers)
const rightMeetingRooms: readonly MapZone[] = [
  {
    id: 'mr_turing',
    name: '图灵',
    type: 'meeting_room',
    x: 62,
    y: 14,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_euler',
    name: '欧拉',
    type: 'meeting_room',
    x: 68,
    y: 14,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_taylor',
    name: '泰勒',
    type: 'meeting_room',
    x: 74,
    y: 14,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_gauss',
    name: '高斯',
    type: 'meeting_room',
    x: 62,
    y: 18,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_laozi',
    name: '老子',
    type: 'meeting_room',
    x: 68,
    y: 18,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_mozi',
    name: '墨子',
    type: 'meeting_room',
    x: 74,
    y: 18,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_zhuangzi',
    name: '庄子',
    type: 'meeting_room',
    x: 80,
    y: 18,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_newton',
    name: '牛顿',
    type: 'meeting_room',
    x: 62,
    y: 23,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
]

// Far right
const farRightRooms: readonly MapZone[] = [
  {
    id: 'mr_xunzi',
    name: '荀子',
    type: 'meeting_room',
    x: 80,
    y: 14,
    width: 5,
    height: 3,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
]

// ========== BOTTOM ROW ==========

const bottomWorkstations: readonly MapZone[] = [
  {
    id: 'ws_ai_ops',
    name: 'AI中台+运维',
    type: 'workstation',
    x: 9,
    y: 32,
    width: 12,
    height: 10,
    color: COLORS.workYellow,
    borderColor: 0xb48823,
    seats: 49,
    label: 'AI中台+运维 49席',
  },
  {
    id: 'ws_shared',
    name: '共享工位',
    type: 'shared_desk',
    x: 22,
    y: 32,
    width: 6,
    height: 4,
    color: COLORS.sharedDesk,
    borderColor: 0x6a9a4a,
    seats: 4,
    label: '共享工位 4席',
  },
  {
    id: 'ws_gmt',
    name: 'GMT+教学质量',
    type: 'workstation',
    x: 9,
    y: 43,
    width: 12,
    height: 8,
    color: COLORS.workYellow,
    borderColor: 0xb48823,
    seats: 28,
    label: 'GMT+教学质量 28席',
  },
  {
    id: 'ws_15row',
    name: '15排工位',
    type: 'workstation',
    x: 29,
    y: 32,
    width: 28,
    height: 19,
    color: COLORS.workBlue,
    borderColor: 0x2a5f95,
    seats: 154,
    group: '15排',
    label: '15排 154席',
  },
]

// Bottom right meeting rooms
const bottomRightRooms: readonly MapZone[] = [
  {
    id: 'mr_zengzhang',
    name: '增长',
    type: 'meeting_room',
    x: 59,
    y: 32,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_zhuanhua',
    name: '转化',
    type: 'meeting_room',
    x: 65,
    y: 32,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_kongzi',
    name: '孔子',
    type: 'meeting_room',
    x: 71,
    y: 32,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_mengzi',
    name: '孟子',
    type: 'meeting_room',
    x: 77,
    y: 32,
    width: 5,
    height: 4,
    color: COLORS.meetingDark,
    borderColor: COLORS.borderLight,
  },
  {
    id: 'mr_love',
    name: '爱°',
    type: 'meeting_room',
    x: 83,
    y: 40,
    width: 5,
    height: 4,
    color: COLORS.meetingLight,
    borderColor: COLORS.borderLight,
  },
]

// ========== GYM AREA ==========

const gymArea: readonly MapZone[] = [
  {
    id: 'gym',
    name: '💪 健身房',
    type: 'gym',
    x: 65,
    y: 38,
    width: 14,
    height: 10,
    color: COLORS.gym,
    borderColor: COLORS.borderDark,
    label: '健身房 GYM',
  },
]

// Combine all zones
export const MAP_ZONES: readonly MapZone[] = [
  ...topLeftRooms,
  ...topWorkstations,
  ...topRightRooms,
  ...leftMeetingRooms,
  ...middleWorkstations,
  ...centerMeetingRooms,
  ...middleRightWorkstations,
  ...rightMeetingRooms,
  ...farRightRooms,
  ...bottomWorkstations,
  ...bottomRightRooms,
  ...gymArea,
]
