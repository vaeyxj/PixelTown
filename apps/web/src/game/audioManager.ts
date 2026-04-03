/**
 * audioManager.ts — 全局音频管理单例
 * 用户首次交互后解锁，统一管理 BGM / 音效 / 环境音
 */

import type { LoopHandle } from './synthAudio'
import * as synth from './synthAudio'

class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private ambiGain: GainNode | null = null

  private unlocked = false
  private _muted = false
  private _masterVol = 0.7
  private _bgmVol = 0.35
  private _sfxVol = 0.8

  private ambiHandle: LoopHandle | null = null
  private bgmHandle: LoopHandle | null = null

  /** 用户首次交互后调用，解锁 AudioContext */
  unlock(): void {
    if (this.unlocked) return
    this.ctx = new AudioContext()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this._masterVol
    this.masterGain.connect(this.ctx.destination)

    this.bgmGain = this.ctx.createGain()
    this.bgmGain.gain.value = this._bgmVol
    this.bgmGain.connect(this.masterGain)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = this._sfxVol
    this.sfxGain.connect(this.masterGain)

    this.ambiGain = this.ctx.createGain()
    this.ambiGain.gain.value = 0.5
    this.ambiGain.connect(this.masterGain)

    this.unlocked = true
    this.startAmbience()
    this.startBGM()
  }

  // --- 音效播放 ---

  playClick(): void {
    if (!this.ctx || !this.sfxGain) return
    synth.playClick(this.ctx, this.sfxGain)
  }

  playMenuOpen(): void {
    if (!this.ctx || !this.sfxGain) return
    synth.playMenuOpen(this.ctx, this.sfxGain)
  }

  playMenuClose(): void {
    if (!this.ctx || !this.sfxGain) return
    synth.playMenuClose(this.ctx, this.sfxGain)
  }

  playNotification(): void {
    if (!this.ctx || !this.sfxGain) return
    synth.playNotification(this.ctx, this.sfxGain)
  }

  // --- 循环控制 ---

  startAmbience(): void {
    if (!this.ctx || !this.ambiGain || this.ambiHandle) return
    this.ambiHandle = synth.createAmbience(this.ctx, this.ambiGain)
  }

  startBGM(): void {
    if (!this.ctx || !this.bgmGain || this.bgmHandle) return
    this.bgmHandle = synth.createBGM(this.ctx, this.bgmGain)
  }

  // --- 音量控制 ---

  toggleMute(): void {
    this._muted = !this._muted
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : this._masterVol
    }
  }

  setMasterVol(v: number): void {
    this._masterVol = Math.max(0, Math.min(1, v))
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this._masterVol
    }
  }

  setBgmVol(v: number): void {
    this._bgmVol = Math.max(0, Math.min(1, v))
    if (this.bgmGain) this.bgmGain.gain.value = this._bgmVol
  }

  setSfxVol(v: number): void {
    this._sfxVol = Math.max(0, Math.min(1, v))
    if (this.sfxGain) this.sfxGain.gain.value = this._sfxVol
  }

  // --- 状态读取 ---

  get muted(): boolean { return this._muted }
  get masterVol(): number { return this._masterVol }
  get bgmVol(): number { return this._bgmVol }
  get sfxVol(): number { return this._sfxVol }
}

export const audioManager = new AudioManager()
