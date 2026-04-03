# Phase 0: 基础建设

你正在开发 PixelTown — 一个 AI 教育公司的像素风数字办公世界。
项目根目录: /Users/yuxijian/claudeProjects/PixelTown
源码: apps/web/src/
技术栈: React 19 + PixiJS 8 + TypeScript + Vite + pnpm

## 上下文
读取 .autopilot/TASK_NOTES.md 了解之前的进展（如果存在）。

## 目标
修复构建错误，建立测试基础设施，确保开发流程畅通。

## 任务（按顺序执行）

1. **修复 TypeScript 编译错误**（如果尚未修复）:
   - `src/game/pixelSprites.ts` 第 322 行附近: 未使用参数 `text`
   - `src/game/simulation.ts` 第 98 行附近: 未使用参数 `total`
   - 用下划线前缀处理

2. **安装 Vitest 并配置**（如果尚未配置）:
   - 安装 vitest, @testing-library/react, jsdom 为 devDependencies
   - 创建 vitest.config.ts（environment: jsdom）
   - 在 package.json 添加 `"test": "vitest run"` 脚本

3. **创建 Mock 数据系统**（如果 src/data/employees.ts 不存在）:
   - 创建 `src/data/employees.ts`
   - 30 个 AI 教育公司员工（讲师、课程设计、AI 研究员、工程师、产品、设计、运营、市场）
   - 每人包含：id, name, englishName, department, role, level, avatarSeed, bio, motto, joinDate
   - 五维属性: stats: { teaching, research, creativity, influence, teamwork } (1-100)
   - 技能列表: skills: Array<{ name, level(1-10), icon, category }>
   - 成长记录: milestones: Array<{ date, title, description, icon }>
   - 博客列表: blogs: Array<{ title, date, summary, tags }>
   - 导出查询函数: getEmployees, getEmployeeById, getEmployeesByDepartment, getDepartmentStats

4. **编写单元测试**:
   - `src/__tests__/employees.test.ts`: 测试 mock 数据完整性和查询函数
   - `src/__tests__/simulation.test.ts`: 测试 generateEmployees 和 computeEmployeeState

5. **创建 CLAUDE.md** 在项目根目录（如果不存在）

6. **验证所有质量门**:
   ```bash
   cd apps/web && pnpm build && pnpm lint && pnpm test
   ```
   所有命令必须 exit 0。

## 规则
- 每完成一个有意义的改动就 commit
- commit 消息格式: `feat(phase-0): 描述`
- 更新 .autopilot/TASK_NOTES.md：记录完成的内容、剩余工作、关键上下文
- 不要修改 .autopilot/ 下除 TASK_NOTES.md 以外的文件

## 验收标准
- [ ] `pnpm build` exit 0
- [ ] `pnpm lint` exit 0（允许警告但不允许错误）
- [ ] `pnpm test` 至少 5 个测试用例全部通过
- [ ] src/data/employees.ts 包含 30 个完整的员工档案
- [ ] CLAUDE.md 存在
