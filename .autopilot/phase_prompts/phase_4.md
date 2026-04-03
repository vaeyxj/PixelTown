# Phase 4: 音效 + 氛围系统

你正在开发 PixelTown — AI 教育公司像素风办公世界。
读取 CLAUDE.md 和 .autopilot/TASK_NOTES.md 了解上下文。

## 背景
渲染和 UI 已到位。现在要加入音效和环境氛围，让世界真正活起来。

## 任务

### 4a. 音效系统
- 安装 howler.js: `pnpm add howler` + `pnpm add -D @types/howler`
- 创建 `src/game/audioManager.ts`:
  - 全局单例，管理所有音效
  - 音量控制（主音量、音效音量、BGM 音量独立调节）
  - 静音开关
  - 支持淡入淡出

### 4b. 程序化生成音效
不下载音频文件，用 Web Audio API 程序化生成 8-bit 风格音效:
- 创建 `src/game/synthAudio.ts`:
  - `generateClickSound()`: 短促的 8-bit 点击音
  - `generateMenuOpen()`: 上升音阶（面板打开）
  - `generateMenuClose()`: 下降音阶（面板关闭）
  - `generateNotification()`: 叮咚提示音
  - `generateFootstep()`: 轻柔脚步声
  - `generateKeyboard()`: 键盘敲击声（随机音高变化）
  - `generateAmbience()`: 办公室白噪音循环（用 noise + 低通滤波）
  - `generateBGM()`: 简单的 8-bit lo-fi 循环旋律（用方波/三角波合成）
- 所有音效用 OscillatorNode + GainNode + BiquadFilterNode 合成
- 参考 8-bit 音乐风格：方波、三角波、噪声通道

### 4c. 音效触发点
- UI 交互: 按钮点击、面板打开/关闭、标签切换
- 角色交互: 点击角色时播放选中音效
- 环境音: 持续循环的办公室环境白噪音（低音量）
- 状态变化: 会议开始时的铃声提示、午休提示
- BGM: 8-bit lo-fi 背景音乐，日间/夜间切换

### 4d. 音频控制 UI
- 在 HUD 快捷栏的 🔊 音效格子中:
  - 点击切换静音/开启
  - 长按或右键打开音量调节面板
  - 像素风音量滑块（主音量、BGM、音效分离控制）
  - 显示当前音量状态图标（🔊/🔉/🔈/🔇）

### 4e. 环境氛围增强
- 窗外效果（叠加在视差背景上）:
  - 偶尔飘过的云朵粒子
  - 日落时的橙红色光晕
- 屏幕暗角效果（CSS radial-gradient 叠加）
- 远处物体微微模糊（用 alpha 降低远景对比度模拟景深）

## 规则
- 所有音效程序化生成，不需要下载任何音频文件
- 音效默认音量适中，不要太吵
- 用户首次交互后才启用音频（浏览器自动播放限制）
- commit 格式: `feat(phase-4): 描述`
- 更新 .autopilot/TASK_NOTES.md

## 验收标准
- [ ] 点击 UI 元素有 8-bit 音效反馈
- [ ] 环境音可播放（办公室白噪音）
- [ ] BGM 可播放（8-bit lo-fi 风格）
- [ ] 音量可控制，有静音开关
- [ ] 暗角效果可见
- [ ] `pnpm build` exit 0
- [ ] `pnpm test` 通过
