import { NextResponse } from 'next/server';
import { AvatarConfig } from '@/types/avatar';

interface BattleRequest {
  fighter1: AvatarConfig;
  fighter2: AvatarConfig;
}

interface CombatTurn {
  turn: number;
  attacker: string;
  defender: string;
  move: string;
  damage: number;
  isCritical: boolean;
  defenderHpRemaining: number;
}

function calculatePowerScore(avatar: AvatarConfig): number {
  let score = 100;
  if (avatar.top === 'armor') score += 45;
  if (avatar.top === 'futuristic-suit') score += 50;
  if (avatar.bottom === 'armor-pants') score += 35;
  if (avatar.accessories?.face === 'visor') score += 25;
  if (avatar.accessories?.back === 'wings') score += 40;
  if (avatar.accessories?.back === 'jetpack') score += 35;
  if (avatar.accessories?.head === 'crown') score += 30;
  return score;
}

const ATTACK_MOVES = [
  'Photon Slash',
  'Plasma Cannon Blast',
  'Cyber Strike',
  'Overcharge Pulse',
  'Quantum Kick',
  'Laser Blade Thrust',
  'Orbital Beam',
];

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      endpoint: '/api/battle',
      methods: ['GET', 'POST'],
      description: 'Simulates turn-based combat between two AvatarConfig combatants.',
      samplePayload: {
        fighter1: '<AvatarConfig>',
        fighter2: '<AvatarConfig>',
      },
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const { fighter1, fighter2 }: BattleRequest = await request.json();

    if (!fighter1 || !fighter2) {
      return NextResponse.json(
        { success: false, error: 'Both fighters must be provided' },
        { status: 400 }
      );
    }

    const power1 = calculatePowerScore(fighter1);
    const power2 = calculatePowerScore(fighter2);

    let hp1 = 100 + Math.floor(power1 * 0.4);
    let hp2 = 100 + Math.floor(power2 * 0.4);
    const maxHp1 = hp1;
    const maxHp2 = hp2;

    const turns: CombatTurn[] = [];
    let turnCount = 1;
    let currentAttacker = Math.random() > 0.5 ? 1 : 2;

    while (hp1 > 0 && hp2 > 0 && turnCount <= 12) {
      const isAttacker1 = currentAttacker === 1;
      const attackerName = isAttacker1 ? fighter1.name : fighter2.name;
      const defenderName = isAttacker1 ? fighter2.name : fighter1.name;
      const attackerPower = isAttacker1 ? power1 : power2;

      const isCritical = Math.random() < 0.25;
      const baseDamage = Math.floor(15 + Math.random() * 20 + attackerPower * 0.1);
      const damage = isCritical ? Math.floor(baseDamage * 1.6) : baseDamage;
      const move = ATTACK_MOVES[Math.floor(Math.random() * ATTACK_MOVES.length)];

      if (isAttacker1) {
        hp2 = Math.max(0, hp2 - damage);
      } else {
        hp1 = Math.max(0, hp1 - damage);
      }

      turns.push({
        turn: turnCount,
        attacker: attackerName,
        defender: defenderName,
        move,
        damage,
        isCritical,
        defenderHpRemaining: isAttacker1 ? hp2 : hp1,
      });

      currentAttacker = isAttacker1 ? 2 : 1;
      turnCount++;
    }

    const winner = hp1 >= hp2 ? fighter1 : fighter2;
    const loser = hp1 >= hp2 ? fighter2 : fighter1;

    return NextResponse.json(
      {
        success: true,
        data: {
          winner: { id: winner.id, name: winner.name, hpRemaining: Math.max(hp1, hp2) },
          loser: { id: loser.id, name: loser.name, hpRemaining: Math.min(hp1, hp2) },
          fighter1Stats: { name: fighter1.name, powerScore: power1, maxHp: maxHp1, endHp: hp1 },
          fighter2Stats: { name: fighter2.name, powerScore: power2, maxHp: maxHp2, endHp: hp2 },
          totalTurns: turns.length,
          turns,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Battle simulation calculation error' },
      { status: 500 }
    );
  }
}
