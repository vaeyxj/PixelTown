# Phase 2: 渲染引擎升级

你正在开发 PixelTown — AI 教育公司像素风办公世界。
读取 CLAUDE.md 和 .autopilot/TASK_NOTES.md 了解上下文。

## 背景
Phase 1 已生成美术资源和加载管线。现在要将 PixiJS Graphics 程序化绘制替换为 sprite-based 渲染，并加入视差和粒子效果，让世界更有立体感和生命力。

## 任务

### 2a. 地图渲染重构
- 重写 `mapRenderer.ts`：用 Sprite 替代 Graphics 绘制
- 地图分层渲染（从后到前）：
  1. 背景层（远景天际线，慢速滚动 0.3x）
  2. 地面层（地板瓦片，正常滚动 1.0x）
  3. 家具层（桌椅等，正常滚动 1.0x）
  4. 角色层（按 Y 轴排序，正常滚动 1.0x）
  5. 装饰前景层（略快滚动 1.05x，如近处盆栽）
  6. UI 叠加层（光影、粒子、天色遮罩）
- 创建 `src/game/parallax.ts`：视差层管理器
  - 每层有自己的滚动速率 scrollFactor
  - camera 移动时各层以不同速度滚动

### 2b. 角色渲染升级
- 重写 `characterSprite.ts`：用 sprite sheet 的 AnimatedSprite 替代 RenderTexture
- 角色尺寸从 16×24 升级到 32×48
- 新增动画状态机：
  - idle: 微微呼吸/摇晃动画（2帧循环）
  - walk: 4方向×4帧行走
  - sit: 坐在桌前（工作状态专用）
  - talk: 对话时的微动画
- 角色阴影：椭圆形半透明投影，随角色移动
- tint 系统：用 PixiJS tint 属性实现换装/配色

### 2c. 引擎重构
- 拆分 engine.ts（当前 446 行）为更小模块：
  - `src/game/camera.ts`: 相机控制（跟随、缩放、入场动画）
  - `src/game/playerController.ts`: 玩家输入和移动
  - `src/game/npcManager.ts`: NPC 生命周期管理
  - `src/game/bubbleSystem.ts`: 聊天气泡系统
  - `src/game/particleSystem.ts`: 粒子系统
- engine.ts 精简为组装和启动各系统的入口

### 2d. 粒子特效
创建 `src/game/particleSystem.ts`:
- 角色行走时脚下尘土粒子
- 打字/工作时键盘上微光粒子
- 日出日落时空气中的光斑粒子
- 粒子池复用，避免 GC 压力

### 2e. 更新 simulation.ts
- 将 Employee 接口与 EmployeeProfile (data/employees.ts) 关联
- NPC 使用 mock 数据中的真实姓名和部门
- 更新 CHAT_MESSAGES 使其与 AI 教育公司相关

## 规则
- 渐进替换：先替换一个系统确保可用，再替换下一个
- 每个模块完成后运行 `pnpm build` 确保不破坏
- commit 格式: `feat(phase-2): 描述`
- 更新 .autopilot/TASK_NOTES.md

## 验收标准
- [ ] 地图用 sprite 渲染，不再用 Graphics 画矩形
- [ ] 角色用 sprite sheet 动画，有 idle/walk/sit 状态
- [ ] 视差效果可见（背景层和前景层滚动速度不同）
- [ ] 粒子效果至少 1 种可见
- [ ] engine.ts < 200 行
- [ ] `pnpm build` exit 0
- [ ] `pnpm test` 通过
