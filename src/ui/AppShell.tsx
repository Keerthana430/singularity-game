// AppShell — top-level screen router and game-flow orchestrator.
// Screens: 'menu' | 'setup' | 'game' | 'victory'
'use client';
import React, { useCallback, useRef, useState } from 'react';
import { MainMenu } from './screens/MainMenu/MainMenu';
import { PlayerSetup, PlayerSetupData } from './screens/PlayerSetup/PlayerSetup';
import { VictoryScreen } from './screens/Victory/VictoryScreen';
import { GameHUD } from './hud/GameHUD';
import { useGameStore } from '../state/store';
import { playerColors } from './theme/tokens';

type Screen = 'menu' | 'setup' | 'game' | 'victory';

export function AppShell() {
  const [screen, setScreen] = useState<Screen>('menu');

  const dispatch = useGameStore(s => s.dispatch);
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const turnPhase = useGameStore(s => s.turnPhase);
  const lastDiceResult = useGameStore(s => s.lastDiceResult);
  const winner = useGameStore(s => s.winner);
  const turnNumber = useGameStore(s => s.turnNumber);

  // Guard: prevent double-roll spam
  const rollingRef = useRef(false);

  const handleRoll = useCallback(() => {
    if (rollingRef.current || turnPhase !== 'waiting') return;
    const active = players[currentPlayerIndex];
    if (!active) return;
    rollingRef.current = true;
    dispatch({ type: 'ROLL_DICE', playerId: active.id });
    // Release after animation budget (2.5 s worst case)
    setTimeout(() => { rollingRef.current = false; }, 2500);
  }, [dispatch, players, currentPlayerIndex, turnPhase]);

  // Keyboard support: Space/Enter to roll
  React.useEffect(() => {
    if (screen !== 'game') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleRoll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, handleRoll]);

  // Watch for winner transition
  React.useEffect(() => {
    if (winner && screen === 'game') {
      // Small delay so victory FX can play first
      const t = setTimeout(() => setScreen('victory'), 3500);
      return () => clearTimeout(t);
    }
  }, [winner, screen]);

  /* ── Handlers ── */
  const handleStart = () => setScreen('setup');

  const handleSetupConfirm = (data: PlayerSetupData) => {
    dispatch({ type: 'START_GAME', playerNames: data.playerNames });
    setScreen('game');
  };

  const handleReplay = () => {
    // Re-launch setup with same player count already known
    dispatch({ type: 'RESTART_GAME' });
    setScreen('game');
  };

  const handleMainMenu = () => {
    dispatch({ type: 'RESTART_GAME' });
    setScreen('menu');
  };

  const winnerPlayer = winner ? players.find(p => p.id === winner) : null;
  const winnerIndex  = winnerPlayer ? players.indexOf(winnerPlayer) : 0;

  return (
    <>
      {screen === 'menu'  && <MainMenu onStart={handleStart} />}
      {screen === 'setup' && <PlayerSetup onConfirm={handleSetupConfirm} onBack={() => setScreen('menu')} />}

      {screen === 'victory' && winnerPlayer && (
        <VictoryScreen
          winnerName={winnerPlayer.name}
          winnerIndex={winnerIndex}
          players={players}
          turnNumber={turnNumber}
          onReplay={handleReplay}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* HUD is always mounted during game (it hides itself on victory) */}
      {screen === 'game' && (
        <GameHUD
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          turnPhase={turnPhase}
          lastDiceResult={lastDiceResult}
          winner={winner}
          onRoll={handleRoll}
        />
      )}
    </>
  );
}
