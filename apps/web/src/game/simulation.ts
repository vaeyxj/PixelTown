/**
 * 员工作息模拟引擎
 *
 * 标准作息：
 * 10:00-12:00 上班（在工位）
 * 12:00-14:00 午休（部分外出/休息/留工位）
 * 14:00-18:00 上班（在工位，部分开会）
 * 18:00-19:00 晚饭（部分外出）
 * 19:00-21:00 上班（部分人加班）
 *
 * 偏差：每人有随机的作息偏移（早到/晚走/跳过午休等）
 */

import { TILE_SIZE, MAP_ZONES, type MapZone } from './mapData'
import type { Direction } from './characterSprite'

export type EmployeeStatus = 'working' | 'meeting' | 'lunch' | 'dinner' | 'walking' | 'idle' | 'away' | 'exercising'

export interface Employee {
  readonly id: number
  readonly name: string
  readonly department: string
  readonly deskZoneId: string
  /** 工位内的精确像素偏移 (相对于区域左上角) */
  readonly deskOffsetX: number
  readonly deskOffsetY: number
  /** 个人作息偏差 (分钟) */
  readonly arriveOffset: number   // 正=晚到, 负=早到
  readonly lunchOffset: number
  readonly dinnerOffset: number
  readonly leaveOffset: number
  readonly hasOvertimeToday: boolean
  readonly meetingSlots: readonly MeetingSlot[]
}

interface MeetingSlot {
  readonly startHour: number
  readonly startMin: number
  readonly durationMin: number
  readonly roomId: string
}

export interface CharacterState {
  x: number
  y: number
  targetX: number
  targetY: number
  direction: Direction
  status: EmployeeStatus
  animFrame: number
  animTimer: number
  readonly employee: Employee
  /** 路径点队列 */
  path: Array<{ x: number; y: number }>
}

// ====== 名字池 ======
const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀英', '华', '慧', '建华', '玉兰', '桂英', '志强', '建国', '文', '斌', '鑫', '宇', '浩', '梦', '琪', '博', '雅', '晨', '阳', '思', '悦', '嘉', '瑞']

const DEPARTMENTS: ReadonlyArray<{ name: string; zoneIds: readonly string[] }> = [
  { name: '运营', zoneIds: ['ws_ops_brand'] },
  { name: '品牌', zoneIds: ['ws_ops_brand'] },
  { name: '教研', zoneIds: ['ws_ops_brand'] },
  { name: '小学产研', zoneIds: ['ws_14_mid'] },
  { name: 'WAR', zoneIds: ['ws_war'] },
  { name: 'GP', zoneIds: ['ws_gp'] },
  { name: 'AI中台', zoneIds: ['ws_ai_ops'] },
  { name: '运维', zoneIds: ['ws_ai_ops'] },
  { name: 'GMT', zoneIds: ['ws_gmt'] },
  { name: '教学质量', zoneIds: ['ws_gmt'] },
  { name: 'NEXT前端', zoneIds: ['ws_5row'] },
  { name: 'NEXT后端', zoneIds: ['ws_5row'] },
  { name: 'NEXT产品', zoneIds: ['ws_15row'] },
  { name: 'NEXT设计', zoneIds: ['ws_15row'] },
  { name: '数据', zoneIds: ['ws_15row'] },
  { name: '测试', zoneIds: ['ws_4row'] },
]

// 会议室 ID 列表
const MEETING_ROOM_IDS = MAP_ZONES
  .filter(z => z.type === 'meeting_room')
  .map(z => z.id)

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 4294967296
  }
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** 在区域内生成一个工位位置 (像素坐标) */
function deskPositionInZone(zone: MapZone, index: number, _total: number): { x: number; y: number } {
  const px = zone.x * TILE_SIZE
  const py = zone.y * TILE_SIZE
  const pw = zone.width * TILE_SIZE
  const ph = zone.height * TILE_SIZE
  const cols = Math.max(1, Math.floor(pw / 28))
  const row = Math.floor(index / cols)
  const col = index % cols
  return {
    x: px + 12 + (col * 26) % (pw - 20),
    y: py + 10 + (row * 48) % (ph - 30),
  }
}

