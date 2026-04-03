import { describe, it, expect } from 'vitest'
import { getEmployees, getEmployeeById, getEmployeesByDepartment, getDepartmentStats } from '../data/employees'

describe('employees mock data', () => {
  it('returns 30 employees', () => {
    const employees = getEmployees()
    expect(employees.length).toBe(30)
  })

  it('every employee has required fields', () => {
    for (const emp of getEmployees()) {
      expect(emp.name).toBeTruthy()
      expect(emp.department).toBeTruthy()
      expect(emp.role).toBeTruthy()
      expect(emp.stats.teaching).toBeGreaterThanOrEqual(1)
      expect(emp.stats.teaching).toBeLessThanOrEqual(100)
      expect(emp.skills.length).toBeGreaterThan(0)
    }
  })

  it('finds employee by id', () => {
    const emp = getEmployeeById(0)
    expect(emp).toBeDefined()
    expect(emp!.name).toBe('林博远')
  })

  it('returns undefined for missing id', () => {
    expect(getEmployeeById(999)).toBeUndefined()
  })

  it('filters by department', () => {
    const aiTeam = getEmployeesByDepartment('AI 研究院')
    expect(aiTeam.length).toBeGreaterThan(0)
    for (const emp of aiTeam) {
      expect(emp.department).toBe('AI 研究院')
    }
  })

  it('computes department stats', () => {
    const stats = getDepartmentStats()
    expect(stats.length).toBeGreaterThan(0)
    for (const dept of stats) {
      expect(dept.count).toBeGreaterThan(0)
      expect(dept.avgStats.teaching).toBeGreaterThanOrEqual(1)
    }
  })
})
