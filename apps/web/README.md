# PixelTown Web

像素风格企业数字世界前端，基于 PixiJS 渲染 D 区办公地图。

## 启动

```bash
cd apps/web
pnpm install
pnpm dev
```

访问 http://localhost:5173

## 技术栈

- React 19 + TypeScript
- Vite 8
- PixiJS v8（2D 渲染引擎）

## 目录结构

```
src/
├── components/        # React 组件
│   └── PixelCanvas.tsx   # PixiJS 画布容器
├── game/              # 游戏引擎层
│   ├── mapData.ts        # D区地图数据定义（区域、工位、会议室）
│   └── mapRenderer.ts    # PixiJS 地图渲染器
├── App.tsx
├── main.tsx
└── index.css
```

## 交互

- 滚轮：缩放（以鼠标位置为中心）
- 拖拽：平移地图
- 悬停：查看区域详情（名称、工位数）
