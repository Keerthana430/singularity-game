export type CharacterAnimState = 
  | 'Idle'
  | 'Walking'
  | 'Turning'
  | 'Reacting'
  | 'SlidingDown'
  | 'ClimbingUp'
  | 'Celebrating'
  | 'Defeated';

export type CharacterAsset = Record<string, unknown>;
