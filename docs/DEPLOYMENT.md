# Deployment & Production Architecture

This document fulfills the Phase 11 requirement to outline the strategy for taking the 3D Snakes & Ladders game to production.

## 1. Asset Optimization & Delivery
Browser memory and download limits are the primary bottleneck for WebGL games.
- **Textures:** All `.png` and `.jpg` textures must be converted to **KTX2** format (using Basis Universal compression). This allows textures to be uploaded directly to GPU memory without decompression, saving massive amounts of VRAM.
- **Models:** All `.gltf` and `.glb` files will be compressed using **Meshopt** or **Draco** compression via `gltf-pipeline` before deployment.
- **Audio:** Audio should be provided in `mp3` or `ogg` and streamed using WebAudio.

## 2. CI/CD Pipeline
We use **GitHub Actions** coupled with **Vercel** or **Netlify** for edge delivery.
1. **Lint/Test:** On PR, GitHub Actions runs `eslint`, `tsc`, and executes the headless game logic tests to ensure the rules engine is not broken.
2. **Build:** `vite build` creates the production bundle, minifying JS and hashing asset filenames for caching.
3. **Deploy:** Vercel deploys the `dist` folder to their global CDN edge network.

## 3. Caching & Offline Support
- **Service Workers:** Since 3D assets are large and rarely change, we will register a Service Worker (PWA plugin) to cache the `.glb`, `.ktx2`, and `.mp3` files locally on the user's device after the first load.
- **Cache-Control Headers:** Assets in the `public` folder will be served with `Cache-Control: public, max-age=31536000, immutable`.

## 4. Hardware Fallbacks
The game uses `three.js`, which defaults to WebGL2.
If a user is on an older device or a browser where WebGL is blacklisted:
1. The game detects context creation failure.
2. The user is redirected to a "Graceful Degradation" HTML screen explaining that a WebGL2 compatible device is required, rather than hanging on a black screen.
3. If performance (FPS) drops below 30 consistently, the game will automatically throttle `pixelRatio` to `0.5` and disable post-processing (bloom/shadows).
