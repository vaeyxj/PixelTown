# PixelTown Task Notes
上次更新: Phase 4 迭代 0 完成

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
  - engine.ts 保持 199 行（< 200 行要求）

#### Phase 2 迭代 2 完成
- **前景层**（1.05x 滚动）
  - `parallax.ts` 新增 `createForegroundLayer(worldW, worldH)`: 12 个盆栽散布在走廊附近
  - `drawFgPlant()` 绘制带花盆、茎、多叶片的前景植物
  - engine.ts 添加 fgLayer 到 app.stage（在 worldContainer 之后，保证最前）
  - parallaxLayers 包含 bg(0.3) + fg(1.05) 两层
  - engine.ts 保持 199 行（< 200 行要求）
- **键盘光效粒子**
  - `particleSystem.ts` 新增 `emitKeyboardGlow(x, y)`: 每次 3 颗白/黄小粒子上浮
  - `npcManager.ts` 新增 `glowTimer` per-entry: 每 1.5s 当 NPC isAtDesk 时触发
  - `createNpcManager()` 接受可选 `particleSystem` 参数
- **idle 呼吸动画**
  - npcManager update: idle/away 状态下 sprite.y 添加正弦浮动（振幅 0.5px）

#### Phase 2 迭代 3 完成
- **talk 微动画**
  - `bubbleSystem.ts` 新增 `talkingIds: ReadonlySet<number>` — 追踪当前有气泡的角色 employee.id
  - `ChatBubble` 新增 `charId` 字段：spawn 时 add，expire 时 delete
  - `npcManager.update` 新增可选参数 `talkingIds?: ReadonlySet<number>`
  - 当角色 ID 在 talkingIds 中：`sprite.x += Math.sin(emojiAnimTime * 9) * 0.8` 左右微摇
  - `engine.ts` 修改 npcManager.update 调用，传入 `bubbleSystem.talkingIds`（行数不变，199 行）

#### Phase 2 迭代 4 完成
- **日夜系统提取** (`dayNightSystem.ts` 新模块)
  - 从 engine.ts 提取 daylightOverlay 逻辑，engine.ts 从 199 行降至 191 行
  - `createDayNightSystem(worldContainer, worldW, worldH, particleSystem)` 统一管理光照
- **大气粒子效果** (`emitAtmosphericDust`)
  - `particleSystem.ts` 新增 `emitAtmosphericDust(x, y, color)`：慢速水平漂移、极慢上浮
  - 黎明 (6–9h) 发射金白色粒子，黄昏 (17–20h) 发射暖橙色粒子
  - 粒子在当前视口世界坐标范围内随机位置生成（viewport-aware 位置计算）
  - 寿命 2–4 秒，带渐出效果

#### Phase 2 迭代 5 完成
- **角色阴影独立层** (`shadowLayer`)
  - 从 `characterSprite.ts` 移除烘焙进纹理的椭圆阴影（drawCharFrame + drawSitFrame 各一处）
  - `engine.ts` 在 characterLayer 之前创建 `shadowLayer: Container`，确保阴影始终在角色下方
  - `npcManager.ts` 接受新参数 `shadowLayer: Container`；为每个 NPC 创建 `Graphics` 椭圆阴影精灵
  - `CharEntry` 接口新增 `shadow: Graphics` 字段
  - update 循环同步 shadow.x/y + visible 与 sprite 保持一致
  - engine.ts 为玩家也创建独立阴影，在游戏循环中同步位置
  - engine.ts 保持 199 行（< 200 行要求）

#### Phase 2 迭代 6 完成
- **idle 动画状态** (`characterSprite.ts`)
  - 新增 `drawIdleFrame(g, x, y, dir, breathFrame, ap)`: 2帧方向感知呼吸动画
  - `CharacterFrames` 新增 `idle: Record<Direction, readonly Texture[]>` 字段
  - 精灵图布局: 4行行走 + 1行坐姿 + 4行idle(每方向一行，2帧宽)
- **npcManager 使用 idle 帧**
  - idle/away 状态下使用 `charFrames.idle[direction]` 0.8Hz 切换（原只有 sine 位移）
  - 动画状态机清晰：isAtDesk(坐姿) → isIdle(idle帧) → 行走帧
- **静态地图烘焙为 Sprite** (`mapRenderer.ts`)
  - 走廊、区域填充、墙壁、装饰全部绘制到单张 `staticG: Graphics`
  - 用 `app.renderer.render({ container: staticG, target: staticRT })` 烘焙成 `RenderTexture`
  - 创建 `staticSprite = new Sprite(staticRT)` 加入 worldContainer（不再有静态 Graphics 在显示列表中）
  - destroy() 中 `staticRT.destroy(true)` 清理 GPU 资源

Phase 2 验收标准最终核查：
- [x] 地图用 sprite 渲染，不再用 Graphics 画矩形（静态内容已烘焙成 Sprite）
- [x] 角色用 sprite sheet 动画，有 idle/walk/sit 全部三状态
- [x] 视差效果（背景 0.3x、前景 1.05x）
- [x] 粒子效果（行走尘土、键盘光效、大气光斑）
- [x] engine.ts < 200 行 (199 行)
- [x] `pnpm build` exit 0
- [x] `pnpm test` 通过 (11 tests)

