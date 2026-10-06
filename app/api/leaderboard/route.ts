import { NextResponse } from 'next/server';
import { recordActivity } from '@/lib/activityFeed';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  victories: number;
  losses: number;
  winRate: number;
  rating: number;
  classRole: string;
}

let leaderboardData: LeaderboardEntry[] = [];

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: [...leaderboardData].sort((a, b) => b.rating - a.rating).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      })),
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const { name, isVictory, classRole, matchType = 'pvp', game = 'arena' } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const safeName = name.replace(/<[^>]*>/g, '').replace(/[^\w\s\-]/g, '').trim().slice(0, 30);
    const safeRole = (typeof classRole === 'string' ? classRole : 'Cyber Fighter')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 40);
    const isCasual = matchType === 'casual' || matchType === 'friends';
    const isBotMatch = matchType === 'bot';

    if (!safeName) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
    }

    // ─── 1. CASUAL / PLAY WITH FRIENDS MODE ──────────────────────────────────
    // Zero points contributed to official leaderboard for friendly couch matches
    if (isCasual) {
      recordActivity({
        iconType: 'colosseum',
        tag: 'CASUAL',
        text: `${safeName} completed a Casual Match with Friends in ${String(game).toUpperCase()} (0 Leaderboard points contributed)`,
        color: '#38BDF8',
        link: `/${game}`,
      });

      return NextResponse.json(
        {
          success: true,
          pointsAwarded: 0,
          isCasual: true,
          message: 'Casual match with friends: 0 points contributed to official leaderboard.',
          data: leaderboardData,
        },
        { status: 200 }
      );
    }

    // ─── 2. RATED MATCHES: REAL PLAYERS (PVP) VS BOT TRAINING ────────────────
    // Real players: +35 ELO / -15 ELO
    // AI Bots: Reduced +10 ELO / -5 ELO
    const winPoints = isBotMatch ? 10 : 35;
    const lossPoints = isBotMatch ? 5 : 15;

    const existing = leaderboardData.find((entry) => entry.name === safeName);

    if (existing) {
      if (isVictory) {
        existing.victories += 1;
        existing.rating += winPoints;
      } else {
        existing.losses += 1;
        existing.rating = Math.max(1000, existing.rating - lossPoints);
      }
      const total = existing.victories + existing.losses;
      existing.winRate = Math.round((existing.victories / total) * 100);
      existing.classRole = safeRole;
    } else {
      const entry: LeaderboardEntry = {
        rank: leaderboardData.length + 1,
        id: `player-${Date.now()}`,
        name: safeName,
        victories: isVictory ? 1 : 0,
        losses: isVictory ? 0 : 1,
        winRate: isVictory ? 100 : 0,
        rating: isVictory ? 1200 + winPoints : 1200 - lossPoints,
        classRole: safeRole,
      };
      leaderboardData.push(entry);
    }

    leaderboardData.sort((a, b) => b.rating - a.rating);
    leaderboardData.forEach((entry, idx) => {
      entry.rank = idx + 1;
      const total = entry.victories + entry.losses || 1;
      entry.winRate = Math.round((entry.victories / total) * 100);
    });

    const userEntry = leaderboardData.find((e) => e.name === safeName);
    const modeTag = isBotMatch ? 'BOT TRAINING' : 'RANKED PVP';
    const pointsDelta = isVictory ? `+${winPoints}` : `-${lossPoints}`;

    recordActivity({
      iconType: 'colosseum',
      tag: modeTag,
      text: `${safeName} achieved ${isVictory ? 'Victory' : 'Defeat'} in ${String(game).toUpperCase()} [${modeTag}] (${pointsDelta} ELO) // Rank #${userEntry?.rank || 1} (${userEntry?.rating || 1200} ELO)`,
      color: isVictory ? '#00FF66' : '#F59E0B',
      link: `/${game}`,
    });

    return NextResponse.json(
      {
        success: true,
        pointsAwarded: isVictory ? winPoints : -lossPoints,
        isBot: isBotMatch,
        isPvP: !isBotMatch,
        message: isBotMatch
          ? `Bot Match ${isVictory ? 'Victory' : 'Defeat'}: ${pointsDelta} ELO (reduced practice points)`
          : `Ranked PvP ${isVictory ? 'Victory' : 'Defeat'}: ${pointsDelta} ELO (full points)`,
        data: leaderboardData,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}
