# Singularity Avatar Assets & Licenses

This project adheres to open-source CC0 standards for modular 3D character avatars and accessories.

## Asset Licensing & Attribution

All 3D models and style references follow CC0 / Public Domain or MIT licenses:
- **Kenney.nl (CC0 1.0 Universal)**: Low-poly weapons, accessories, and modular armor plates.
- **Quaternius (CC0 1.0 Universal)**: Modular humanoid character parts, combat animations, and low-poly armor rigs.
- **Procedural Fallback Primitives**: When external `.glb` models are not loaded or while running offline, the engine dynamically renders stylized low-poly geometric meshes using Three.js native primitives (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`). No network downloads or missing files will crash the application.

## Socket System Architecture

Each modular part binds to a specific named socket on the avatar skeleton / base mesh:

| Socket Name | Attachment Point | Compatible Slot | Default Fallback Primitive |
| :--- | :--- | :--- | :--- |
| `socket_head` | Head crown / ears | Hair, Horns, Cat Ears | Spherical Dome / Cones |
| `socket_face` | Face front | Visors, Glasses, Masks | Quad Plate / Cuboid |
| `socket_chest` | Torso / spine | Armor Plates, Dresses, Hoodies | Segmented Box / Tapered Cylinder |
| `socket_hand_r` | Right wrist / palm | Katanas, Blades, Hammers, Staves | Cylindrical Grip + Extruded Edge |
| `socket_hand_l` | Left wrist / palm | Shields, Gauntlets | Hexagonal Barrier Mesh |
| `socket_hip` | Pelvis / waist | Skirts, Pants, Greaves, Belts | Flared Cylinder / Segmented Pillars |
| `socket_feet` | Ankle / sole | Sneakers, Combat Boots | Chamfered Wedge Boxes |
| `socket_back` | Upper thoracic | Wings, Jetpacks, Capes | Dual Triangular / Jet Emitting Mesh |

## Adding New Parts

To register a new item in the game:
1. Open `types/parts.ts` and ensure your slot is typed.
2. Add the item entry to `data/partCatalog.ts`:
   ```ts
   'my-new-gear': {
     id: 'my-new-gear',
     name: 'Photon Pauldrons',
     slot: 'accessory',
     socketName: 'socket_chest',
     stats: { hp: 120, atk: 15, def: 20, spd: 5, crit: 8 },
     rarity: 'epic',
     cost: 350,
     colorOptions: ['#00FF66', '#7C5CFF'],
     fallbackPrimitive: 'box',
   }
   ```
3. The live 3D viewer and battle simulation engine will automatically incorporate the item stats and visual attachments.
