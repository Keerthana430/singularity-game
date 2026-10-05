# Deployment & Production Build Guide

## Overview
This document outlines the pipeline for producing a production-ready build of the Singularity 3D Snakes & Ladders prototype, built on Next.js, React Three Fiber, and Tailwind CSS.

## Browser & Device Compatibility Matrix
| Platform | Target | Fallback Strategy |
|---|---|---|
| Desktop (Modern) | WebGL 2.0 (High Tier) | - |
| Desktop (Older) | WebGL 1.0 (Low Tier) | Post-processing disabled, standard materials used. |
| Mobile (High-end) | WebGL 2.0 (Medium Tier) | Shadows scaled down, particles reduced. |
| Mobile (Low-end) | WebGL 1.0 (Low Tier) | Geometric complexity reduced, minimal FX. |
| Unsupported | No WebGL Support | Graceful HTML fallback message indicating hardware incompatibility. |

## Bundle Optimization & Assets
1. **Asset Hashing & Caching**: Next.js automatically hashes JS/CSS chunks for aggressive caching on CDNs.
2. **GLTF Compression**: If loading custom `.gltf`/`.glb` models in the future, use `gltf-pipeline` with Draco compression to reduce payload size.
3. **Texture Formats**: Current procedural materials require zero network overhead. Future textures should be compressed to `.ktx2` format for GPU-native memory efficiency.

## CI/CD Pipeline Strategy
A standard CI pipeline (e.g. GitHub Actions) should follow these steps:
1. **Linting**: `npm run lint` (Checks TypeScript strictness, ESLint rules, and next/core-web-vitals).
2. **Testing**: `npm run test` (Runs Vitest unit, integration, and soak test suites).
3. **Build**: `npm run build` (Compiles the Next.js production bundle, strips debug code, applies minification).
4. **Deploy**: Deploy the `.next` folder or export via Vercel / AWS Amplify.

## Pre-Release Checklist
- [x] Linting passes with zero warnings.
- [x] Test suites (including Fuzz/Soak tests) pass.
- [x] `detect-gpu` handles tier assignments dynamically without crashing.
- [x] Audio engine correctly unlocks context upon first user interaction to bypass browser autoplay policies.
- [x] Debug overlays (`GameDebugPanel`, `r3f-perf`) are stripped or feature-flagged out of production UI.

## Environment Variables
No specific environment variables are strictly required for the offline prototype, but the following could be added for feature flags:
- `NEXT_PUBLIC_ENABLE_DEBUG`: Set to `true` to show the debug overlays in production.
