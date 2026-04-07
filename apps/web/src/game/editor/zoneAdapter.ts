/**
 * 区域适配器 — 从 SceneData 的 ZoneData 生成兼容现有系统的 MapZone[]
 */
import type { ZoneData, MapZone, ZoneType } from './types'

/** ZoneType → 默认颜色映射 */
const ZONE_COLORS: Record<ZoneType, { color: number; borderColor: number }> = {
  workstation:  { color: 0x6b8e5a, borderColor: 0x4a6e3a },
  shared_desk:  { color: 0x8ab86a, borderColor: 0x6a9a4a },
  meeting_room: { color: 0x2a3a6b, borderColor: 0x5a5a5a },
  restroom:     { color: 0x6aaad4, borderColor: 0x2a2a2a },
  storage:      { color: 0xc49a6c, borderColor: 0x2a2a2a },
  exit:         { color: 0x7ab87a, borderColor: 0x2a2a2a },
  hallway:      { color: 0xd4cbb8, borderColor: 0x5a5a5a },
  service:      { color: 0xe8b4b8, borderColor: 0x2a2a2a },
  gym:          { color: 0x5a7a5a, borderColor: 0x2a2a2a },
}

/** 将 ZoneData[] 转换为 MapZone[]（兼容现有 simulation/lighting/door 系统） */
export function extractZones(zones: readonly ZoneData[]): readonly MapZone[] {
  return zones.map((z) => {
    const colors = ZONE_COLORS[z.type] ?? { color: 0x888888, borderColor: 0x444444 }
    return {
      id: z.id,
      name: z.name,
      type: z.type,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      color: (z.properties['color'] as number) ?? colors.color,
      borderColor: (z.properties['borderColor'] as number) ?? colors.borderColor,
      label: (z.properties['label'] as string) ?? undefined,
      seats: (z.properties['seats'] as number) ?? undefined,
      group: (z.properties['group'] as string) ?? undefined,
    }
  })
}
