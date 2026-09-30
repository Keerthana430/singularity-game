// app/api/battle/simulate/route.ts
// Headless server-side battle simulation route to verify matches and prevent client-side tampering

import { NextRequest, NextResponse } from 'next/server';
import { simulateBattle } from '@/lib/battleEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { avatarA, avatarB, seed } = body;

    if (!avatarA || !avatarB) {
      return NextResponse.json(
        { success: false, error: 'avatarA and avatarB configurations are required' },
        { status: 400 }
      );
    }

    const battleSeed = typeof seed === 'number' ? seed : Date.now();
    const result = simulateBattle(avatarA, avatarB, battleSeed);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Battle simulation failed' },
      { status: 500 }
    );
  }
}
