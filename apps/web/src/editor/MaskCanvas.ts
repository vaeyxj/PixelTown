// 编辑器通用画布：底图 + 可编辑图层 + 画笔/矩形/直线/橡皮/缩放/平移/撤销

export type BrushMode = 'paint' | 'erase'
export type Tool = 'brush' | 'rect' | 'line'

interface Point {
  x: number
  y: number
}

export interface MaskCanvasOptions {
  background: HTMLImageElement
  storageKey: string
  overlayColor: string // 显示用半透明色，例如 rgba(255,0,0,0.5)
}

export class MaskCanvas {
  readonly bg: HTMLImageElement
  readonly width: number
  readonly height: number

  // 离屏：真实的掩码层（白=已刷，透明=未刷）—— 导出时再做黑白/抠图换算
  readonly mask: HTMLCanvasElement
  readonly maskCtx: CanvasRenderingContext2D

  // 可见画布（DOM）
  readonly view: HTMLCanvasElement
  readonly viewCtx: CanvasRenderingContext2D

  // 视图状态
  scale = 0.25
  offsetX = 0
  offsetY = 0

  // 工具
  brushSize = 24
  private _brushMode: BrushMode = 'paint'
  private _tool: Tool = 'brush'
  readonly events = new EventTarget()

  get brushMode(): BrushMode {
    return this._brushMode
  }
  set brushMode(v: BrushMode) {
    if (this._brushMode === v) return
    this._brushMode = v
    this.events.dispatchEvent(new Event('change'))
  }

  get tool(): Tool {
    return this._tool
  }
  set tool(v: Tool) {
    if (this._tool === v) return
    this._tool = v
    this.events.dispatchEvent(new Event('change'))
  }

  // 形状拖拽预览状态（rect / line 使用；提交只在 mouseup 发生一次）
  private shapeDragging = false
  private shapeStart: Point | null = null
  private shapeEnd: Point | null = null
  private shiftDown = false

  private readonly overlayColor: string
  private readonly storageKey: string

  // 撤销栈（每步保存 mask 的 ImageData）
  private undoStack: ImageData[] = []
  private readonly undoLimit = 10

  // 输入状态
  private drawing = false
  private panning = false
  private lastX = 0
  private lastY = 0
  private spaceDown = false

  constructor(opts: MaskCanvasOptions) {
    this.bg = opts.background
    this.width = this.bg.naturalWidth
    this.height = this.bg.naturalHeight
    this.overlayColor = opts.overlayColor
    this.storageKey = opts.storageKey

    this.mask = document.createElement('canvas')
    this.mask.width = this.width
    this.mask.height = this.height
    this.maskCtx = this.mask.getContext('2d', { willReadFrequently: true })!

    this.view = document.createElement('canvas')
    this.view.style.display = 'block'
    this.view.style.background = '#222'
    this.view.style.cursor = 'crosshair'
    this.viewCtx = this.view.getContext('2d')!

    this.loadFromStorage()
    this.attachInput()
  }

  mount(parent: HTMLElement) {
    parent.appendChild(this.view)
    this.resizeToParent()
    window.addEventListener('resize', () => this.resizeToParent())
  }

  private resizeToParent() {
    const parent = this.view.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    this.view.width = rect.width
    this.view.height = rect.height
    // 初次居中
    if (this.offsetX === 0 && this.offsetY === 0) {
      const fit = Math.min(rect.width / this.width, rect.height / this.height)
      this.scale = fit
      this.offsetX = (rect.width - this.width * this.scale) / 2
      this.offsetY = (rect.height - this.height * this.scale) / 2
    }
    this.render()
  }

