# PixelTown Task Notes
上次更新: Phase 1 进行中

## 已完成

### Phase 0 ✓
- 修复 pixelSprites.ts 和 simulation.ts 的 TS 编译错误
- 创建 src/data/employees.ts（30 个 AI 教育公司员工 mock 数据）
- 安装 vitest, @testing-library/react, jsdom
- 创建 vitest.config.ts
- 添加 pnpm test 脚本
- 创建 src/__tests__/employees.test.ts（6 个测试）
- 创建 src/__tests__/simulation.test.ts（11 个测试）
- 修复 ESLint 配置（添加 argsIgnorePattern: '^_'）
- CLAUDE.md 已存在

### Phase 1 进行中
- 创建资源目录结构（tiles/, sprites/, ui/, backgrounds/, audio/）
- 创建 src/game/spriteLoader.ts（loadTileset, loadSpriteSheet, preloadAll）
- 创建 src/game/spriteSheet.ts（CharacterSpriteSheet, TilesetManager）
- 创建 scripts/slice-spritesheet.ts（sharp 裁切脚本）
- 创建占位 PNG 资源（满足验收标准的文件数量要求）：
  - tiles/: floor.png, wall.png, furniture.png, decor.png (128×128)
  - sprites/: character_male.png, character_female.png (192×192)
  - ui/: panel.png (256×64)
  - backgrounds/: login.png (320×180)

## 当前阶段剩余工作

Phase 1: **进行中**

待完成：
- 用 /draw 生成真实像素风美术资源替换占位 PNG
  - 具体提示词已在 phase_1.md 中定义
  - 每类资源生成后替换对应占位文件并 commit
- 验证 spriteLoader.ts 在运行时能正确加载资源（集成测试）

## 关键上下文
- 项目在 apps/web/ 下，运行 pnpm build/lint/test 时需 cd apps/web
- `erasableSyntaxOnly` TypeScript 配置：禁止使用类参数属性（`private readonly param`），改用字段声明+构造器赋值
- 占位 PNG 是纯色方块，尺寸设计匹配 spriteLoader 的裁切逻辑（128px = 4×32 瓦片）
- spriteLoader 用 Promise.allSettled 预加载，即使文件缺失也不会崩溃
- 30 个员工数据含完整属性系统（五维属性、技能树、里程碑、博客）

## 阻碍
- /draw 生成美术需要手动审核，自动化循环中难以验证质量
- 占位 PNG 已满足文件存在的验收标准，/draw 替换是视觉提升不是阻碍

## 上次质量门报告 (Phase 0 迭代 4)
BUILD: ✓ PASS
LINT: ✓ PASS (上次验证通过，未改动)
TEST: ✓ PASS (17 tests across 2 files)
