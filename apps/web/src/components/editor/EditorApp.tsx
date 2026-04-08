/**
 * 场景编辑器主入口组件
 * 管理编辑器状态，挂载 PixiJS 视口，提供工具栏和面板
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { Application } from 'pixi.js'
import { loadTilesetFromBlob, type LoadedScene } from '../../game/editor/sceneLoader'
import type { SceneData } from '../../game/editor/types'
import { EditorViewport } from '../../game/editor/EditorViewport'
import { EditorState } from '../../game/editor/EditorState'
import { PanTool } from '../../game/editor/tools/PanTool'
import { SelectTool } from '../../game/editor/tools/SelectTool'
import { TileBrushTool, TileEraserTool, TileFillTool } from '../../game/editor/tools/TileBrushTool'
import { CollisionBrushTool } from '../../game/editor/tools/CollisionBrushTool'
import { ObjectPlaceTool } from '../../game/editor/tools/ObjectPlaceTool'
import { ZoneTool } from '../../game/editor/tools/ZoneTool'
import { RectBrushTool } from '../../game/editor/tools/RectBrushTool'
import { LineTool } from '../../game/editor/tools/LineTool'
import { EditorHistory } from '../../game/editor/history'
import type { SceneObject, TilesetDef, ZoneData } from '../../game/editor/types'
import { LayerPanel } from './LayerPanel'
import { TilesetPanel } from './TilesetPanel'
import { PropertyPanel } from './PropertyPanel'
import { AssetBrowser } from './AssetBrowser'
import { ZonePanel } from './ZonePanel'
import { AnimationEditor } from './AnimationEditor'

type ToolType = 'select' | 'pan' | 'brush' | 'eraser' | 'fill' | 'rect' | 'line' | 'collision' | 'object' | 'zone'

/** 工具所需的图层类型，null 表示通用 */
const TOOL_LAYER_TYPE: Record<ToolType, 'tile' | 'collision' | 'object' | null> = {
  select: null,
  pan: null,
  brush: 'tile',
  eraser: 'tile',
  fill: 'tile',
  rect: 'tile',
  line: 'tile',
  collision: 'collision',
  object: 'object',
  zone: null,
}

/** 图层类型对应的默认工具 */
const LAYER_DEFAULT_TOOL: Record<string, ToolType> = {
  tile: 'brush',
  collision: 'collision',
  object: 'select',
}

interface EditorAppProps {
  readonly onExit: () => void
}

