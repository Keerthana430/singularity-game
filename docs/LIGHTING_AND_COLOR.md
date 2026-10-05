# TASK: Lighting and colour pass for the College Edition tower board

Follow AGENTS.md. Change only colours, materials, lights and post-processing. Do not change gameplay, layout or geometry.
Log the final values in `/src/rendering/theme.config.ts` (one place, no magic numbers elsewhere) and note the work in PROGRESS.md.

## What is wrong now (from the screenshot)
1. Everything is one flat blue: pillar, tile sides, floor and sky have almost the same hue and brightness, so nothing separates.
2. All 100 tiles look identical. There is no sense of climbing from 0 to 100.
3. The pillar is a flat blue cylinder with no light on it.
4. Snakes are thin and pastel. Ladders are pale cream. Neither stands out from the board.
5. A pale blue disc of light sits on the plaza, and some lights still bloom into white blobs.
6. Neon is only on tile edges, so there is no focal point and no depth.

## Rules (keep it engaging, not loud)
- At most 3 hues in use at once. Neon is an accent: edges, rings, windows, the goal. Big surfaces stay dark and matte.
- Brightness order: active player > goal tile and current event > tile numbers > snakes and ladders > pillar > buildings > ground.
- Number text is always white on a mid-dark tile. Never put glow or a light spike over a number.
- No pure white anywhere except dice pips and tile numbers. Nothing may clip to white after bloom.

## 1. Tile colour ramp (tile 1 to 100)
Each tile's top face and edge line take a colour from its number, so the stairs read as a journey up.

| Tiles | Edge/neon colour | Top face (alternating A / B) |
|---|---|---|
| 1-20 | cyan `#22D3EE` | `#16315C` / `#1B3A6B` |
| 21-40 | teal-green `#2DD4A8` | `#12403F` / `#175049` |
| 41-60 | violet `#8A5CFF` | `#2A2060` / `#33286F` |
| 61-80 | magenta `#FF4FA3` | `#4A1C55` / `#56235F` |
| 81-99 | orange-gold `#FFB020` | `#4A2A18` / `#5A3420` |
| 100 | solid `#FF8A1F`, number in `#0B0D1A` | goal glow ring + vertical light beam |

- Blend the colours smoothly between bands (interpolate in HSL over about 3 tiles), so there are no hard steps.
- Special tiles: snake head = purple ring `#9B6BFF` plus a small snake icon; ladder base = amber ring `#FFC247` plus a small ladder icon; ring width 6% of tile, never a full colour wash.
- Tile sides (the walls) are dark `#0C1230`, roughness 0.8, metalness 0. Edge lines get emissive intensity 1.2 so they bloom softly.

## 2. Pillar (centre tower)
- Base colour `#0D1330`, roughness 0.55, metalness 0.35, so it picks up reflections.
- Add a vertical colour gradient with a shader or a gradient texture: bottom cyan-blue, middle violet, top magenta (same bands as the tiles).
- Glowing rings every 2.6 units, each ring in the colour of the band it sits in, emissive 1.5, thin (radius 0.07).
- A slow upward light pulse that travels along the rings (about 6 seconds per loop). Subtle, not flashing.
- A rim light behind the pillar (cool white `#9FB4FF`, intensity 0.8) so its silhouette separates from the skyline.

## 3. Snakes
Use six distinct, saturated body colours so each snake is easy to track, none of them equal to a player colour (blue `#2F7BFF`, pink `#FF4FA3`, yellow `#FFC21F`, purple `#8A5CFF`):
`#14D6A0` emerald, `#FF5A3C` coral red, `#E0B000` amber-olive, `#00B8D9` deep aqua, `#A3E635` lime, `#C44DFF` orchid.
- Radius 0.20-0.24 (thicker than now). Roughness 0.4, slight clearcoat/sheen if the engine supports it.
- Belly stripe lighter by 25%, back pattern darker by 35% (diamond or band pattern), small emissive 0.15 in the body colour.
- Eyes `#FFF2A8` emissive 1.0. Tongue `#FF2A55`. Head is 15% larger than the body radius.
- On a bite, raise the snake's emissive to 0.6 for the duration, then ease back.

## 4. Ladders
- Rails warm gold `#E8A33D`, roughness 0.35, metalness 0.6, emissive `#FF8A1F` at 0.35.
- Rungs slightly lighter `#FFC96B`. Keep the width, but add a thin dark outline or contact shadow so they separate from the pillar and sky.
- A soft point light (amber, intensity 0.5, range 6) at the foot of each ladder.

## 5. Lighting rig
| Light | Colour | Intensity | Notes |
|---|---|---|---|
| Hemisphere | sky `#5B6CC4`, ground `#10142E` | 0.55 | base fill, keeps shadows from going black |
| Moon directional | `#9FB4FF` | 0.7 | from back-left and above, casts the soft shadows |
| Key rim (behind pillar) | `#9FB4FF` | 0.8 | silhouette separation |
| Cyan point | `#22D3EE` | 0.7, range 40 | height 14 near the pillar, NOT near the ground |
| Magenta point | `#FF4FA3` | 1.0, range 45 | near the top of the tower |
| Goal beacon | `#FF8A1F` | 1.2, range 20 | at tile 100 |
| Amber ladder foot lights | `#FFB020` | 0.5, range 6 | one per ladder |

- Do NOT put a strong point light at ground level. That caused the pale disc on the plaza.
- Plaza and ground: roughness 0.95, metalness 0, so lights cannot make a hot spot.
- Shadows: moon light only, soft (PCF soft or VSM), mapSize 2048 desktop / 1024 mobile, bias tuned so tiles do not show acne.

## 6. Reflections without noise
- Plaza ring floor: a very faint planar-style reflection or a fake gradient streak under the tower (opacity 0.15). Nothing mirror-like.
- Environment map: a small dark night HDRI or cubemap for the metal parts only (ladders, pillar). Intensity 0.4.

## 7. Post-processing (restrained)
- Tone mapping ACES filmic, exposure 1.0.
- Bloom: strength 0.55, radius 0.5, threshold 0.6 (threshold high enough that only emissive parts bloom).
- Vignette 0.25. Slight colour grade: cool shadows, warm highlights.
- Fog: exp2, colour `#0A0F2A`, density 0.006.
- Quality tiers: on low tier turn off bloom and shadows, keep the same colours.

## Acceptance checks (with screenshots saved to /docs/screenshots/lighting/)
1. From the default camera, tiles 1, 25, 50, 75 and 100 are clearly different colours.
2. The pillar, the tile walls and the floor are three separable tones.
3. Every snake and ladder is visible against the pillar and sky. No snake colour matches a player colour.
4. No pure-white blobs, no hot spot on the plaza, all 100 numbers readable.
5. At most 3 hue families dominate any single screenshot.
6. Build, tests and lint pass. Gameplay is unchanged.
