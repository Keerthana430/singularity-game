import { Mesh, Vector3 } from 'three';
import gsap from 'gsap';

/**
 * Animates a mesh along a sequence of points.
 * Emits a Promise that resolves when the animation finishes.
 */
export function animatePath(mesh: Mesh, path: Vector3[], durationPerTile = 0.4): Promise<void> {
  return new Promise((resolve) => {
    if (path.length === 0) {
      resolve();
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => resolve()
    });

    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      // Move horizontally (X, Z) and rotate to face movement
      timeline.to(mesh.position, {
        x: point.x,
        z: point.z,
        duration: durationPerTile,
        ease: 'power1.inOut',
        onUpdate: function() {
          // Look at target
          // This is a simplistic approach; a true smooth look-at needs interpolation
          // over the delta movement, but for a prototype this gets us turning.
          if (i > 0) {
            const prev = path[i - 1];
            if (prev.x !== point.x || prev.z !== point.z) {
              const lookAtPos = new Vector3(point.x, mesh.position.y, point.z);
              mesh.lookAt(lookAtPos);
            }
          }
        }
      }, i * durationPerTile);

      // Hop vertically (Y)
      timeline.to(mesh.position, {
        y: point.y + 0.6, // Hop peak
        duration: durationPerTile / 2,
        yoyo: true,
        repeat: 1,
        ease: 'power1.out',
      }, i * durationPerTile);
    }
  });
}