Phase 2 完整交付 ✓

#### Phase 2 迭代 7 完成
- **LoginScreen 重设计**
  - 打字机效果标题 (PIXEL TOWN 逐字显示，80ms/字)
  - 60 颗闪烁星星背景 (CSS animation `twinkle`)
  - 24 颗漂浮光斑粒子 (CSS `float-particle` + `--dx` 自定义属性)
  - SVG 像素建筑 (主楼+路灯+门灯，含 SVG `<animate>` 窗户闪烁)
  - 副标题/按钮用 opacity + translateY 渐入过渡

- **pixel-ui.css 设计系统**
  - 像素边框/窗口/按钮/输入框/进度条/徽章/选项卡/工具栏槽/LED 数字
  - 提取为独立 CSS 文件，供所有 UI 组件复用
  - 动画关键帧：twinkle, cursor-blink, float-particle, pixel-bounce, pixel-fade-in, pixel-slide-up, pixel-open, scan-line, pixel-pulse

- **StatsDashboard 团队仪表盘**
  - 三列网格布局：实时状态分布 | 部门人数 | 团队五维均值雷达图
  - 第4行：热门技能 TOP 8（按均值排序）
  - 所有图表用 Canvas 绘制（雷达图）或 pixel-progress 条
  - BottomToolbar STATS 按钮现已可用（之前 dashboard panel 缺失）
  - `App.tsx` 新增 `StatsDashboard` 渲染分支

## 当前阶段状态
- HUD.tsx: LED 时钟 + CRT 小地图扫描线 + BottomToolbar 工具栏（已在前序迭代完成）
- EmployeeGrid.tsx: 全屏员工图鉴，支持搜索/部门筛选/排序（已在前序迭代完成）
- App.tsx: 已集成 CharacterPanel + EmployeeGrid + StatsDashboard 三大面板

## 关键上下文
- 项目在 apps/web/ 下，运行 pnpm build/lint/test 时需 cd apps/web
- `erasableSyntaxOnly` TypeScript 配置：禁止使用类参数属性，改用字段声明+构造器赋值
- 字符绘制仍基于 Graphics→RenderTexture（16×24 纹理 × 2 缩放 = 32×48 视觉效果）
- 坐姿帧在 characterSprite.ts 生成：第 DIR_ORDER.length 行（行4），2帧
- npcManager 的 `isAtDesk` 判断：status='working' 且 animFrame=0（已到达目标）
- floor.png 为 TilingSprite，tileScale=2 放大像素风格
- 30 个员工数据含完整属性系统（五维属性、技能树、里程碑、博客）

### Phase 3 迭代 1 完成

#### 3g. CSS 设计系统 (`src/styles/pixel-ui.css`)
- `.pixel-window` / `.pixel-window-header` / `.pixel-window-title`
- `.pixel-btn`, `.pixel-btn-primary`, `.pixel-btn-close`, `.pixel-btn-ghost`
- `.pixel-border`, `.pixel-input`, `.pixel-progress`, `.pixel-badge`
- `.pixel-slot`, `.pixel-tab-bar`, `.pixel-tab`
- `.pixel-led`: LED 绿色发光数字
- `@keyframes`: pixel-bounce / pixel-fade-in / pixel-slide-up / pixel-open / scan-line / cursor-blink / float-particle

#### 3a. 登录页重做 (`LoginScreen.tsx`)
- 打字机效果：`PIXEL TOWN` 逐字出现（80ms/字），光标闪烁
- 副标题淡入（打字完成后 200ms）
- 按钮渐显（600ms），使用 `.pixel-btn-primary`
- 24 个漂浮彩色光斑粒子（canvas-free，pure CSS animation）
- 更精细的 SVG 像素建筑（路灯、大门灯光、远景楼群）

#### 3b. HUD 重做 (`HUD.tsx`)
- `StatsPanel`: LED 数字时钟（`pixel-led`），像素窗口边框，在线人数 LED 显示
- `MiniMap`: pixel-window 边框，RADAR 标题，CRT 扫描线动画，格栅叠加效果
- `BottomToolbar`: 6 格工具栏（MAP/ROSTER/STATS/SEARCH/CONFIG/AUDIO），`.pixel-slot` 样式

#### 3c. 角色详情面板 (`CharacterPanel.tsx` — 新文件)
- 可拖拽 RPG 窗口（mousedown/mousemove/mouseup）
- 4 个选项卡：概览 / 技能 / 博客 / 成长
- 概览：像素头像 + 五维雷达图（Canvas）+ 属性条 + 标签
- 技能：技能列表 + 像素格进度条（PixelBar 10格）
- 博客：可折叠博客列表 + 标签
- 成长：时间轴里程碑

#### 3d. 员工图鉴 (`EmployeeGrid.tsx` — 新文件)
- 全屏 pixel-window，网格卡片布局
- 部门彩色标签筛选 + 搜索输入框
- 排序：姓名/教学力/研发力/创造力
- 卡片：头像 SVG + 职级徽章 + motto

