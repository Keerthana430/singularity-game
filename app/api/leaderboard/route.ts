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
    const { name, isVictory, classRole } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const safeName = name.replace(/<[^>]*>/g, '').replace(/[^\w\s\-]/g, '').trim().slice(0, 30);
    const safeRole = (typeof classRole === 'string' ? classRole : 'Cyber Fighter')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 40);

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
      existing.classRole = safeRole;
    } else {
      const entry: LeaderboardEntry = {
        rank: leaderboardData.length + 1,
        id: `player-${Date.now()}`,
        name: safeName,
        victories: isVictory ? 1 : 0,
        losses: isVictory ? 0 : 1,
        winRate: isVictory ? 100 : 0,
        rating: isVictory ? 1225 : 1185,
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

    return NextResponse.json(
      {
        success: true,
        message: 'Leaderboard updated successfully',
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
