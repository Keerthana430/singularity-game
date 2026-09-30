import { NextResponse } from 'next/server';

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

let leaderboardData: LeaderboardEntry[] = [
  { rank: 1, id: 'preset-1', name: 'KAGE-07', victories: 48, losses: 4, winRate: 92, rating: 2850, classRole: 'Cyber Shinobi' },
  { rank: 2, id: 'preset-3', name: 'VEX-TITAN', victories: 42, losses: 6, winRate: 87, rating: 2680, classRole: 'Heavy Juggernaut' },
  { rank: 3, id: 'preset-2', name: 'AURA-V', victories: 39, losses: 8, winRate: 83, rating: 2540, classRole: 'Valkyrie Vanguard' },
  { rank: 4, id: 'preset-4', name: 'PIXEL-BYTE', victories: 31, losses: 11, winRate: 74, rating: 2310, classRole: 'Rogue Hacker' },
];

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: leaderboardData.sort((a, b) => b.rating - a.rating),
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const { name, isVictory, classRole } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    // Sanitize inputs
    const safeName = name.replace(/<[^>]*>/g, '').replace(/[^\w\s\-]/g, '').trim().slice(0, 30);
    const safeRole = (typeof classRole === 'string' ? classRole : 'Cyber Fighter')
      .replace(/<[^>]*>/g, '').trim().slice(0, 40);

    if (!safeName) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
    }

    const existing = leaderboardData.find((entry) => entry.name === safeName);

    if (existing) {
      if (isVictory) {
        existing.victories += 1;
        existing.rating += 25;
      } else {
        existing.losses += 1;
        existing.rating = Math.max(1000, existing.rating - 15);
      }
      const total = existing.victories + existing.losses;
      existing.winRate = Math.round((existing.victories / total) * 100);
    } else {
      // Cap leaderboard size to prevent memory exhaustion
      if (leaderboardData.length >= 200) {
        leaderboardData = leaderboardData.slice(0, 150);
      }
      leaderboardData.push({
        rank: leaderboardData.length + 1,
        id: `player-${Date.now()}`,
        name: safeName,
        victories: isVictory ? 1 : 0,
        losses: isVictory ? 0 : 1,
        winRate: isVictory ? 100 : 0,
        rating: isVictory ? 1225 : 1185,
        classRole: safeRole,
      });
    }

    // Re-rank entries
    leaderboardData.sort((a, b) => b.rating - a.rating);
    leaderboardData.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Leaderboard updated successfully',
        data: leaderboardData,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}