export function EditorApp({ onExit }: EditorAppProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<EditorViewport | null>(null)
  const appRef = useRef<Application | null>(null)
  const editorStateRef = useRef<EditorState | null>(null)
  const historyRef = useRef<EditorHistory>(new EditorHistory())
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const sceneRef = useRef<LoadedScene | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(200)
  const isDraggingRef = useRef(false)
  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [selectedObject, setSelectedObject] = useState<SceneObject | null>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null)
  const [showAnimEditor, setShowAnimEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)
  // 用 state 暴露给 render，ref 暴露给 callbacks
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [scene, setScene] = useState<LoadedScene | null>(null)

  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  // 创建工具实例（在事件回调中调用，可以读 ref）
  const createTool = useCallback((toolType: ToolType) => {
    const vp = viewportRef.current
    const es = editorStateRef.current
    const sc = sceneRef.current
    if (!vp || !es) return

    switch (toolType) {
      case 'pan':
        vp.setTool(new PanTool((dx, dy) => vp.pan(dx, dy)))
        break
      case 'select':
        vp.setTool(new SelectTool({
          getObjects: () => {
            return es.layers.filter(l => l.type === 'object').flatMap(l => l.type === 'object' ? l.objects : [])
          },
          onSelect: (obj) => setSelectedObject(obj),
          onTransform: () => {},
        }))
        break
      case 'brush':
        if (sc) vp.setTool(new TileBrushTool(es, sc))
        break
      case 'eraser':
        vp.setTool(new TileEraserTool(es))
        break
      case 'fill':
        vp.setTool(new TileFillTool(es))
        break
      case 'rect':
        if (sc) vp.setTool(new RectBrushTool(es, sc))
        break
      case 'line':
        if (sc) vp.setTool(new LineTool(es, sc))
        break
      case 'collision':
        vp.setTool(new CollisionBrushTool(es))
        break
      case 'object':
        if (sc) vp.setTool(new ObjectPlaceTool(es, sc))
        break
      case 'zone':
        vp.setTool(new ZoneTool(es, {
          onSelectZone: (z) => setSelectedZone(z),
          onZoneCreated: (z) => setSelectedZone(z),
        }))
        break
    }
  }, [])

  /** 切换工具 + 自动切到对应图层类型 */
  const switchTool = useCallback((toolType: ToolType) => {
    const es = editorStateRef.current
    if (es) {
      const requiredType = TOOL_LAYER_TYPE[toolType]
      if (requiredType && es.activeLayer?.type !== requiredType) {
        const idx = es.layers.findIndex(l => l.type === requiredType)
        if (idx >= 0) {
          es.setActiveLayer(idx)
        } else if (requiredType === 'tile') {
          // 自动创建 tile 图层
          es.addTileLayer('tile_1')
          es.setActiveLayer(es.layers.length - 1)
        } else if (requiredType === 'collision') {
          es.addCollisionLayer('collision_1')
          es.setActiveLayer(es.layers.length - 1)
        } else if (requiredType === 'object') {
          es.addObjectLayer('object_1')
          es.setActiveLayer(es.layers.length - 1)
        }
      }
    }
    setActiveTool(toolType)
    createTool(toolType)
    refresh()
  }, [createTool, refresh])

  /** 瓦片区域选择 → 自动切 tile 图层 + 笔刷 */
  const handleSelectRegion = useCallback((tilesetId: string, col: number, row: number, cols: number, rows: number) => {
    const es = editorStateRef.current
    if (!es) return
    es.selectedRegion = { tilesetId, col, row, cols, rows }

    // 确保选中 tile 图层
    if (es.activeLayer?.type !== 'tile') {
      const idx = es.layers.findIndex(l => l.type === 'tile')
      if (idx >= 0) es.setActiveLayer(idx)
    }

    refresh()
    // 自动切换到瓦片绘制工具
    const tileTools: ToolType[] = ['brush', 'eraser', 'fill', 'rect', 'line']
    if (!tileTools.includes(activeTool)) {
      setActiveTool('brush')
      createTool('brush')
    }
  }, [activeTool, createTool, refresh])

  /** 图层选择 → 自动切到对应工具 */
  const handleSelectLayer = useCallback((index: number) => {
    const es = editorStateRef.current
    if (!es) return
    es.setActiveLayer(index)
    const layer = es.layers[index]
    if (layer) {
      const currentRequired = TOOL_LAYER_TYPE[activeTool]
      // 当前工具不兼容该图层类型时，自动切到默认工具
      if (currentRequired !== null && currentRequired !== layer.type) {
        const defaultTool = LAYER_DEFAULT_TOOL[layer.type] ?? 'select'
        setActiveTool(defaultTool)
        createTool(defaultTool)
      }
    }
    refresh()
  }, [activeTool, createTool, refresh])

  // 初始化
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    let cancelled = false

    const init = async () => {
      try {
        const app = new Application()
        const w = el.clientWidth || window.innerWidth
        const h = el.clientHeight || window.innerHeight

        await app.init({
          width: w,
          height: h,
          background: 0x1a1a2e,
          antialias: false,
          resolution: window.devicePixelRatio,
          autoDensity: true,
        })

        if (cancelled) {
          app.destroy(true, { children: true })
          return
        }

        el.appendChild(app.canvas as HTMLCanvasElement)
        appRef.current = app

        const resizeObserver = new ResizeObserver(() => {
          const newW = el.clientWidth
          const newH = el.clientHeight
          if (newW > 0 && newH > 0) {
            app.renderer.resize(newW, newH)
          }
        })
        resizeObserver.observe(el)
        resizeObserverRef.current = resizeObserver

        // 空白场景
        const emptySceneData: SceneData = {
          width: 96,
          height: 56,
          tileSize: 16,
          tilesets: [],
          layers: [],
          zones: [],
        }
        const loadedScene: LoadedScene = { data: emptySceneData, tilesets: new Map() }
        if (cancelled) return

        setScene(loadedScene)
        sceneRef.current = loadedScene
        const newEditorState = new EditorState(loadedScene.data)
        editorStateRef.current = newEditorState
        setEditorState(newEditorState)

        const viewport = new EditorViewport(app, loadedScene)
        viewportRef.current = viewport

        // 初始快照
        historyRef.current.clear()
        historyRef.current.push(newEditorState.toSceneData())

        // 监听编辑器状态变更，刷新渲染 + 保存历史
        newEditorState.on((event) => {
          if (event.type === 'layer-changed' || event.type === 'layer-list-changed' || event.type === 'scene-replaced') {
            const updatedData = newEditorState.toSceneData()
            const currentTilesets = sceneRef.current?.tilesets ?? new Map()
            const updatedScene: LoadedScene = { data: updatedData, tilesets: currentTilesets }
            viewport.reloadScene(updatedScene)
            // scene-replaced 来自 undo/redo/load，不重复 push 历史
            if (event.type !== 'scene-replaced') {
              historyRef.current.push(updatedData)
            }
            refresh()
          }
        })

        setLoading(false)

        // 默认选择工具
        viewport.setTool(new SelectTool({
          getObjects: () => newEditorState.layers.filter(l => l.type === 'object').flatMap(l => l.type === 'object' ? l.objects : []),
          onSelect: (obj) => setSelectedObject(obj),
          onTransform: () => {},
        }))

      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      viewportRef.current?.destroy()
      viewportRef.current = null
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [refresh])

  // 撤销/重做（就地替换数据，保留对象引用和监听器）
  const handleUndo = useCallback(() => {
    const es = editorStateRef.current
    const vp = viewportRef.current
    if (!es || !vp) return
    const prev = historyRef.current.undo(es.toSceneData())
    if (!prev) return
    es.loadSceneData(prev)
    refresh()
  }, [refresh])

  const handleRedo = useCallback(() => {
    const es = editorStateRef.current
    const vp = viewportRef.current
    if (!es || !vp) return
    const next = historyRef.current.redo(es.toSceneData())
    if (!next) return
    es.loadSceneData(next)
    refresh()
  }, [refresh])

  // 快捷键
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Ctrl+Z / Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
        return
      }

      if (e.key === 'Escape') { onExit(); return }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') switchTool('select')
        if (e.key === 'h' || e.key === 'H') switchTool('pan')
        if (e.key === 'b' || e.key === 'B') switchTool('brush')
        if (e.key === 'e' || e.key === 'E') switchTool('eraser')
        if (e.key === 'g' || e.key === 'G') switchTool('fill')
        if (e.key === 'r' || e.key === 'R') switchTool('rect')
        if (e.key === 'l' || e.key === 'L') switchTool('line')
        if (e.key === 'c' || e.key === 'C') switchTool('collision')
        if (e.key === 'o' || e.key === 'O') switchTool('object')
        if (e.key === 'z' || e.key === 'Z') switchTool('zone')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onExit, switchTool, handleUndo, handleRedo])

  // 左侧边栏拖拽调整宽度
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    const startX = e.clientX
    const startWidth = leftPanelWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return
      const newWidth = Math.max(150, Math.min(600, startWidth + ev.clientX - startX))
      setLeftPanelWidth(newWidth)
    }
    const onMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [leftPanelWidth])

  // 素材导入：从文件直接加载纹理 + 自动创建 tile 图层
  const handleImportTileset = useCallback(async (tileset: TilesetDef, imageFile: File) => {
    const es = editorStateRef.current
    const currentScene = sceneRef.current
    if (!es || !currentScene) return
    const loaded = await loadTilesetFromBlob(imageFile, tileset)
    const newTilesets = new Map(currentScene.tilesets)
    newTilesets.set(tileset.id, loaded)
    es.addTileset(tileset)

    // 自动创建 tile 图层（如果没有）
    const hasTileLayer = es.layers.some(l => l.type === 'tile')
    if (!hasTileLayer) {
      es.addTileLayer('tile_1')
    }
    // 自动选中第一个 tile 图层
    const tileIdx = es.layers.findIndex(l => l.type === 'tile')
    if (tileIdx >= 0) es.setActiveLayer(tileIdx)

    const updatedData = es.toSceneData()
    const updatedScene: LoadedScene = { data: updatedData, tilesets: newTilesets }
    setScene(updatedScene)
    sceneRef.current = updatedScene

    // 自动切到笔刷
    setActiveTool('brush')
    createTool('brush')
    refresh()
  }, [createTool, refresh])

  // 加载场景文件
  const handleLoad = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text) as import('../../game/editor/types').SceneData
        const es = editorStateRef.current
        if (!es) return
        es.loadSceneData(data)
        historyRef.current.clear()
        historyRef.current.push(data)
        refresh()
      } catch {
        // 解析失败
      }
    }
    input.click()
  }, [refresh])

  // 导出保存
  const handleSave = useCallback(() => {
    if (!editorState) return
    const data = editorState.toSceneData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'office.scene.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [editorState])

  // 工具栏分组：通用 | 瓦片 | 碰撞/对象/区域
  const toolGroups: { type: ToolType; icon: string; label: string; shortcut: string; sep?: boolean }[] = [
    { type: 'select', icon: '🖱️', label: '选择', shortcut: 'V' },
    { type: 'pan', icon: '✋', label: '平移', shortcut: 'H' },
    { type: 'brush', icon: '🖌️', label: '笔刷', shortcut: 'B', sep: true },
    { type: 'eraser', icon: '🧹', label: '橡皮擦', shortcut: 'E' },
    { type: 'fill', icon: '🪣', label: '填充', shortcut: 'G' },
    { type: 'rect', icon: '⬜', label: '矩形', shortcut: 'R' },
    { type: 'line', icon: '📏', label: '直线', shortcut: 'L' },
    { type: 'collision', icon: '🚧', label: '碰撞', shortcut: 'C', sep: true },
    { type: 'object', icon: '📌', label: '对象', shortcut: 'O' },
    { type: 'zone', icon: '🏷️', label: '区域', shortcut: 'Z' },
  ]

  const activeLayerType = editorState?.activeLayer?.type ?? null

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
      {/* 顶部工具栏 */}
      <div style={{
        height: 40,
        background: '#0d0d1a',
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        zIndex: 10,
        flexShrink: 0,
      }}>
        <button onClick={onExit} style={exitBtnStyle} title="Esc">← 退出</button>

        <div style={dividerStyle} />

        {toolGroups.map(t => {
          const requiredLayer = TOOL_LAYER_TYPE[t.type]
          const isActive = activeTool === t.type
          // 工具是否匹配当前图层（null = 通用工具，始终兼容）
          const isCompatible = requiredLayer === null || requiredLayer === activeLayerType
          return (
            <span key={t.type} style={{ display: 'contents' }}>
              {t.sep && <div style={dividerStyle} />}
              <button
                onClick={() => switchTool(t.type)}
                style={{
                  background: isActive ? '#2a3a5a' : 'transparent',
                  border: isActive ? '1px solid #4a6a9a' : '1px solid transparent',
                  color: isActive ? '#8ab4f8' : isCompatible ? '#6a6a8a' : '#3a3a4a',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  opacity: isCompatible || isActive ? 1 : 0.5,
                }}
                title={`${t.label} (${t.shortcut})${!isCompatible ? ' — 需要' + (requiredLayer === 'tile' ? '瓦片' : requiredLayer === 'collision' ? '碰撞' : '对象') + '图层' : ''}`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            </span>
          )
        })}

        <div style={dividerStyle} />

        <button onClick={handleUndo} style={actionBtnStyle} title="撤销 (Ctrl+Z)">↩ 撤销</button>
        <button onClick={handleRedo} style={actionBtnStyle} title="重做 (Ctrl+Shift+Z)">↪ 重做</button>

        <div style={dividerStyle} />

        <button onClick={handleSave} style={actionBtnStyle} title="保存场景文件">
          💾 保存
        </button>
        <button onClick={handleLoad} style={actionBtnStyle} title="加载场景文件">
          📂 加载
        </button>

        <div style={{ flex: 1 }} />
        <span style={{ color: '#4a4a6a', fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 }}>
          SCENE EDITOR
        </span>
      </div>

      {/* 主体：左侧面板 + 画布 + 右侧面板 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧面板：图层 + 瓦片集 */}
        <div style={{
          width: leftPanelWidth,
          background: '#0d0d1a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* 图层面板 */}
          <div style={{ padding: 8, borderBottom: '1px solid #2a2a4a', overflowY: 'auto', maxHeight: '40%' }}>
            {editorState && (
              <LayerPanel
                state={editorState}
                activeIndex={editorState.activeLayerIndex}
                onSelectLayer={handleSelectLayer}
                onRefresh={refresh}
                onLayerAdded={(idx) => {
                  // 新建图层后自动切到对应工具
                  const layer = editorState.layers[idx]
                  if (layer) {
                    const defaultTool = LAYER_DEFAULT_TOOL[layer.type] ?? 'select'
                    setActiveTool(defaultTool)
                    createTool(defaultTool)
                  }
                }}
              />
            )}
          </div>

          {/* 瓦片集面板 */}
          <div style={{ padding: 8, overflowY: 'auto', overflowX: 'auto', flex: 1, borderBottom: '1px solid #2a2a4a' }}>
            {scene && (
              <TilesetPanel
                scene={scene}
                selectedRegion={editorState?.selectedRegion ?? null}
                onSelectRegion={handleSelectRegion}
              />
            )}
          </div>

          {/* 素材浏览器 */}
          <div style={{ padding: 8, overflowY: 'auto', maxHeight: '25%' }}>
            <AssetBrowser
              tilesets={editorState?.tilesets ?? []}
              onImportTileset={handleImportTileset}
            />
          </div>
        </div>

        {/* 可拖拽分隔条 */}
        <div
          onMouseDown={handleResizeStart}
          style={{
            width: 5,
            cursor: 'col-resize',
            background: isDraggingRef.current ? '#4a6a9a' : '#2a2a4a',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4a6a9a')}
          onMouseLeave={e => { if (!isDraggingRef.current) e.currentTarget.style.background = '#2a2a4a' }}
        />

        {/* 画布 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div
            ref={canvasRef}
            style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
          />

          {loading && (
            <div style={overlayStyle}>
              <span style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 14 }}>加载场景中...</span>
            </div>
          )}

          {error && (
            <div style={overlayStyle}>
              <span style={{ color: '#ff6b6b', fontFamily: 'monospace', fontSize: 14 }}>加载失败: {error}</span>
              <button onClick={onExit} style={{ ...actionBtnStyle, marginTop: 12 }}>返回</button>
            </div>
          )}

          {/* 底部状态栏 */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 22,
            background: '#0d0d1aee',
            borderTop: '1px solid #2a2a4a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontFamily: 'monospace',
            fontSize: 10,
            color: '#4a4a6a',
            gap: 16,
          }}>
            <span>空格+拖拽: 平移</span>
            <span>滚轮: 缩放</span>
            <span>V:选择 H:平移 B:笔刷 E:橡皮擦 G:填充 R:矩形 L:直线 C:碰撞 O:对象 Z:区域</span>
            {editorState && <span>图层: {editorState.activeLayer?.name ?? '-'}</span>}
            {editorState?.selectedRegion && <span>瓦片: {editorState.selectedRegion.tilesetId} [{editorState.selectedRegion.cols}x{editorState.selectedRegion.rows}]</span>}
          </div>
        </div>

        {/* 右侧面板：属性 / 区域 */}
        {(selectedObject || activeTool === 'zone') && editorState && (
          <div style={{
            width: 200,
            background: '#0d0d1a',
            borderLeft: '1px solid #2a2a4a',
            padding: 12,
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#8a8aaa',
            flexShrink: 0,
            overflowY: 'auto',
          }}>
            {activeTool === 'zone' ? (
              <ZonePanel
                editorState={editorState}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                onRefresh={refresh}
              />
            ) : selectedObject ? (
              <PropertyPanel
                object={selectedObject}
                editorState={editorState}
                onRefresh={refresh}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* 动画编辑器弹窗 */}
      {showAnimEditor && scene && editorState?.selectedRegion && (
        <AnimationEditor
          scene={scene}
          tilesetId={editorState.selectedRegion.tilesetId}
          onSave={(anim) => {
            if (selectedObject) {
              editorState.updateObject(selectedObject.id, { animation: anim })
            }
            setShowAnimEditor(false)
            refresh()
          }}
          onClose={() => setShowAnimEditor(false)}
        />
      )}
    </div>
  )
}

const exitBtnStyle: React.CSSProperties = {
  background: '#2a1a1a',
  border: '1px solid #5a2a2a',
  color: '#ff6b6b',
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
}

const actionBtnStyle: React.CSSProperties = {
  background: '#1a2a3a',
  border: '1px solid #2a4a6a',
  color: '#8ab4f8',
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
}

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 24,
  background: '#2a2a4a',
  margin: '0 4px',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1a1a2e',
  flexDirection: 'column',
}
