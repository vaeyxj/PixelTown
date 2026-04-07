/**
 * 素材浏览器 — 导入图片文件创建瓦片集
 */
import { useRef } from 'react'
import type { TilesetDef } from '../../game/editor/types'

interface AssetBrowserProps {
  readonly tilesets: readonly TilesetDef[]
  readonly onImportTileset: (tileset: TilesetDef, imageFile: File) => void
}

export function AssetBrowser({ tilesets, onImportTileset }: AssetBrowserProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    // 读取图片获取尺寸
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const tileW = 16
      const tileH = 16
      const columns = Math.floor(img.width / tileW)
      const rows = Math.floor(img.height / tileH)
      const tileCount = columns * rows

      if (tileCount <= 0) {
        URL.revokeObjectURL(url)
        return
      }

      const id = `ts_${file.name.replace(/\.[^.]+$/, '')}_${Date.now()}`
      const tileset: TilesetDef = {
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        imagePath: `/maps/tilesets/${file.name}`,
        tileWidth: tileW,
        tileHeight: tileH,
        columns,
        tileCount,
      }

      onImportTileset(tileset, file)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url

    // 清空 input 以支持重复选择同一文件
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#6a8aaa', fontSize: 10, letterSpacing: 1 }}>ASSETS</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: '#1a2a3a',
            border: '1px solid #2a4a6a',
            color: '#8ab4f8',
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 10,
          }}
        >
          + 导入图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* 已导入的瓦片集列表 */}
      {tilesets.length === 0 ? (
        <div style={{ color: '#4a4a6a', fontSize: 10, textAlign: 'center', padding: 8 }}>
          无素材 — 点击「导入图片」添加瓦片集
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tilesets.map(ts => (
            <div
              key={ts.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 6px',
                background: '#1a1a2a',
                border: '1px solid #2a2a4a',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            >
              <span>🖼️</span>
              <span style={{ color: '#8a8aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ts.name}
              </span>
              <span style={{ color: '#4a4a6a' }}>{ts.tileCount}tiles</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