/** 生成 N 个模拟员工 */
export function generateEmployees(count: number): readonly Employee[] {
  const rng = seededRandom(42)
  const employees: Employee[] = []
  const deptCounters: Record<string, number> = {}

  for (let i = 0; i < count; i++) {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length]
    const zoneId = pickRandom(dept.zoneIds, rng)
    const zone = MAP_ZONES.find(z => z.id === zoneId)!

    if (!deptCounters[zoneId]) deptCounters[zoneId] = 0
    const deskIdx = deptCounters[zoneId]++
    const totalInZone = zone.seats ?? 20
    const deskPos = deskPositionInZone(zone, deskIdx, totalInZone)

    const surname = pickRandom(SURNAMES, rng)
    const givenName = pickRandom(GIVEN_NAMES, rng)

    // 随机生成 0~2 个会议
    const meetingCount = rng() < 0.3 ? 0 : rng() < 0.6 ? 1 : 2
    const meetings: MeetingSlot[] = []
    for (let m = 0; m < meetingCount; m++) {
      const hour = rng() < 0.5
        ? 10 + Math.floor(rng() * 2)   // 上午会
        : 14 + Math.floor(rng() * 3)   // 下午会
      meetings.push({
        startHour: hour,
        startMin: rng() < 0.5 ? 0 : 30,
        durationMin: 30 + Math.floor(rng() * 3) * 15,
        roomId: pickRandom(MEETING_ROOM_IDS, rng),
      })
    }

    employees.push({
      id: i,
      name: surname + givenName,
      department: dept.name,
      deskZoneId: zoneId,
      deskOffsetX: deskPos.x,
      deskOffsetY: deskPos.y,
      arriveOffset: Math.floor((rng() - 0.3) * 40),  // -12 ~ +28 分钟
      lunchOffset: Math.floor((rng() - 0.5) * 30),
      dinnerOffset: Math.floor((rng() - 0.5) * 30),
      leaveOffset: Math.floor(rng() * 120),  // 0 ~ 120 分钟
      hasOvertimeToday: rng() < 0.35,
      meetingSlots: meetings,
    })
  }
  return employees
}

/** 获取入口位置 (像素坐标) */
export function getEntrancePosition(): { x: number; y: number } {
  const exitZone = MAP_ZONES.find(z => z.id === 'exit_c')
  if (exitZone) {
    return {
      x: exitZone.x * TILE_SIZE + exitZone.width * TILE_SIZE / 2,
      y: exitZone.y * TILE_SIZE + exitZone.height * TILE_SIZE / 2,
    }
  }
  return { x: 80, y: 180 }
}

/** 生成健身房内的随机位置 */
function gymPosition(empId: number): { status: EmployeeStatus; targetX: number; targetY: number } {
  const gym = MAP_ZONES.find(z => z.id === 'gym')
  if (!gym) return { status: 'idle', targetX: 0, targetY: 0 }
  const rng = seededRandom(empId * 777)
  return {
    status: 'exercising',
    targetX: gym.x * TILE_SIZE + 12 + rng() * (gym.width * TILE_SIZE - 28),
    targetY: gym.y * TILE_SIZE + 12 + rng() * (gym.height * TILE_SIZE - 28),
  }
}

