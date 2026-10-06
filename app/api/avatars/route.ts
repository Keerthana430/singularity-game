import { NextResponse } from 'next/server';
import { PRESET_AVATARS } from '@/data/presets';
import { AvatarConfig } from '@/types/avatar';
import { recordActivity } from '@/lib/activityFeed';

// In-memory server-side storage for avatars (fallback/demo database)
let serverAvatars: AvatarConfig[] = PRESET_AVATARS.map((p) => p.avatar);

// GET /api/avatars - Retrieve all avatars or presets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'presets') {
    return NextResponse.json({ success: true, data: PRESET_AVATARS }, { status: 200 });
  }

  return NextResponse.json(
    {
      success: true,
      count: serverAvatars.length,
      data: serverAvatars,
    },
    { status: 200 }
  );
}

// Sanitize user string input (strip HTML tags, limit length)
function sanitize(input: unknown, maxLength = 100): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').replace(/[^\w\s\-#.,'()]/g, '').trim().slice(0, maxLength);
}

// POST /api/avatars - Save a new avatar configuration
export async function POST(request: Request) {
  try {
    // Guard against oversized payloads
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50000) {
      return NextResponse.json(
        { success: false, error: 'Payload too large (max 50KB)' },
        { status: 413 }
      );
    }

    const body: AvatarConfig = await request.json();

    if (!body.name || !body.body || !body.top || !body.bottom) {
      return NextResponse.json(
        { success: false, error: 'Invalid avatar payload structure' },
        { status: 400 }
      );
    }

    // Limit total stored avatars to prevent memory exhaustion
    if (serverAvatars.length >= 500) {
      serverAvatars = serverAvatars.slice(0, 400);
    }

    const newAvatar: AvatarConfig = {
      ...body,
      id: sanitize(body.id, 64) || `server-avatar-${Date.now()}`,
      name: sanitize(body.name, 50) || 'Unnamed',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = serverAvatars.findIndex((a) => a.id === newAvatar.id);
    if (existingIndex >= 0) {
      serverAvatars[existingIndex] = newAvatar;
    } else {
      serverAvatars.unshift(newAvatar);
    }

    recordActivity({
      iconType: 'studio',
      tag: 'STUDIO',
      text: `Operative ${newAvatar.name} customized avatar & outfitting loadout`,
      color: '#34D399',
      link: '/studio',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Avatar build successfully saved to backend',
        data: newAvatar,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to parse avatar payload' },
      { status: 500 }
    );
  }
}

// DELETE /api/avatars - Delete an avatar by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing avatar ID' }, { status: 400 });
    }

    serverAvatars = serverAvatars.filter((a) => a.id !== id);

    return NextResponse.json(
      { success: true, message: `Avatar ${id} deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete avatar' }, { status: 500 });
  }
}
