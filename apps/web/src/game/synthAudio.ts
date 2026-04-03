/**
 * synthAudio.ts — Web Audio API 程序化 8-bit 音效生成器
 * 所有音效无需外部文件，纯算法合成
 */

export interface LoopHandle { stop(): void }

/** 短促点击音 */
export function playClick(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(dest)
  osc.type = 'square'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04)
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
  osc.start(); osc.stop(ctx.currentTime + 0.04)
}

/** 上升音阶 — 面板打开 */
export function playMenuOpen(ctx: AudioContext, dest: AudioNode): void {
  const freqs = [523, 659, 784, 1047]
  freqs.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.07
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(dest)
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.start(t); osc.stop(t + 0.12)
  })
}

/** 下降音阶 — 面板关闭 */
export function playMenuClose(ctx: AudioContext, dest: AudioNode): void {
  const freqs = [784, 659, 523, 392]
  freqs.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.06
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(dest)
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.start(t); osc.stop(t + 0.08)
  })
}

/** 叮咚提示音 */
export function playNotification(ctx: AudioContext, dest: AudioNode): void {
  const pairs: [number, number][] = [[880, 0], [1108, 0.12]]
  pairs.forEach(([freq, delay]) => {
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(dest)
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.35, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.start(t); osc.stop(t + 0.4)
  })
}

// --- 循环生成 ---

/** 粉噪音 buffer（4 秒，Voss 算法近似） */
function buildAmbienceBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const buf = ctx.createBuffer(1, sr * 4, sr)
  const data = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.96900 * b2 + w * 0.1538520
    b3 = 0.86650 * b3 + w * 0.3104856
    b4 = 0.55000 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5) * 0.025
  }
  return buf
}

/** 办公室环境白噪音循环 */
export function createAmbience(ctx: AudioContext, dest: AudioNode): LoopHandle {
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  src.buffer = buildAmbienceBuffer(ctx)
  src.loop = true
  filter.type = 'lowpass'; filter.frequency.value = 1200
  gain.gain.value = 0.8
  src.connect(filter); filter.connect(gain); gain.connect(dest)
  src.start()
  return { stop: () => { try { src.stop() } catch { /* ignore */ } } }
}

/** 三角波旋律 buffer（G 大调 8-bit lo-fi 循环） */
function buildBGMBuffer(ctx: AudioContext): AudioBuffer {
  const beat = 60 / 100  // 100 BPM
  const notes: [number, number][] = [
    [392, 0.5], [440, 0.5], [494, 0.5], [523, 0.5],
    [494, 0.5], [440, 0.5], [392, 1.0],
    [349, 0.5], [392, 0.5], [440, 0.5], [494, 0.5],
    [440, 0.5], [392, 0.5], [349, 1.0],
    [330, 0.5], [349, 0.5], [392, 0.5], [440, 0.5],
    [392, 0.5], [349, 0.5], [330, 1.0],
    [294, 0.5], [330, 0.5], [349, 0.5], [392, 0.5],
    [440, 2.0],
  ].map(([f, d]) => [f, d * beat]) as [number, number][]

  const sr = ctx.sampleRate
  const total = Math.ceil(notes.reduce((a, [, d]) => a + d, 0) * sr)
  const buf = ctx.createBuffer(1, total, sr)
  const data = buf.getChannelData(0)

  let offset = 0
  for (const [freq, dur] of notes) {
    const n = Math.ceil(dur * sr)
    for (let i = 0; i < n && offset + i < total; i++) {
      const t = i / sr
      const env = Math.max(0, Math.min(t / 0.01, 1, (dur - t) / 0.04)) * 0.1
      const phase = (freq * t) % 1
      // 三角波合成
      data[offset + i] = (phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase) * env
    }
    offset += n
  }
  return buf
}

/** 8-bit lo-fi BGM 循环 */
export function createBGM(ctx: AudioContext, dest: AudioNode): LoopHandle {
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  src.buffer = buildBGMBuffer(ctx)
  src.loop = true
  gain.gain.value = 1.0
  src.connect(gain); gain.connect(dest)
  src.start()
  return { stop: () => { try { src.stop() } catch { /* ignore */ } } }
}
