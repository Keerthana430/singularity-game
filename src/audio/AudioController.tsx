import React, { useEffect, useRef } from 'react';
import { getAudioEngine } from './AudioEngine';
import { eventBus } from '../core/eventBus';

export function AudioController() {
  const engineRef = useRef(getAudioEngine());

  useEffect(() => {
    // We only trigger init on interaction, but calling it here is safe as the engine checks if it's already inited.
    // However, the actual sounds are played below, which requires the engine to be unlocked.
    
    const engine = engineRef.current;

    const onDiceRolled = () => {
      engine.play('dice_throw');
      setTimeout(() => engine.play('dice_bounce'), 150);
      setTimeout(() => engine.play('dice_bounce', 0.5), 350);
      setTimeout(() => engine.play('dice_settle'), 500);
    };

    const onPlayerMovedStep = () => {
      engine.play('footstep', (Math.random() - 0.5) * 0.4);
    };

    const onTurnEnded = () => {
      engine.play('hop_land');
    };

    const onLandedOnSnake = () => {
      engine.play('snake_hiss');
      setTimeout(() => engine.play('snake_bite'), 800);
      setTimeout(() => engine.play('fall_impact'), 1800);
    };

    const onLandedOnLadder = () => {
      engine.play('ladder_sparkle');
      setTimeout(() => engine.play('ladder_creak'), 500);
      setTimeout(() => engine.play('ladder_creak'), 1000);
    };

    const onGameWon = () => {
      engine.play('victory_fanfare');
    };

    eventBus.on('DICE_ROLLED', onDiceRolled);
    eventBus.on('PLAYER_MOVED_STEP', onPlayerMovedStep);
    eventBus.on('TURN_ENDED', onTurnEnded);
    eventBus.on('LANDED_ON_SNAKE', onLandedOnSnake);
    eventBus.on('LANDED_ON_LADDER', onLandedOnLadder);
    eventBus.on('GAME_WON', onGameWon);

    return () => {
      eventBus.off('DICE_ROLLED', onDiceRolled);
      eventBus.off('PLAYER_MOVED_STEP', onPlayerMovedStep);
      eventBus.off('TURN_ENDED', onTurnEnded);
      eventBus.off('LANDED_ON_SNAKE', onLandedOnSnake);
      eventBus.off('LANDED_ON_LADDER', onLandedOnLadder);
      eventBus.off('GAME_WON', onGameWon);
    };
  }, []);

  return null;
}