  render() {
    const ctx = this.viewCtx
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, this.view.width, this.view.height)
    ctx.translate(this.offsetX, this.offsetY)
    ctx.scale(this.scale, this.scale)
    ctx.drawImage(this.bg, 0, 0)
    // 将白色 mask 着色成 overlayColor 显示
    ctx.drawImage(this.coloredOverlay(), 0, 0)
    // 形状拖拽预览（不写 mask，仅在 view 上临时绘制）
    if (this.shapeDragging && this.shapeStart && this.shapeEnd) {
      this.drawShapePreview(ctx)
    }
    ctx.restore()
  }

  private drawShapePreview(ctx: CanvasRenderingContext2D) {
    const { a, b } = this.normalizedShape(this.shapeStart!, this.shapeEnd!)
    const isErase = this.brushMode === 'erase'
    const fill = isErase ? 'rgba(255,255,255,0.35)' : this.overlayColor
    const stroke = isErase ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)'
    ctx.save()
    ctx.lineWidth = Math.max(1, 1 / this.scale)
    if (this.tool === 'rect') {
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      const w = Math.abs(b.x - a.x)
      const h = Math.abs(b.y - a.y)
      ctx.fillStyle = fill
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = stroke
      ctx.setLineDash([6 / this.scale, 4 / this.scale])
      ctx.strokeRect(x, y, w, h)
    } else if (this.tool === 'line') {
      ctx.strokeStyle = fill
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = this.brushSize
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.restore()
  }

  /** 对 shape 起终点做 Shift 约束：rect → 正方形；line → 45° 吸附 */
  private normalizedShape(a: Point, b: Point): { a: Point; b: Point } {
    if (!this.shiftDown) return { a, b }
    if (this.tool === 'rect') {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const side = Math.max(Math.abs(dx), Math.abs(dy))
      return {
        a,
        b: { x: a.x + Math.sign(dx || 1) * side, y: a.y + Math.sign(dy || 1) * side },
      }
    }
    if (this.tool === 'line') {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
      const len = Math.hypot(dx, dy)
      return { a, b: { x: a.x + Math.cos(ang) * len, y: a.y + Math.sin(ang) * len } }
    }
    return { a, b }
  }

  private overlayCache: HTMLCanvasElement | null = null
  private overlayDirty = true
  private coloredOverlay(): HTMLCanvasElement {
    if (!this.overlayDirty && this.overlayCache) return this.overlayCache
    if (!this.overlayCache) {
      this.overlayCache = document.createElement('canvas')
      this.overlayCache.width = this.width
      this.overlayCache.height = this.height
    }
    const c = this.overlayCache
    const cctx = c.getContext('2d')!
    cctx.clearRect(0, 0, c.width, c.height)
    cctx.fillStyle = this.overlayColor
    cctx.fillRect(0, 0, c.width, c.height)
    cctx.globalCompositeOperation = 'destination-in'
    cctx.drawImage(this.mask, 0, 0)
    cctx.globalCompositeOperation = 'source-over'
    this.overlayDirty = false
    return c
  }

  private markOverlayDirty() {
    this.overlayDirty = true
  }

  // ---------- 输入 ----------

  private attachInput() {
    const v = this.view
    v.addEventListener('mousedown', (e) => this.onDown(e))
    v.addEventListener('mousemove', (e) => this.onMove(e))
    window.addEventListener('mouseup', (e) => this.onUp(e))
    v.addEventListener('wheel', (e) => this.onWheel(e), { passive: false })
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this.spaceDown = true
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.shiftDown = true
        if (this.shapeDragging) this.render()
      }
      // 仅在非输入焦点、非修饰键场景下响应快捷键，避免和 ⌘Z 等冲突
      const target = e.target as HTMLElement | null
      const inEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      if (!inEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'e' || e.key === 'E') this.brushMode = 'erase'
        if (e.key === 'b' || e.key === 'B') {
          this.brushMode = 'paint'
          this.tool = 'brush'
        }
        if (e.key === 'r' || e.key === 'R') this.tool = 'rect'
        if (e.key === 'l' || e.key === 'L') this.tool = 'line'
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        this.undo()
      }
    })
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.spaceDown = false
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.shiftDown = false
        if (this.shapeDragging) this.render()
      }
    })
  }

  private toWorld(clientX: number, clientY: number) {
    const rect = this.view.getBoundingClientRect()
    const vx = clientX - rect.left
    const vy = clientY - rect.top
    return {
      x: (vx - this.offsetX) / this.scale,
      y: (vy - this.offsetY) / this.scale,
    }
  }

  private onDown(e: MouseEvent) {
    if (e.button === 1 || this.spaceDown || e.button === 2) {
      this.panning = true
      this.lastX = e.clientX
      this.lastY = e.clientY
      return
    }
    if (e.button !== 0) return
    const p = this.toWorld(e.clientX, e.clientY)
    this.pushUndo()
    if (this.tool === 'brush') {
      this.drawing = true
      this.stroke(p.x, p.y, p.x, p.y)
      return
    }
    // rect / line：开启预览，拖拽中不写 mask
    this.shapeDragging = true
    this.shapeStart = p
    this.shapeEnd = p
    this.render()
  }

  private onMove(e: MouseEvent) {
    if (this.panning) {
      this.offsetX += e.clientX - this.lastX
      this.offsetY += e.clientY - this.lastY
      this.lastX = e.clientX
      this.lastY = e.clientY
      this.render()
      return
    }
    if (this.drawing) {
      const p = this.toWorld(e.clientX, e.clientY)
      const prev = this.toWorld(e.clientX - (e.movementX ?? 0), e.clientY - (e.movementY ?? 0))
      this.stroke(prev.x, prev.y, p.x, p.y)
      return
    }
    if (this.shapeDragging) {
      this.shapeEnd = this.toWorld(e.clientX, e.clientY)
      this.render()
    }
  }

  private onUp(_e: MouseEvent) {
    if (this.drawing) {
      this.drawing = false
      this.saveToStorage()
    }
    if (this.shapeDragging) {
      if (this.shapeStart && this.shapeEnd) {
        const { a, b } = this.normalizedShape(this.shapeStart, this.shapeEnd)
        if (this.tool === 'rect') this.commitRect(a, b)
        else if (this.tool === 'line') this.commitLine(a, b)
      }
      this.shapeDragging = false
      this.shapeStart = null
      this.shapeEnd = null
      this.markOverlayDirty()
      this.render()
      this.saveToStorage()
    }
    this.panning = false
  }

  private commitRect(a: Point, b: Point) {
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(b.x - a.x)
    const h = Math.abs(b.y - a.y)
    if (w < 1 || h < 1) return
    const ctx = this.maskCtx
    ctx.save()
    if (this.brushMode === 'paint') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, y, w, h)
    } else {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.clearRect(x, y, w, h)
    }
    ctx.restore()
  }

  private commitLine(a: Point, b: Point) {
    const ctx = this.maskCtx
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = this.brushSize
    if (this.brushMode === 'paint') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#ffffff'
    } else {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = '#000000'
    }
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault()
    const rect = this.view.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = Math.exp(-e.deltaY * 0.001)
    const newScale = Math.max(0.05, Math.min(8, this.scale * factor))
    // 以鼠标为锚点
    this.offsetX = mx - (mx - this.offsetX) * (newScale / this.scale)
    this.offsetY = my - (my - this.offsetY) * (newScale / this.scale)
    this.scale = newScale
    this.render()
  }

  // ---------- 绘制 ----------

  private stroke(x0: number, y0: number, x1: number, y1: number) {
    const ctx = this.maskCtx
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = this.brushSize
    if (this.brushMode === 'paint') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#ffffff'
    } else {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = '#000000'
    }
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.restore()
    this.markOverlayDirty()
    this.render()
  }

  // ---------- 撤销 / 持久化 ----------

  private pushUndo() {
    const snap = this.maskCtx.getImageData(0, 0, this.width, this.height)
    this.undoStack.push(snap)
    if (this.undoStack.length > this.undoLimit) this.undoStack.shift()
  }

  undo() {
    const snap = this.undoStack.pop()
    if (!snap) return
    this.maskCtx.putImageData(snap, 0, 0)
    this.markOverlayDirty()
    this.render()
    this.saveToStorage()
  }

  clear() {
    this.pushUndo()
    this.maskCtx.clearRect(0, 0, this.width, this.height)
    this.markOverlayDirty()
    this.render()
    this.saveToStorage()
  }

  private saveToStorage() {
    try {
      const url = this.mask.toDataURL('image/png')
      localStorage.setItem(this.storageKey, url)
    } catch {
      // 超额静默忽略
    }
  }

  private loadFromStorage() {
    const url = localStorage.getItem(this.storageKey)
    if (!url) return
    const img = new Image()
    img.onload = () => {
      this.maskCtx.drawImage(img, 0, 0)
      this.markOverlayDirty()
      this.render()
    }
    img.src = url
  }

  // ---------- 导出 ----------

  /** 将掩码转成黑白 PNG（黑=已刷/阻挡，白=未刷/可走）并下载 */
  exportCollisionPng(filename = 'collision.png') {
    const out = document.createElement('canvas')
    out.width = this.width
    out.height = this.height
    const octx = out.getContext('2d')!
    octx.fillStyle = '#ffffff'
    octx.fillRect(0, 0, out.width, out.height)
    // mask 非透明处涂黑
    octx.save()
    octx.globalCompositeOperation = 'source-over'
    octx.fillStyle = '#000000'
    // 用 mask 作为 alpha 来源
    const tmp = document.createElement('canvas')
    tmp.width = this.width
    tmp.height = this.height
    const tctx = tmp.getContext('2d')!
    tctx.fillStyle = '#000000'
    tctx.fillRect(0, 0, tmp.width, tmp.height)
    tctx.globalCompositeOperation = 'destination-in'
    tctx.drawImage(this.mask, 0, 0)
    octx.drawImage(tmp, 0, 0)
    octx.restore()
    this.download(out, filename)
  }

  /** 按掩码从背景抠出像素，其余透明，导出 foreground.png */
  exportForegroundPng(filename = 'foreground.png') {
    const out = document.createElement('canvas')
    out.width = this.width
    out.height = this.height
    const octx = out.getContext('2d')!
    octx.drawImage(this.bg, 0, 0)
    octx.globalCompositeOperation = 'destination-in'
    octx.drawImage(this.mask, 0, 0)
    this.download(out, filename)
  }

  private download(canvas: HTMLCanvasElement, filename: string) {
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
}
