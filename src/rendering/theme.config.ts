// Centralised colour, material and lighting constants for the College Edition tower board.
// Every visual tunable lives here — no magic numbers in snake-and-ladder.html.

export const THEME = {
  // ─── Tile colour ramp (5 bands, tiles 1–100) ───
  tileBands: [
    { from: 1,  to: 20,  edge: 0x22D3EE, faceA: 0x16315C, faceB: 0x1B3A6B },
    { from: 21, to: 40,  edge: 0x2DD4A8, faceA: 0x12403F, faceB: 0x175049 },
    { from: 41, to: 60,  edge: 0x8A5CFF, faceA: 0x2A2060, faceB: 0x33286F },
    { from: 61, to: 80,  edge: 0xFF4FA3, faceA: 0x4A1C55, faceB: 0x56235F },
    { from: 81, to: 99,  edge: 0xFFB020, faceA: 0x4A2A18, faceB: 0x5A3420 },
  ],
  tileGoal: { edge: 0xFF8A1F, face: 0xFF8A1F, number: 0x0B0D1A },
  tileSide: 0x0C1230,
  tileEdgeEmissiveIntensity: 1.2,
  blendTiles: 3, // tiles over which adjacent bands cross-fade

  // Special-tile rings
  snakeHead:  { ring: 0x9B6BFF },
  ladderBase: { ring: 0xFFC247 },
  ladderTop:  { ring: 0xFDE68A },
  snakeTail:  { ring: 0xD8B4FE },

  // ─── Pillar (centre tower) ───
  pillar: {
    base: 0x0D1330, roughness: 0.55, metalness: 0.35,
    emissive: 0x060918, emissiveIntensity: 0.18,
    gradientBottom: 0x22D3EE, gradientMid: 0x8A5CFF, gradientTop: 0xFF4FA3,
    ringSpacing: 2.6, ringRadius: 0.075, ringEmissive: 1.5,
    pulseSpeed: 6, // seconds for one full upward pulse cycle
  },
  pillarRim: { colour: 0x9FB4FF, intensity: 0.8 },

  // ─── Snakes ───
  snakeColours: [0x14D6A0, 0xFF5A3C, 0xE0B000, 0x00B8D9, 0xA3E635, 0xC44DFF],
  snakeRadius: 0.22,
  snakeEmissiveIdle: 0.15,
  snakeEmissiveBite: 0.60,
  snakeEyes: 0xFFF2A8,
  snakeTongue: 0xFF2A55,
  snakeRoughness: 0.40,

  // ─── Ladders ───
  ladder: {
    rail:  { colour: 0xE8A33D, roughness: 0.35, metalness: 0.6, emissive: 0xFF8A1F, emissiveIntensity: 0.35 },
    rung:  { colour: 0xFFC96B },
    light: { colour: 0xFFB020, intensity: 0.5, range: 6 },
  },

  // ─── Lighting rig ───
  hemisphere: { sky: 0x5B6CC4, ground: 0x10142E, intensity: 0.55 },
  ambient: null, // removed — hemisphere is enough
  moon: { colour: 0x9FB4FF, intensity: 0.70, position: [-35, 55, -25] as const },
  cyanPoint:    { colour: 0x22D3EE, intensity: 0.7, range: 40, y: 14 },
  magentaPoint: { colour: 0xFF4FA3, intensity: 1.0, range: 45 },
  goalBeacon:   { colour: 0xFF8A1F, intensity: 1.2, range: 20 },
  amberLadderFoot: { colour: 0xFFB020, intensity: 0.5, range: 6 },

  // ─── Environment / ground ───
  ground: { colour: 0x080E22, roughness: 0.95, metalness: 0 },
  plaza:  { colour: 0x0C1535, roughness: 0.95, metalness: 0 },

  // ─── Post-processing ───
  toneMapping: 'ACESFilmic' as const,
  exposure: 1.0,
  bloom: { strength: 0.55, radius: 0.5, threshold: 0.6 },
  fog: { colour: 0x0A0F2A, density: 0.006 },
  vignette: 0.25,

  // ─── Scene ───
  background: 0x060919,
} as const;
