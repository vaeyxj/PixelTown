import { describe, it, expect } from 'vitest'
import { getEmployeeById, getEmployeesByDepartment, getDepartmentStats } from '../data/employees'

describe('employees mock data', () => {
  it('finds employee by id', () => {
    const emp = getEmployeeById(0)
    expect(emp).toBeDefined()
    expect(emp!.name).toBe('林博远')
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