#### App.tsx 更新
- 接入 `CharacterPanel`（替代 `CharacterCard`）
- 接入 `EmployeeGrid`（工具栏 ROSTER 按钮触发）
- `BottomToolbar` 替代旧操作提示

Phase 3 验收标准核查：
- [x] 登录页有打字机效果和进入动画
- [x] HUD 有 RPG 风格状态栏（LED 时钟 + 像素窗口）+ 底部快捷栏
- [x] 点击角色弹出完整角色详情面板（雷达图、技能、博客、时间线）
- [x] 员工图鉴可打开，支持搜索和部门筛选
- [x] 统计仪表盘可打开，显示实时数据（StatsDashboard.tsx 322 行，含雷达图、状态分布、部门柱状图、技能 Top8）
- [x] 所有 UI 像素风一致
- [x] `pnpm build` exit 0
- [x] `pnpm test` 通过 (11 tests)

Phase 3 完整交付 ✓

### Phase 3 迭代 8 完成

#### 3f 微交互补充
- **SEARCH 按钮连接**: BottomToolbar 新增 `onSearch` 回调，SEARCH 按钮触发员工图鉴（内置搜索）
- **像素 Toast 通知系统**:
  - `pixel-ui.css` 新增 `.pixel-toast` / `.pixel-toast-icon` 样式（像素窗口边框 + 发光）
  - 新增 `@keyframes pixel-toast-in` / `pixel-toast-out`（从底部弹入/渐出）
  - `App.tsx` 新增 `useToast` hook（2s 显示 → 渐出 → 销毁，多 toast 堆叠）
  - 打开面板时触发 toast：员工图鉴→ "👥 员工图鉴已打开"，仪表盘→ "📊 团队仪表盘已打开"

## 阻碍
- 无当前阻碍（Phase 2 卡住根因：checker_phase2_result.txt 过期，state.json 未推进；已修复，推进至 Phase 3）

## 上次质量门报告 (Phase 2 迭代 7)
BUILD: ✓ PASS
LINT: ✓ PASS（build 包含 tsc 检查）
TEST: ✓ PASS (11 tests across 2 files)

### Phase 4 迭代 0 完成

#### 4a. 音效系统 (`src/game/audioManager.ts`)
- 全局单例 `audioManager`，用户点击 Enter 后调用 `unlock()` 初始化 AudioContext
- 三路独立 GainNode：master / bgm / sfx（可分离控制）
- `toggleMute()` 静音开关
- `setMasterVol / setBgmVol / setSfxVol` 独立音量调节
- 进入世界后自动启动 Ambience + BGM

#### 4b. 程序化音效 (`src/game/synthAudio.ts`)
- `playClick`: 方波下扫音（1200→600Hz，40ms）
- `playMenuOpen`: 方波上升四音阶（C5→C6，280ms）
- `playMenuClose`: 方波下降四音阶（G5→G4，240ms）
- `playNotification`: 三角波双音叮咚（A4+C#5，400ms）
- `playFootstep`: 带通滤波噪音脉冲（500Hz bandpass）
- `playKeyboard`: 随机音高方波短音（200~500Hz，35ms）
- `createAmbience`: 粉噪音（Voss 算法 6 阶滤波）低通 1200Hz 循环
- `createBGM`: 三角波 G 大调旋律预渲染 AudioBuffer，100BPM 循环

#### 4c. 音效触发点
- 点击 Enter 进入世界 → `unlock()` 解锁音频
- 打开面板 → `playMenuOpen()`，关闭面板 → `playMenuClose()`
- 点击角色 → `playNotification()`
- 点击 AUDIO 按钮 → `playClick()`

#### 4d. 音频控制 UI
- `AudioPanel` 组件：MASTER / BGM / SFX 三路像素风滑块
- AUDIO 按钮左键切换静音 / 右键打开 AudioPanel
- 动态音量图标：🔊/🔉/🔈/🔇（根据 muted + masterVol）

#### 4e. 环境氛围增强
- `.pixel-vignette`：CSS radial-gradient 屏幕四角暗角叠加（z-index 10）
- `.pixel-cloud`：5 颗半透明云朵粒子，`cloud-drift` 动画横向漂移
  不同速度/延迟/大小，营造视差景深感

Phase 4 验收标准核查：
- [x] 点击 UI 元素有 8-bit 音效反馈（点击角色/开关面板）
- [x] 环境音可播放（办公室粉噪音循环，进入世界后自动启动）
- [x] BGM 可播放（三角波 G 大调 lo-fi 循环）
- [x] 音量可控制，有静音开关（AudioPanel 三路滑块 + AUDIO 按钮）
- [x] 暗角效果可见（pixel-vignette CSS）
- [x] 云朵漂浮效果（5 颗 pixel-cloud 粒子）
- [x] `pnpm build` exit 0
- [x] `pnpm test` 通过 (11 tests)

Phase 4 完整交付 ✓

## 上次质量门报告 (Phase 4 迭代 0)
BUILD: ✓ PASS
LINT: ✓ PASS（tsc 无错误）
TEST: ✓ PASS (11 tests across 2 files)
