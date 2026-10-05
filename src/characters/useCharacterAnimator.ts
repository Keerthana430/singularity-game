import { useState, useEffect, useRef } from 'react';
import { CharacterAnimState } from './types';

export function useCharacterAnimator() {
  const [state, setState] = useState<CharacterAnimState>('Idle');
  const prevState = useRef<CharacterAnimState>('Idle');

  const transitionTo = (newState: CharacterAnimState) => {
    if (state !== newState) {
      prevState.current = state;
      setState(newState);
      // In the future, trigger animation crossfade (e.g. 150ms) here using THREE.AnimationMixer
    }
  };

  return {
    state,
    prevState: prevState.current,
    transitionTo
  };
}
