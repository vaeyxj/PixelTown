# Phase 1: 美术资源生成 + 资源管线

你正在开发 PixelTown — AI 教育公司像素风办公世界。
项目根目录: /Users/yuxijian/claudeProjects/PixelTown
读取 CLAUDE.md 了解项目，读取 .autopilot/TASK_NOTES.md 了解之前进展。

## 背景
当前所有视觉都是 PixiJS Graphics API 程序化绘制的，角色 16×24px 色块，地图是平面矩形。
目标是升级到精致的像素风 sprite-based 渲染，但这个阶段先准备美术资源和加载管线。

## 重要：使用 /draw 生成美术资源

你可以用 `/draw` 技能生成像素风图片。统一提示词风格前缀:
```
"16-bit pixel art, top-down RPG style, warm office color palette, 
 soft lighting, consistent art style, game asset sprite sheet, 
 transparent or solid color background, {具体内容描述}"
```

参数选项:
- `--ratio 1:1` 正方形图（瓦片/sprite sheet 首选）
- `--ratio 16:9` 宽幅图（背景图首选）
- `--model 香蕉pro` 最高质量
- `--size 2k` 更大分辨率

## 任务

### 1a. 生成瓦片地图资源（每张用 /draw 单独生成）
生成以下图片，保存后移动到 `apps/web/public/tiles/`:
- 地板瓦片：木地板、地毯、瓷砖、走廊石板（提示词示例: "16-bit pixel art tileset, top-down view, office floor tiles including wooden planks, carpet, ceramic tiles, stone corridor, 4x4 grid layout, warm tones, game asset"）
- 墙壁和门瓦片
- 办公家具俯视图：桌椅、显示器、白板、投影仪、书架、服务器机架
- 装饰物：盆栽、饮水机、咖啡机、AI 主题海报、代码屏幕

### 1b. 生成角色资源
- 男性角色 sprite sheet：站立(4方向) + 行走(4方向×4帧) + 坐姿 + 打字姿态
  提示词参考: "16-bit pixel art character sprite sheet, office worker male, top-down RPG style, 4 directions (down/up/left/right), walk cycle 4 frames each direction, sitting pose, typing pose, 32x48 pixel per frame, warm palette"
- 女性角色 sprite sheet：同上
- 角色应为 32×48px 尺寸（比当前 16×24 翻倍）

### 1c. 生成 UI 资源
- 像素风 UI 边框和面板（RPG 风格对话框、菜单边框、按钮）
- 像素风图标集（技能图标、属性图标、状态图标）

### 1d. 生成登录页背景
- 像素风办公楼全景（16:9 比例）：夜景中的发光办公楼，像素风城市天际线

### 2. 建立资源加载管线
创建以下文件:
- `src/game/spriteLoader.ts`: 统一资源加载器
  - loadTileset(path) → 返回切割好的瓦片 Texture 数组
  - loadSpriteSheet(path, frameWidth, frameHeight) → 返回帧 Texture 数组
  - preloadAll() → 预加载所有游戏资源
- `src/game/spriteSheet.ts`: Sprite Sheet 管理
  - 从大图裁切为动画帧
  - 支持按方向/状态索引帧

### 3. 资源裁切脚本
创建 `scripts/slice-spritesheet.ts`:
- 用 sharp (npm 包) 将大图自动裁切为指定尺寸的小图
- 输入: 图片路径、帧宽、帧高
- 输出: 独立的帧图片文件

### 4. 确保资源目录结构
```
apps/web/public/
├── tiles/          # 瓦片资源
├── sprites/        # 角色 sprite sheets
├── ui/             # UI 元素
├── backgrounds/    # 背景图
└── audio/          # 音效（后续阶段）
```

## 规则
- 每生成一批资源就 commit
- 如果 /draw 生成的图不理想，调整提示词重新生成
- 确保所有生成的图片色调一致（暖色系办公室风格）
- commit 格式: `feat(phase-1): 描述`
- 更新 .autopilot/TASK_NOTES.md

## 验收标准
- [ ] public/tiles/ 至少有 4 张瓦片图
- [ ] public/sprites/ 至少有 2 张角色 sprite sheet（男/女）
- [ ] public/ui/ 至少有 1 张 UI 边框图
- [ ] public/backgrounds/ 至少有 1 张登录页背景
- [ ] src/game/spriteLoader.ts 存在且可加载资源
- [ ] src/game/spriteSheet.ts 存在且可裁切帧
- [ ] `pnpm build` exit 0
