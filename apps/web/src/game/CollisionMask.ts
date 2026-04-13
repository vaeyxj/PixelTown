// 像素级碰撞掩码：读取 collision.png 一次，之后内存查表

export class CollisionMask {
  private readonly data: Uint8ClampedArray
  readonly width: number
  readonly height: number
  private readonly threshold: number

  constructor(image: HTMLImageElement, threshold: number) {
    this.width = image.naturalWidth
    this.height = image.naturalHeight
    this.threshold = threshold
    const c = document.createElement('canvas')
    c.width = this.width
    c.height = this.height
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(image, 0, 0)
    this.data = ctx.getImageData(0, 0, this.width, this.height).data
  }

  isBlocked(x: number, y: number): boolean {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return true
    const idx = (iy * this.width + ix) * 4
    return this.data[idx] < this.threshold
  }

  static async load(url: string, threshold: number): Promise<CollisionMask | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(new CollisionMask(img, threshold))
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  /** 当没有 collision.png 时使用的全通空掩码 */
  static empty(width: number, height: number): CollisionMask {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    const img = new Image()
    img.src = c.toDataURL()
    // 同步构造：直接用白画布
    const mask = Object.create(CollisionMask.prototype) as CollisionMask
    ;(mask as any).width = width
    ;(mask as any).height = height
    ;(mask as any).threshold = 128
    ;(mask as any).data = ctx.getImageData(0, 0, width, height).data
    return mask
  }
}
