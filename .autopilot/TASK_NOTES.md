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

### Phase 1 ✓ (迭代 0 完成)
- 用 /draw (gemini-2.5-flash-image) 生成 8 张真实像素风美术资源替换占位 PNG
  - tiles/floor.png: 4×4 暖色系地板瓦片（木地板、地毯、瓷砖、走廊）
  - tiles/wall.png: 砖墙、木门、窗户瓦片
  - tiles/furniture.png: 桌椅、显示器、白板、书架、服务器机架
  - tiles/decor.png: 盆栽、咖啡机、AI海报、代码屏幕
  - sprites/character_male.png: 16帧男性角色 sprite sheet（4方向行走+坐姿）
  - sprites/character_female.png: 16帧女性角色 sprite sheet（4方向行走+坐姿+打字）
  - ui/panel.png: RPG 风格对话框、按钮、状态栏
  - backgrounds/login.png: 像素风夜景办公楼城市天际线

## 当前阶段剩余工作

Phase 1: **验收标准全部满足 ✓**

后续可做的提升（非必要）：
- 将大图 sprite sheet 裁切为独立帧文件（用 scripts/slice-spritesheet.ts）
- 将 spriteLoader 集成到游戏渲染主循环（Phase 2 范畴）
- 验证 spriteLoader 在浏览器运行时能正确加载资源

## 关键上下文
- 项目在 apps/web/ 下，运行 pnpm build/lint/test 时需 cd apps/web
- `erasableSyntaxOnly` TypeScript 配置：禁止使用类参数属性（`private readonly param`），改用字段声明+构造器赋值
- 生成图片用 gemini-2.5-flash-image（香蕉），gemini-3-pro-image-preview（香蕉pro）超时
- spriteLoader 用 Promise.allSettled 预加载，即使文件缺失也不会崩溃
- 30 个员工数据含完整属性系统（五维属性、技能树、里程碑、博客）

## 阻碍
- 无当前阻碍

## 上次质量门报告 (Phase 1 迭代 0)
BUILD: ✓ PASS
LINT: ✓ PASS
TEST: ✓ PASS (17 tests across 2 files)
