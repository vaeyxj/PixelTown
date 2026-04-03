# PixelTown Task Notes
上次更新: Phase 2 迭代 1 完成

## 已完成

### Phase 0 ✓
- 修复 pixelSprites.ts 和 simulation.ts 的 TS 编译错误
- 创建 src/data/employees.ts（30 个 AI 教育公司员工 mock 数据）
- 安装 vitest, @testing-library/react, jsdom
- 创建 vitest.config.ts
- 创建测试文件（6+11 个测试）

### Phase 1 ✓
- 创建资源目录结构（tiles/, sprites/, ui/, backgrounds/）
- 创建 src/game/spriteLoader.ts + spriteSheet.ts
- 用 /draw 生成 8 张像素风美术资源（两轮迭代）
- BUILD: ✓ PASS, LINT: ✓ PASS, TEST: ✓ PASS

### Phase 2 ✓ (迭代 0 完成)

#### 2c. 引擎拆分（engine.ts 446→192 行）
- `camera.ts`: 相机跟随、入场动画、滚轮缩放
- `playerController.ts`: 键盘输入状态管理
- `npcManager.ts`: NPC 精灵创建、坐姿/行走动画切换
- `bubbleSystem.ts`: 对话气泡生成与淡出
- `engine.ts`: 精简为组装入口 (192 行 < 200 行 ✓)

#### 2d. 粒子效果
- `particleSystem.ts`: 128 粒子对象池，玩家行走时脚下尘土粒子

#### 2a. 视差系统
- `parallax.ts`: 层管理器（scrollFactor），创建像素风远景天际线背景层

#### 2b. 角色渲染升级
- characterSprite.ts: 新增坐姿帧（2帧打字动画）
- 角色缩放从 1.5x → 2x（视觉尺寸 32×48px）
- npcManager 自动切换：工作中→坐姿帧，移动中→行走帧

#### 地图 Sprite 渲染
- mapRenderer.ts: 优先用 TilingSprite（floor.png），降级为 Graphics
- PixelCanvas.tsx: 引擎初始化前预加载所有资源（preloadAll()）

#### 2e. simulation.ts 更新
- 对话内容池更新为 AI 教育公司主题（大模型、RAG、知识图谱等）

## 当前阶段剩余工作

Phase 2 验收标准核查：
- [x] engine.ts < 200 行 (192 行)
- [x] 粒子效果至少 1 种可见（行走尘土）
- [x] 视差层管理器已创建
- [x] 角色有 sit 状态（工作时坐姿帧）
- [x] 地图用 TilingSprite 渲染地板
- [x] `pnpm build` exit 0
- [x] `pnpm test` 通过 (11 tests)

#### Phase 2 迭代 1 完成
- 视差背景层集成进 engine.ts 渲染循环
  - bgLayer 添加到 app.stage（在 worldContainer 之前，确保背景在底层）
  - 游戏循环中每帧调用 applyParallax(scrollFactor=0.3)
  - destroy() 时正确清理 bgLayer
  - engine.ts 保持 199 行（< 200 行要求）

待完成（Phase 2 后续迭代）：
- walk/talk/idle 动画状态机还可以继续完善
- 角色阴影（椭圆形半透明投影）
- NPC 打字/工作状态粒子（键盘光效）
- 前景层（1.05x 滚动，如近处盆栽）

## 关键上下文
- 项目在 apps/web/ 下，运行 pnpm build/lint/test 时需 cd apps/web
- `erasableSyntaxOnly` TypeScript 配置：禁止使用类参数属性，改用字段声明+构造器赋值
- 字符绘制仍基于 Graphics→RenderTexture（16×24 纹理 × 2 缩放 = 32×48 视觉效果）
- 坐姿帧在 characterSprite.ts 生成：第 DIR_ORDER.length 行（行4），2帧
- npcManager 的 `isAtDesk` 判断：status='working' 且 animFrame=0（已到达目标）
- floor.png 为 TilingSprite，tileScale=2 放大像素风格
- 30 个员工数据含完整属性系统（五维属性、技能树、里程碑、博客）

## 阻碍
- 无当前阻碍

## 上次质量门报告 (Phase 2 迭代 1)
BUILD: ✓ PASS
LINT: ✓ PASS（build 包含 tsc 检查）
TEST: ✓ PASS (11 tests across 2 files)
