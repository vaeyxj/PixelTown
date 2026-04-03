# Phase 5: 终极打磨 + 移动端 + 部署

你正在开发 PixelTown — AI 教育公司像素风办公世界。
读取 CLAUDE.md 和 .autopilot/TASK_NOTES.md 了解上下文。

## 背景
前 5 个阶段已完成核心功能：sprite 渲染、视差、RPG 风格 UI、音效。
现在做最终打磨，达到商业发布水准。

## 任务

### 5a. 移动端适配
- 触控操作：虚拟摇杆（左下角半透明摇杆组件）或 tap-to-move
- 响应式 UI：
  - 底部快捷栏在移动端变为 4 格（合并部分功能）
  - 面板在移动端全屏显示（非弹出窗口）
  - 角色详情面板改为滑动标签页布局
- 适配 viewport meta 标签
- 处理移动端触摸事件（禁止双指缩放页面，改为游戏内缩放）

### 5b. 性能优化
- 视口裁剪：只渲染可见区域的 sprite（检查是否在 camera 视口内）
- 纹理图集：合并小图为图集减少 draw call
- 对象池：复用粒子对象、气泡对象
- requestAnimationFrame 帧率监控：如果持续低于 30fps 自动降低粒子数量
- 懒加载：大资源异步加载

### 5c. Loading 屏
- 全屏像素风 Loading 页面:
  - 像素进度条（分段填充，不是平滑的）
  - 底部趣味提示文字（随机轮换）：
    - "正在部署像素工位..."
    - "AI 讲师正在备课..."
    - "研究员正在调参..."
    - "设计师正在选色..."
  - 加载完成后自动进入登录页

### 5d. PWA 配置
- 创建 `public/manifest.json`:
  - name: "PixelTown - AI教育像素办公世界"
  - 图标（用 /draw 生成像素风 App 图标）
  - theme_color 和 background_color
  - display: standalone
- 注册 service worker（基础缓存策略）
- 在 index.html 添加 manifest link 和 meta 标签

### 5e. SEO + Meta
- 添加 Open Graph meta 标签
- 添加 description meta
- 添加 favicon（像素风格小图标）
- 页面标题: "PixelTown | AI教育公司的像素办公世界"

### 5f. 代码清理
- 删除所有 console.log
- 删除未使用的导入
- 确保没有 any 类型（TypeScript strict）
- 删除注释掉的代码
- 确保文件都在 400 行以内（超过的拆分）

### 5g. 最终验证
运行全部质量门并记录结果:
```bash
pnpm build
pnpm lint
pnpm test
```

## 规则
- 这是最后一个阶段，要确保一切完美
- 不要引入新功能，只做打磨和优化
- commit 格式: `feat(phase-5): 描述`
- 最后一个 commit 消息: `release: PixelTown v1.0 - 商业交付版`
- 更新 .autopilot/TASK_NOTES.md 写最终总结

## 验收标准
- [ ] 移动端可操作（虚拟摇杆或 tap-to-move）
- [ ] 移动端 UI 响应式适配
- [ ] Loading 屏有进度条和趣味文字
- [ ] PWA manifest 和 service worker 就位
- [ ] `pnpm build` exit 0 且无警告
- [ ] `pnpm lint` exit 0
- [ ] `pnpm test` 全部通过
- [ ] 无 console.log 残留
- [ ] 所有文件 < 400 行
