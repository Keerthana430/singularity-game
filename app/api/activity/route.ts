import { NextResponse } from 'next/server';
import { getRecentActivities, recordActivity, ActivityEvent } from '@/lib/activityFeed';

// GET /api/activity - Retrieve real live activity reports
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: getRecentActivities(),
    },
    { status: 200 }
  );
}

// POST /api/activity - Record a real game match or platform event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { iconType, tag, text, color, link } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const cleanText = text.replace(/<[^>]*>/g, '').trim().slice(0, 140);
    const cleanTag = (typeof tag === 'string' ? tag : 'EVENT')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 25);

    const validIcons: ActivityEvent['iconType'][] = [
      'colosseum',
      'dungeon',
      'ludo',
      'snakes',
      'runway',
      'studio',
    ];
    const safeIcon = validIcons.includes(iconType) ? iconType : 'colosseum';
    const safeColor =
      typeof color === 'string' && color.startsWith('#') ? color.slice(0, 10) : '#00FF66';
    const safeLink =
      typeof link === 'string' && link.startsWith('/') ? link.slice(0, 50) : '/lobby';

    const event = recordActivity({
      iconType: safeIcon,
      tag: cleanTag,
      text: cleanText,
      color: safeColor,
      link: safeLink,
    });

    return NextResponse.json({ success: true, data: event }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to record activity' }, { status: 500 });
  }
}