/** 根据当前时间计算员工应处的状态和目标位置 */
export function computeEmployeeState(
  emp: Employee,
  hour: number,
  minute: number,
): { status: EmployeeStatus; targetX: number; targetY: number } {
  const timeMin = hour * 60 + minute
  const arriveTime = 10 * 60 + emp.arriveOffset
  const lunchStart = 12 * 60 + emp.lunchOffset
  const lunchEnd = 14 * 60 + emp.lunchOffset
  const dinnerStart = 18 * 60 + emp.dinnerOffset
  const dinnerEnd = 19 * 60 + emp.dinnerOffset
  const leaveTime = emp.hasOvertimeToday ? (21 * 60 + emp.leaveOffset) : (18 * 60 + emp.leaveOffset)

  // 还没到 or 已经走了
  if (timeMin < arriveTime || timeMin > leaveTime) {
    return { status: 'away', targetX: -100, targetY: -100 }
  }

  // 检查是否在会议中
  for (const meeting of emp.meetingSlots) {
    const mStart = meeting.startHour * 60 + meeting.startMin
    const mEnd = mStart + meeting.durationMin
    if (timeMin >= mStart && timeMin < mEnd) {
      const room = MAP_ZONES.find(z => z.id === meeting.roomId)
      if (room) {
        // 在会议室中央区域的随机位置
        const rng = seededRandom(emp.id * 1000 + meeting.startHour)
        return {
          status: 'meeting',
          targetX: room.x * TILE_SIZE + 10 + rng() * (room.width * TILE_SIZE - 24),
          targetY: room.y * TILE_SIZE + 10 + rng() * (room.height * TILE_SIZE - 24),
        }
      }
    }
  }

  // 午休
  if (timeMin >= lunchStart && timeMin < lunchEnd) {
    const rng = seededRandom(emp.id + 999)
    const roll = rng()
    if (roll < 0.15) {
      // 去健身房
      return gymPosition(emp.id)
    }
    if (roll < 0.55) {
      // 留在工位休息
      return { status: 'lunch', targetX: emp.deskOffsetX, targetY: emp.deskOffsetY }
    }
    // 外出 (走到出口附近或走廊)
    return { status: 'lunch', targetX: -100, targetY: -100 }
  }

  // 晚饭
  if (timeMin >= dinnerStart && timeMin < dinnerEnd) {
    const rng = seededRandom(emp.id + 888)
    const roll = rng()
    if (roll < 0.12) {
      // 去健身房
      return gymPosition(emp.id)
    }
    if (roll < 0.42) {
      return { status: 'dinner', targetX: emp.deskOffsetX, targetY: emp.deskOffsetY }
    }
    return { status: 'dinner', targetX: -100, targetY: -100 }
  }

  // 正常工作
  return { status: 'working', targetX: emp.deskOffsetX, targetY: emp.deskOffsetY }
}

/** 初始化所有角色状态 */
export function initCharacterStates(employees: readonly Employee[], hour: number, minute: number): CharacterState[] {
  return employees.map(emp => {
    const { status, targetX, targetY } = computeEmployeeState(emp, hour, minute)
    const isPresent = targetX >= 0
    return {
      x: isPresent ? targetX : -200,
      y: isPresent ? targetY : -200,
      targetX: isPresent ? targetX : -200,
      targetY: isPresent ? targetY : -200,
      direction: 'down' as Direction,
      status,
      animFrame: 0,
      animTimer: 0,
      employee: emp,
      path: [],
    }
  })
}

/** 每帧更新所有角色：移向目标位置 */
export function updateCharacters(chars: CharacterState[], dt: number, hour: number, minute: number): void {
  const speed = 40 // 像素/秒

  for (const ch of chars) {
    // 每隔一段时间重新计算状态
    const { status, targetX, targetY } = computeEmployeeState(ch.employee, hour, minute)
    ch.status = status
    ch.targetX = targetX
    ch.targetY = targetY

    // 不在场的角色
    if (targetX < 0) {
      ch.x = -200
      ch.y = -200
      continue
    }

    // 移动
    const dx = ch.targetX - ch.x
    const dy = ch.targetY - ch.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 2) {
      const moveX = (dx / dist) * speed * dt
      const moveY = (dy / dist) * speed * dt

      if (Math.abs(moveX) < dist) ch.x += moveX
      else ch.x = ch.targetX
      if (Math.abs(moveY) < dist) ch.y += moveY
      else ch.y = ch.targetY

      // 方向
      if (Math.abs(dx) > Math.abs(dy)) {
        ch.direction = dx > 0 ? 'right' : 'left'
      } else {
        ch.direction = dy > 0 ? 'down' : 'up'
      }

      // 行走动画
      ch.animTimer += dt
      if (ch.animTimer > 0.15) {
        ch.animTimer = 0
        ch.animFrame = (ch.animFrame + 1) % 4
      }
    } else {
      // 到达目的地，站立
      ch.animFrame = 0
      ch.animTimer = 0
    }
  }
}

