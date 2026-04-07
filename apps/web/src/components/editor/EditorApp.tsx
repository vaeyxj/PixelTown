/**
 * 场景编辑器主入口组件
 * 管理编辑器状态，挂载 PixiJS 视口，提供工具栏和面板
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { Application } from 'pixi.js'
import { loadScene, loadTilesetFromBlob, type LoadedScene } from '../../game/editor/sceneLoader'
import { EditorViewport } from '../../game/editor/EditorViewport'
import { EditorState } from '../../game/editor/EditorState'
import { PanTool } from '../../game/editor/tools/PanTool'
import { SelectTool } from '../../game/editor/tools/SelectTool'
import { TileBrushTool, TileEraserTool, TileFillTool } from '../../game/editor/tools/TileBrushTool'
import { CollisionBrushTool } from '../../game/editor/tools/CollisionBrushTool'
import { ObjectPlaceTool } from '../../game/editor/tools/ObjectPlaceTool'
import { ZoneTool } from '../../game/editor/tools/ZoneTool'
import { EditorHistory } from '../../game/editor/history'
import type { SceneObject, TilesetDef, ZoneData } from '../../game/editor/types'
import { LayerPanel } from './LayerPanel'
import { TilesetPanel } from './TilesetPanel'
import { PropertyPanel } from './PropertyPanel'
import { AssetBrowser } from './AssetBrowser'
import { ZonePanel } from './ZonePanel'
import { AnimationEditor } from './AnimationEditor'

type ToolType = 'select' | 'pan' | 'brush' | 'eraser' | 'fill' | 'collision' | 'object' | 'zone'

interface EditorAppProps {
  readonly onExit: () => void
}

export function EditorApp({ onExit }: EditorAppProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<EditorViewport | null>(null)
  const appRef = useRef<Application | null>(null)
  const editorStateRef = useRef<EditorState | null>(null)
  const historyRef = useRef<EditorHistory>(new EditorHistory())

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
    const sc = editorStateRef.current ? scene : null
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
  }, [scene])

  const switchTool = useCallback((toolType: ToolType) => {
    setActiveTool(toolType)
    createTool(toolType)
  }, [createTool])

  // 瓦片选择
  const handleSelectTile = useCallback((tilesetId: string, tileIndex: number) => {
    const es = editorStateRef.current
    if (!es) return
    es.selectedTile = { tilesetId, tileIndex }
    refresh()
    // 自动切换到笔刷工具
    if (activeTool !== 'brush' && activeTool !== 'eraser' && activeTool !== 'fill') {
      switchTool('brush')
    }
  }, [activeTool, switchTool, refresh])

  // 图层选择
  const handleSelectLayer = useCallback((index: number) => {
    if (!editorState) return
    editorState.setActiveLayer(index)
    refresh()
  }, [editorState, refresh])

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

        // 加载场景
        const loadedScene = await loadScene('/maps/office.scene.json')
        if (cancelled) return

        setScene(loadedScene)
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
            const updatedScene: LoadedScene = { data: updatedData, tilesets: loadedScene.tilesets }
            viewport.reloadScene(updatedScene)
            historyRef.current.push(updatedData)
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
      viewportRef.current?.destroy()
      viewportRef.current = null
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [refresh])

  // 撤销/重做
  const handleUndo = useCallback(() => {
    const es = editorStateRef.current
    const vp = viewportRef.current
    if (!es || !vp || !scene) return
    const prev = historyRef.current.undo(es.toSceneData())
    if (!prev) return
    const restored = new EditorState(prev)
    editorStateRef.current = restored
    setEditorState(restored)
    const updatedScene: LoadedScene = { data: prev, tilesets: scene.tilesets }
    vp.reloadScene(updatedScene)
    refresh()
  }, [scene, refresh])

  const handleRedo = useCallback(() => {
    const es = editorStateRef.current
    const vp = viewportRef.current
    if (!es || !vp || !scene) return
    const next = historyRef.current.redo(es.toSceneData())
    if (!next) return
    const restored = new EditorState(next)
    editorStateRef.current = restored
    setEditorState(restored)
    const updatedScene: LoadedScene = { data: next, tilesets: scene.tilesets }
    vp.reloadScene(updatedScene)
    refresh()
  }, [scene, refresh])

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
        if (e.key === 'c' || e.key === 'C') switchTool('collision')
        if (e.key === 'o' || e.key === 'O') switchTool('object')
        if (e.key === 'z' || e.key === 'Z') switchTool('zone')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onExit, switchTool, handleUndo, handleRedo])

  // 素材导入：从文件直接加载纹理，无需手动复制图片
  const handleImportTileset = useCallback(async (tileset: TilesetDef, imageFile: File) => {
    const es = editorStateRef.current
    if (!es || !scene) return
    const loaded = await loadTilesetFromBlob(imageFile, tileset)
    const newTilesets = new Map(scene.tilesets)
    newTilesets.set(tileset.id, loaded)
    es.addTileset(tileset)
    const updatedData = es.toSceneData()
    const updatedScene: LoadedScene = { data: updatedData, tilesets: newTilesets }
    setScene(updatedScene)
    refresh()
  }, [scene, refresh])

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
        const es = new EditorState(data)
        editorStateRef.current = es
        setEditorState(es)
        historyRef.current.clear()
        historyRef.current.push(data)

        const vp = viewportRef.current
        if (vp && scene) {
          const updatedScene: LoadedScene = { data, tilesets: scene.tilesets }
          vp.reloadScene(updatedScene)

          // 重新绑定变更监听
          es.on((event) => {
            if (event.type === 'layer-changed' || event.type === 'layer-list-changed' || event.type === 'scene-replaced') {
              const updatedData = es.toSceneData()
              const reloadScene: LoadedScene = { data: updatedData, tilesets: scene.tilesets }
              vp.reloadScene(reloadScene)
              historyRef.current.push(updatedData)
              refresh()
            }
          })
        }
        refresh()
      } catch {
        // 解析失败
      }
    }
    input.click()
  }, [scene, refresh])

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

  const tools: { type: ToolType; icon: string; label: string; shortcut: string }[] = [
    { type: 'select', icon: '🖱️', label: '选择', shortcut: 'V' },
    { type: 'pan', icon: '✋', label: '平移', shortcut: 'H' },
    { type: 'brush', icon: '🖌️', label: '笔刷', shortcut: 'B' },
    { type: 'eraser', icon: '🧹', label: '橡皮擦', shortcut: 'E' },
    { type: 'fill', icon: '🪣', label: '填充', shortcut: 'G' },
    { type: 'collision', icon: '🚧', label: '碰撞', shortcut: 'C' },
    { type: 'object', icon: '📌', label: '对象', shortcut: 'O' },
    { type: 'zone', icon: '🏷️', label: '区域', shortcut: 'Z' },
  ]

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

        {tools.map(t => (
          <button
            key={t.type}
            onClick={() => switchTool(t.type)}
            style={{
              background: activeTool === t.type ? '#2a3a5a' : 'transparent',
              border: activeTool === t.type ? '1px solid #4a6a9a' : '1px solid transparent',
              color: activeTool === t.type ? '#8ab4f8' : '#6a6a8a',
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
            title={`${t.label} (${t.shortcut})`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}

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
          width: 200,
          background: '#0d0d1a',
          borderRight: '1px solid #2a2a4a',
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
              />
            )}
          </div>

          {/* 瓦片集面板 */}
          <div style={{ padding: 8, overflowY: 'auto', flex: 1, borderBottom: '1px solid #2a2a4a' }}>
            {scene && (
              <TilesetPanel
                scene={scene}
                selectedTile={editorState?.selectedTile ?? null}
                onSelectTile={handleSelectTile}
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
            <span>V:选择 H:平移 B:笔刷 E:橡皮擦 G:填充 C:碰撞 O:对象 Z:区域</span>
            {editorState && <span>图层: {editorState.activeLayer?.name ?? '-'}</span>}
            {editorState?.selectedTile && <span>瓦片: {editorState.selectedTile.tilesetId}#{editorState.selectedTile.tileIndex}</span>}
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
      {showAnimEditor && scene && editorState?.selectedTile && (
        <AnimationEditor
          scene={scene}
          tilesetId={editorState.selectedTile.tilesetId}
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
