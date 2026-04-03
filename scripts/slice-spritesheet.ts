#!/usr/bin/env npx tsx
/**
 * slice-spritesheet.ts — 将 Sprite Sheet 大图裁切为独立帧文件
 *
 * 用法:
 *   npx tsx scripts/slice-spritesheet.ts <image> <frameWidth> <frameHeight> [outDir]
 *
 * 示例:
 *   npx tsx scripts/slice-spritesheet.ts apps/web/public/sprites/character_male.png 32 48 out/frames/
 *
 * 依赖: sharp (npm install -g sharp 或 devDependencies)
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

async function main() {
  const [, , imagePath, frameWidthStr, frameHeightStr, outDir] = process.argv

  if (!imagePath || !frameWidthStr || !frameHeightStr) {
    console.error('用法: slice-spritesheet.ts <image> <frameWidth> <frameHeight> [outDir]')
    process.exit(1)
  }

  const frameWidth = parseInt(frameWidthStr, 10)
  const frameHeight = parseInt(frameHeightStr, 10)
  const outputDir = outDir ?? path.join(path.dirname(imagePath), 'frames')

  fs.mkdirSync(outputDir, { recursive: true })

  const meta = await sharp(imagePath).metadata()
  const cols = Math.floor((meta.width ?? 0) / frameWidth)
  const rows = Math.floor((meta.height ?? 0) / frameHeight)

  console.log(`图片: ${imagePath} (${meta.width}×${meta.height})`)
  console.log(`帧尺寸: ${frameWidth}×${frameHeight}, 共 ${rows} 行 × ${cols} 列 = ${rows * cols} 帧`)

  let count = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const outPath = path.join(outputDir, `frame_r${row}_c${col}.png`)
      await sharp(imagePath)
        .extract({
          left: col * frameWidth,
          top: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        })
        .toFile(outPath)
      count++
    }
  }

  console.log(`✓ 裁切完成，共输出 ${count} 个帧文件到 ${outputDir}`)
}

main().catch(err => {
  console.error('错误:', err)
  process.exit(1)
})