/** 统计当前各状态人数 */
export function getStatusCounts(chars: readonly CharacterState[]): Record<EmployeeStatus, number> {
  const counts: Record<EmployeeStatus, number> = {
    working: 0, meeting: 0, lunch: 0, dinner: 0, walking: 0, idle: 0, away: 0, exercising: 0,
  }
  for (const ch of chars) {
    counts[ch.status]++
  }
  return counts
}

/** 真实时间时钟 — 与物理世界时间保持一致 */
export class SimClock {
  getTime(): { hour: number; minute: number; timeStr: string } {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    return {
      hour,
      minute,
      timeStr: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    }
  }
}

/** 根据小时返回天色遮罩颜色和透明度（完整 24 小时周期） */
export function getDaylightOverlay(hour: number, minute: number): { color: number; alpha: number } {
  const t = hour + minute / 60
  // 完整 24 小时光照表：[截止时刻, 色调, 透明度]
  const table: [number, number, number][] = [
    [5,  0x0a0820, 0.35],   // 深夜
    [6,  0x1a1840, 0.28],   // 黎明前
    [7,  0x2a3060, 0.18],   // 破晓
    [8,  0x4a6080, 0.08],   // 清晨
    [10, 0x000000, 0],      // 上午
    [12, 0x000000, 0],      // 正午
    [14, 0xffa830, 0.03],   // 午后暖光
    [17, 0x000000, 0],      // 下午
    [18, 0xff8020, 0.06],   // 傍晚
    [19, 0xff6020, 0.12],   // 日落
    [20, 0x1a1840, 0.2],    // 黄昏
    [21, 0x0a0820, 0.28],   // 入夜
  ]
  const found = table.find(([h]) => t < h)
  return found ? { color: found[1], alpha: found[2] } : { color: 0x0a0820, alpha: 0.35 }
}

/** 获取当前的黑暗程度 0~1 (用于灯光系统) */
export function getDarknessLevel(hour: number, minute: number): number {
  const { alpha } = getDaylightOverlay(hour, minute)
  return alpha
}

/** 状态对应的 emoji */
export const STATUS_EMOJI: Record<EmployeeStatus, string> = {
  working: '💻', meeting: '🗣️', lunch: '🍱',
  dinner: '🍽️', walking: '🚶', idle: '😊', away: '',
  exercising: '💪',
}

const CHAT_MESSAGES = [
  '大模型 API 又涨价了...', '今天 GPT-5 内测结果怎么样？', '课程效果数据出来了 🎯',
  'RAG 检索精度还要优化', '学员完课率提升了 12%！', '今天 AI 助教回复质量有点差',
  '知识图谱更新完了', '语音识别漏字严重...', '个性化推荐上线 🚀',
  '今天 demo 效果超出预期！', '提示词工程真的是门学问', '模型幻觉问题还没解决',
  '下周 AI 大会要分享 PPT', '多模态课件交互太炸了！', '微调数据集打完标签了',
  'Agent 框架换 LangGraph 了', '智能评测准确率 94% ✨', '向量数据库要迁移了',
  '今晚要部署新版本吗？', '教研 + 算法双周会几点？',
]

export function getRandomChat(): string {
  return CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)]
}
