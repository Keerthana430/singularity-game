export type CharacterAnimState = 
  | 'Idle'
  | 'Walking'
  | 'Turning'
  | 'Reacting'
  | 'SlidingDown'
  | 'ClimbingUp'
  | 'Celebrating'
  | 'Defeated';

export interface CharacterAsset {
  // To be implemented when GLTF is available
  // scene: THREE.Group;
  // animations: Map<string, THREE.AnimationClip>;
}
