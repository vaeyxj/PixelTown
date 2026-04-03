# PixelTown - 像素办公世界

AI 教育公司的像素风数字办公世界，展示公司员工的真实活动。

## Tech Stack
- React 19 + TypeScript 5.9 + Vite 8
- PixiJS 8 (2D WebGL rendering)
- Vitest (unit tests) + Playwright (E2E)
- pnpm monorepo: `apps/web/`

## Commands
```bash
cd apps/web
pnpm dev          # 开发服务器
pnpm build        # 构建 (tsc + vite)
pnpm lint         # ESLint
pnpm test         # Vitest 单元测试
pnpm test:e2e     # Playwright E2E
```

## Architecture
- `src/game/` — 游戏引擎（地图、角色、模拟、渲染）
- `src/components/` — React UI 组件（HUD、登录、面板）
- `src/data/` — Mock 数据（员工、技能、属性）
- `public/` — 静态资源（瓦片、精灵图、音效）

## Conventions
- 中文注释 OK
- 像素风 RPG 视觉风格
- 所有数据 mock，无后端
- 不写兼容代码
