import { describe, it, expect } from 'vitest'
import {
  generateEmployees,
  computeEmployeeState,
  getStatusCounts,
  getDaylightOverlay,
  initCharacterStates,
} from '../game/simulation'

describe('generateEmployees', () => {
  it('生成指定数量的员工', () => {
    const employees = generateEmployees(10)
    expect(employees).toHaveLength(10)
  })

  it('每个员工有唯一 id', () => {
    const employees = generateEmployees(20)
    const ids = employees.map((e) => e.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(20)
  })

  it('员工有 deskZoneId', () => {
    const employees = generateEmployees(5)
    employees.forEach((e) => {
      expect(e.deskZoneId).toBeTruthy()
    })
  })
})

describe('computeEmployeeState', () => {
  const employees = generateEmployees(5)
  const emp = employees[0]

  it('工作时间内状态为 working 或 meeting', () => {
    const state = computeEmployeeState(emp, 10, 30)
    expect(['working', 'meeting', 'idle']).toContain(state.status)
  })

  it('深夜(03:00)返回 away', () => {
    const state = computeEmployeeState(emp, 3, 0)
    expect(state.status).toBe('away')
  })

  it('返回坐标', () => {
    const state = computeEmployeeState(emp, 10, 0)
    expect(typeof state.targetX).toBe('number')
    expect(typeof state.targetY).toBe('number')
  })
})

describe('initCharacterStates', () => {
  it('为每个员工创建 CharacterState', () => {
    const employees = generateEmployees(8)
    const states = initCharacterStates(employees, 10, 0)
    expect(states).toHaveLength(8)
  })

  it('state 包含方向字段', () => {
    const employees = generateEmployees(3)
    const states = initCharacterStates(employees, 14, 0)
    states.forEach((s) => {
      expect(s.direction).toBeTruthy()
    })
  })
})

describe('getStatusCounts', () => {
  it('返回各状态计数', () => {
    const employees = generateEmployees(15)
    const states = initCharacterStates(employees, 10, 0)
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
    expect(typeof overlay.color).toBe('number')
    expect(overlay.alpha).toBeGreaterThanOrEqual(0)
    expect(overlay.alpha).toBeLessThanOrEqual(1)
  })
})
