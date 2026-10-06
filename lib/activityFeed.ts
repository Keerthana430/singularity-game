// lib/activityFeed.ts
// Real-time Activity Feed for the Singularity Hackathon Platform.
// Captures and logs real gameplay matches, leaderboard ranking changes,
// contest entries/votes, and avatar studio customizations.

export interface ActivityEvent {
  id: string;
  timestamp: number;
  iconType: 'colosseum' | 'dungeon' | 'ludo' | 'snakes' | 'runway' | 'studio';
  tag: string;
  text: string;
  color: string;
  link: string;
}

const MAX_ACTIVITIES = 60;

// Shared in-memory event stream on server
let activityLog: ActivityEvent[] = [
  {
    id: 'sys-init',
    timestamp: Date.now(),
    iconType: 'studio',
    tag: 'SYSTEM',
    text: 'Singularity Live Matrix online // 50 Hackathon Team Quadrants active',
    color: '#00FF66',
    link: '/studio',
  },
  {
    id: 'sys-arena',
    timestamp: Date.now() - 60000,
    iconType: 'colosseum',
    tag: 'ARENA',
    text: 'Battle Colosseum engine synchronized // Real-time ELO rating active',
    color: '#F59E0B',
    link: '/lobby',
  },
  {
    id: 'sys-contest',
    timestamp: Date.now() - 120000,
    iconType: 'runway',
    tag: 'CONTEST',
    text: 'Hall of Fame Beauty Contest open // Live team voting enabled',
    color: '#F472B6',
    link: '/contest',
  },
];

export function recordActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
  const newEvent: ActivityEvent = {
    ...event,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  // Avoid identical duplicates in quick succession
  if (activityLog.length > 0 && activityLog[0].text === newEvent.text) {
    return activityLog[0];
  }

  activityLog.unshift(newEvent);
  if (activityLog.length > MAX_ACTIVITIES) {
    activityLog = activityLog.slice(0, MAX_ACTIVITIES);
  }
  return newEvent;
}

export function getRecentActivities(limit = 20): ActivityEvent[] {
  return activityLog.slice(0, limit);
}
