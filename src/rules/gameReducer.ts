import { GameState, GameCommand, GameEvent } from '../state';
import { createSeededRng, randomInt } from './seededRng';
import { createStandardBoard } from './boardDefinition';

/**
 * Pure function: takes current state and a command, returns new state and domain events.
 */
export function gameReducer(
  state: GameState,
  command: GameCommand
): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  // Create a deep copy of the state to ensure immutability
  const newState: GameState = JSON.parse(JSON.stringify(state));

  // Helper to advance to the next player
  const advanceTurn = () => {
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
    newState.turnNumber++;
    newState.turnPhase = 'waiting';
    newState.lastDiceResult = null;
    events.push({ type: 'TURN_ENDED', nextPlayerId: newState.players[newState.currentPlayerIndex].id });
  };

  switch (command.type) {
    case 'ROLL_DICE': {
      if (newState.turnPhase !== 'waiting') {
        // Ignore roll if not waiting
        return { newState, events };
      }
      
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      if (command.playerId !== currentPlayer.id) {
        // Wrong player trying to roll
        return { newState, events };
      }

      // Generate deterministic dice result
      const rng = createSeededRng(newState.rngState);
      const diceResult = randomInt(rng, 1, 6);
      
      // We must advance the rng state so the next roll is different.
      // Easiest way: re-seed with the next output of the RNG.
      newState.rngState = Math.floor(rng() * 4294967296);
      newState.lastDiceResult = diceResult;
      
      events.push({ type: 'DICE_ROLLED', playerId: currentPlayer.id, value: diceResult });

      const fromTile = currentPlayer.position;
      let targetTile = fromTile + diceResult;
      const maxTile = newState.boardConfig.size;

      newState.turnPhase = 'rolling'; // Intermediate phase

      if (targetTile > maxTile) {
        if (newState.boardConfig.rules.exactFinish) {
          // Overshoot, stay in place
          events.push({ type: 'OVERSHOOT', playerId: currentPlayer.id, attempted: targetTile, stayAt: fromTile });
          
          if (newState.boardConfig.rules.extraTurnOnSix && diceResult === 6) {
            newState.turnPhase = 'waiting';
          } else {
            advanceTurn();
          }
          return { newState, events };
        } else {
          // No exact finish required, just cap at max tile
          targetTile = maxTile;
        }
      }

      events.push({ type: 'PLAYER_MOVE_START', playerId: currentPlayer.id, from: fromTile, to: targetTile });
      
      // In a pure data model, we resolve the final position instantly.
      // We process the move to the target tile
      let finalTile = targetTile;
      events.push({ type: 'PLAYER_MOVED_STEP', playerId: currentPlayer.id, tile: finalTile });

      // Check for snakes or ladders
      if (newState.boardConfig.snakes[finalTile]) {
        const snakeTail = newState.boardConfig.snakes[finalTile];
        events.push({ type: 'LANDED_ON_SNAKE', playerId: currentPlayer.id, from: finalTile, to: snakeTail });
        finalTile = snakeTail;
      } else if (newState.boardConfig.ladders[finalTile]) {
        const ladderTop = newState.boardConfig.ladders[finalTile];
        events.push({ type: 'LANDED_ON_LADDER', playerId: currentPlayer.id, from: finalTile, to: ladderTop });
        finalTile = ladderTop;
      }

      // Update state
      currentPlayer.position = finalTile;

      // Check win condition
      if (finalTile === maxTile) {
        newState.winner = currentPlayer.id;
        newState.turnPhase = 'finished';
        events.push({ type: 'GAME_WON', playerId: currentPlayer.id });
        return { newState, events };
      }

      // Check for collisions (Duel trigger)
      const occupant = newState.players.find(p => p.id !== currentPlayer.id && p.position === finalTile);
      if (occupant) {
        newState.turnPhase = 'dueling';
        newState.activeDuel = {
          attackerId: currentPlayer.id,
          defenderId: occupant.id,
          tile: finalTile
        };
        events.push({ type: 'DUEL_INITIATED', attackerId: currentPlayer.id, defenderId: occupant.id });
        return { newState, events };
      }

      // If we got here, the turn is ending (unless extra turn on 6)
      if (newState.boardConfig.rules.extraTurnOnSix && diceResult === 6) {
        newState.turnPhase = 'waiting';
      } else {
        advanceTurn();
      }

      return { newState, events };
    }

    case 'RESOLVE_DUEL': {
      if (newState.turnPhase !== 'dueling' || !newState.activeDuel) {
        return { newState, events };
      }

      const { attackerId, defenderId, tile } = newState.activeDuel;
      const isAttackerWinner = command.winnerId === attackerId;
      const loserId = isAttackerWinner ? defenderId : attackerId;
      
      const winnerPlayer = newState.players.find(p => p.id === command.winnerId)!;
      const loserPlayer = newState.players.find(p => p.id === loserId)!;
      
      // Winner advances 1 tile (immune to snakes)
      let newWinnerTile = Math.min(newState.boardConfig.size, winnerPlayer.position + 1);
      
      // Loser retreats 1 tile
      let newLoserTile = Math.max(1, loserPlayer.position - 1);

      // We explicitly DO NOT trigger snakes/ladders on these bonus movements based on user instructions:
      // "if the winner moves 1 time there is a snake the snake is not bite him"
      winnerPlayer.position = newWinnerTile;
      loserPlayer.position = newLoserTile;

      newState.turnPhase = 'waiting';
      newState.activeDuel = undefined;
      
      events.push({ type: 'DUEL_RESOLVED', winnerId: command.winnerId, loserId });
      advanceTurn();
      
      return { newState, events };
    }

    case 'START_GAME': {
      if (command.playerNames.length < 2 || command.playerNames.length > 4) {
        return { newState, events };
      }

      const colors = ['#ff0055', '#00ff88', '#00aaff', '#ffaa00'];
      newState.players = command.playerNames.map((name, idx) => ({
        id: `p${idx + 1}`,
        name,
        position: 1,
        color: colors[idx],
        isAi: name.toLowerCase().includes('ai') || name.toLowerCase().includes('bot')
      }));
      
      newState.boardConfig = createStandardBoard();
      newState.currentPlayerIndex = 0;
      newState.turnPhase = 'waiting';
      newState.winner = null;
      newState.turnNumber = 1;
      newState.commandLog = [];
      
      // Use time-based seed for actual random games, but we can override in tests
      newState.rngState = Date.now();
      
      return { newState, events };
    }

    case 'RESTART_GAME': {
      // Keep players, reset positions
      newState.players.forEach(p => p.position = 1);
      newState.currentPlayerIndex = 0;
      newState.turnPhase = 'waiting';
      newState.winner = null;
      newState.turnNumber = 1;
      newState.lastDiceResult = null;
      newState.rngState = Date.now();
      return { newState, events };
    }

    case 'SKIP_ANIMATION': {
      // In a purely deterministic data model, the state is already advanced.
      // This command might just emit an event for the presentation layer to snap to end.
      return { newState, events };
    }

    default:
      return { newState, events };
  }
}
