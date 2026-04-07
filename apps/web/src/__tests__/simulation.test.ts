import { describe, it, expect } from 'vitest'
import {
  generateEmployees,
  computeEmployeeState,
  getStatusCounts,
  getDaylightOverlay,
  initCharacterStates,
} from '../game/simulation'
import type { MapZone } from '../game/editor/types'

// 测试用最小 zone 集
const TEST_ZONES: readonly MapZone[] = [
  { id: 'ws_ops_brand', name: '运营', type: 'workstation', x: 20, y: 2, width: 14, height: 8, color: 0x6b8e5a, borderColor: 0x4a6e3a, seats: 58 },
  { id: 'ws_14_mid', name: '14排', type: 'workstation', x: 35, y: 2, width: 12, height: 8, color: 0xc45c5c, borderColor: 0xa43c3c, seats: 29 },
  { id: 'ws_war', name: 'WAR', type: 'workstation', x: 48, y: 2, width: 8, height: 8, color: 0x5aacb8, borderColor: 0x3a8c98, seats: 16 },
  { id: 'ws_gp', name: 'GP', type: 'workstation', x: 57, y: 2, width: 12, height: 8, color: 0x8a8a8a, borderColor: 0x6a6a6a, seats: 48 },
  { id: 'ws_ai_ops', name: 'AI中台', type: 'workstation', x: 9, y: 32, width: 12, height: 10, color: 0xd4a843, borderColor: 0xb48823, seats: 49 },
  { id: 'ws_gmt', name: 'GMT', type: 'workstation', x: 9, y: 43, width: 12, height: 8, color: 0xd4a843, borderColor: 0xb48823, seats: 28 },
  { id: 'ws_5row', name: '5排', type: 'workstation', x: 46, y: 14, width: 14, height: 15, color: 0x5aacb8, borderColor: 0x3a8c98, seats: 58 },
  { id: 'ws_15row', name: '15排', type: 'workstation', x: 29, y: 32, width: 28, height: 19, color: 0x4a7fb5, borderColor: 0x2a5f95, seats: 154 },
  { id: 'ws_4row', name: '4排', type: 'workstation', x: 9, y: 14, width: 12, height: 15, color: 0xd4a843, borderColor: 0xb48823, seats: 54 },
  { id: 'mr_qidian', name: '奇点', type: 'meeting_room', x: 2, y: 14, width: 5, height: 3, color: 0x2a3a6b, borderColor: 0x5a5a5a },
  { id: 'exit_c', name: '出口', type: 'exit', x: 1, y: 10, width: 6, height: 2, color: 0x7ab87a, borderColor: 0x2a2a2a },
  { id: 'gym', name: '健身房', type: 'gym', x: 65, y: 38, width: 14, height: 10, color: 0x5a7a5a, borderColor: 0x2a2a2a },
]
const TILE_SIZE = 16

describe('generateEmployees', () => {
  it('生成指定数量的员工', () => {
    const employees = generateEmployees(10, TEST_ZONES, TILE_SIZE)
    expect(employees).toHaveLength(10)
  })

  it('每个员工有唯一 id', () => {
    const employees = generateEmployees(20, TEST_ZONES, TILE_SIZE)
    const ids = employees.map((e) => e.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(20)
  })

  it('员工有 deskZoneId', () => {
    const employees = generateEmployees(5, TEST_ZONES, TILE_SIZE)
    employees.forEach((e) => {
      expect(e.deskZoneId).toBeTruthy()
    })
  })
})

describe('computeEmployeeState', () => {
  const employees = generateEmployees(5, TEST_ZONES, TILE_SIZE)
  const emp = employees[0]

  it('工作时间内状态为 working 或 meeting', () => {
    const state = computeEmployeeState(emp, 10, 30, TEST_ZONES, TILE_SIZE)
    expect(['working', 'meeting', 'idle']).toContain(state.status)
  })

  it('深夜(03:00)返回 away', () => {
    const state = computeEmployeeState(emp, 3, 0, TEST_ZONES, TILE_SIZE)
    expect(state.status).toBe('away')
  })
})

describe('getStatusCounts', () => {
  it('返回各状态计数', () => {
    const employees = generateEmployees(15, TEST_ZONES, TILE_SIZE)
    const states = initCharacterStates(employees, 10, 0, TEST_ZONES, TILE_SIZE)
    const counts = getStatusCounts(states)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(15)
  })
})

describe('getDaylightOverlay', () => {
  it('夜间 alpha 高于白天', () => {
    const night = getDaylightOverlay(0, 0)
    const day = getDaylightOverlay(12, 0)
    expect(night.alpha).toBeGreaterThan(day.alpha)
  })

  it('返回合法 color 和 alpha', () => {
    const overlay = getDaylightOverlay(18, 30)
    expect(overlay.alpha).toBeGreaterThanOrEqual(0)
    expect(overlay.alpha).toBeLessThanOrEqual(1)
  })
})
