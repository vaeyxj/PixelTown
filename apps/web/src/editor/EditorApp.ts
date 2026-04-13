import { MaskCanvas } from './MaskCanvas'

type Mode = 'collision' | 'foreground'

const STORAGE_KEYS = {
  collision: 'pt.collision.v1',
  foreground: 'pt.foreground.v1',
} as const

const OVERLAY_COLORS = {
  collision: 'rgba(255, 80, 80, 0.55)',
  foreground: 'rgba(80, 160, 255, 0.55)',
} as const

const STYLE_ID = 'pt-editor-style'
const STYLE_CSS = `
.pt-btn {
  background: #333; color: #eee; border: 1px solid #444;
  padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;
  transition: background 0.12s ease, border-color 0.12s ease, transform 0.06s ease;
  user-select: none;
}
.pt-btn:hover { background: #3d3d3d; }
.pt-btn:active { transform: scale(0.94); }
.pt-btn.active {
  background: #2d5aa8;
  border-color: #6db5ff;
  color: #fff;
  box-shadow: 0 0 0 1px #6db5ff inset;
}
.pt-btn.flash { animation: ptFlash 0.32s ease; }
@keyframes ptFlash {
  0%   { background: #ffffff; color: #111; border-color: #ffffff; }
  60%  { background: #ffffff; color: #111; border-color: #ffffff; }
  100% { background: #333;    color: #eee; border-color: #444;    }
}
.pt-btn.export { background: #2d5a2d; border-color: #4a8a4a; }
.pt-btn.export:hover { background: #367036; }
.pt-btn.tab.active { background: #3a3a6a; border-color: #88f; }
`

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = STYLE_CSS
  document.head.appendChild(s)
}

export function startEditor(root: HTMLElement, initialMode: Mode) {
  ensureStyle()
  root.innerHTML = ''
  root.style.display = 'flex'
  root.style.flexDirection = 'column'
  root.style.height = '100vh'

  const toolbar = document.createElement('div')
  toolbar.style.cssText = `
    padding: 8px 12px; background: #222; border-bottom: 1px solid #333;
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap; user-select: none;
  `
  root.appendChild(toolbar)

  const stage = document.createElement('div')
  stage.style.cssText = 'flex: 1; position: relative; overflow: hidden;'
  root.appendChild(stage)

  let mode: Mode = initialMode
  let canvas: MaskCanvas | null = null
  let syncActive: (() => void) | null = null

  const status = document.createElement('span')
  status.style.marginLeft = 'auto'
  status.style.opacity = '0.7'
  status.textContent = '加载背景图...'

  const bg = new Image()
  bg.onload = () => {
    buildCanvas()
    buildToolbar()
    status.textContent = `${bg.naturalWidth}×${bg.naturalHeight}`
  }
  bg.onerror = () => {
    status.textContent = '背景图加载失败'
  }
  bg.src = '/background.png'

  function buildCanvas() {
    stage.innerHTML = ''
    canvas = new MaskCanvas({
      background: bg,
      storageKey: STORAGE_KEYS[mode],
      overlayColor: OVERLAY_COLORS[mode],
    })
    canvas.mount(stage)
  }

  function buildToolbar() {
    toolbar.innerHTML = ''

    const title = document.createElement('strong')
    title.textContent = 'PixelTown 编辑器'
    toolbar.appendChild(title)

    toolbar.appendChild(makeTab('碰撞', 'collision'))
    toolbar.appendChild(makeTab('前景', 'foreground'))

    const brushBtn = makeBtn('🖌 画笔 (B)', () => {
      if (!canvas) return
      canvas.tool = 'brush'
      canvas.brushMode = 'paint'
    })
    const rectBtn = makeBtn('▭ 矩形 (R)', () => {
      if (!canvas) return
      canvas.tool = 'rect'
    })
    const lineBtn = makeBtn('／ 直线 (L)', () => {
      if (!canvas) return
      canvas.tool = 'line'
    })
    const eraseBtn = makeBtn('🧽 橡皮 (E)', () => {
      if (!canvas) return
      canvas.brushMode = 'erase'
    })
    const undoBtn = makeBtn('↶ 撤销 (⌘Z)', () => {
      canvas?.undo()
      flash(undoBtn)
    })
    const clearBtn = makeBtn('清空', () => {
      canvas?.clear()
      flash(clearBtn)
    })
    toolbar.append(brushBtn, rectBtn, lineBtn, eraseBtn, undoBtn, clearBtn)

    const sizeLabel = document.createElement('label')
    sizeLabel.style.display = 'flex'
    sizeLabel.style.alignItems = 'center'
    sizeLabel.style.gap = '6px'
    sizeLabel.textContent = '笔刷'
    const sizeInput = document.createElement('input')
    sizeInput.type = 'range'
    sizeInput.min = '2'
    sizeInput.max = '200'
    sizeInput.value = '24'
    sizeInput.addEventListener('input', () => {
      if (canvas) canvas.brushSize = Number(sizeInput.value)
      sizeValue.textContent = sizeInput.value
    })
    const sizeValue = document.createElement('span')
    sizeValue.textContent = '24'
    sizeValue.style.minWidth = '28px'
    sizeLabel.appendChild(sizeInput)
    sizeLabel.appendChild(sizeValue)
    toolbar.appendChild(sizeLabel)

    const exportBtn = makeBtn('⬇ 导出 PNG', () => {
      if (!canvas) return
      if (mode === 'collision') canvas.exportCollisionPng('collision.png')
      else canvas.exportForegroundPng('foreground.png')
      flash(exportBtn)
    })
    exportBtn.classList.add('export')
    toolbar.appendChild(exportBtn)

    const hint = document.createElement('span')
    hint.style.opacity = '0.6'
    hint.style.fontSize = '12px'
    hint.textContent = '滚轮缩放 · 空格/右键拖拽平移 · B 画笔 / R 矩形 / L 直线 / E 橡皮 · Shift 锁正方形或 45°'
    toolbar.appendChild(hint)

    toolbar.appendChild(status)

    // 同步按钮选中态（键盘快捷键和点击都会走这条路径）
    syncActive = () => {
      if (!canvas) return
      brushBtn.classList.toggle('active', canvas.tool === 'brush' && canvas.brushMode === 'paint')
      rectBtn.classList.toggle('active', canvas.tool === 'rect')
      lineBtn.classList.toggle('active', canvas.tool === 'line')
      eraseBtn.classList.toggle('active', canvas.brushMode === 'erase')
    }
    canvas?.events.addEventListener('change', syncActive)
    syncActive()
  }

  function makeTab(label: string, m: Mode) {
    const b = makeBtn(label, () => {
      if (mode === m) return
      mode = m
      const url = new URL(location.href)
      url.searchParams.set('mode', m)
      history.replaceState(null, '', url.toString())
      buildCanvas()
      buildToolbar()
    })
    b.classList.add('tab')
    if (mode === m) b.classList.add('active')
    return b
  }

  function makeBtn(label: string, onClick: () => void) {
    const b = document.createElement('button')
    b.textContent = label
    b.className = 'pt-btn'
    b.addEventListener('click', onClick)
    return b
  }

  function flash(btn: HTMLButtonElement) {
    btn.classList.remove('flash')
    // 触发 reflow 以重启动画
    void btn.offsetWidth
    btn.classList.add('flash')
    const onEnd = () => {
      btn.classList.remove('flash')
      btn.removeEventListener('animationend', onEnd)
    }
    btn.addEventListener('animationend', onEnd)
  }
}
