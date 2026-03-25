// Funnel event tracking using localStorage
// Events: 'visitor' | 'quiz_started' | 'quiz_completed' | 'checkout'

export type FunnelEvent = 'visitor' | 'quiz_started' | 'quiz_completed' | 'checkout';

interface FunnelEntry {
  event: FunnelEvent;
  timestamp: number;
}

const STORAGE_KEY = 'funnel_events';

function getEvents(): FunnelEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: FunnelEntry[]) {
  // Keep only last 24h of events to avoid bloating localStorage
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = events.filter(e => e.timestamp > cutoff);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function trackEvent(event: FunnelEvent) {
  const events = getEvents();
  events.push({ event, timestamp: Date.now() });
  saveEvents(events);
}

export function getFunnelStats(periodMinutes: number) {
  const events = getEvents();
  const cutoff = Date.now() - periodMinutes * 60 * 1000;
  const filtered = events.filter(e => e.timestamp > cutoff);

  const visitors = filtered.filter(e => e.event === 'visitor').length;
  const quizStarted = filtered.filter(e => e.event === 'quiz_started').length;
  const quizCompleted = filtered.filter(e => e.event === 'quiz_completed').length;
  const checkout = filtered.filter(e => e.event === 'checkout').length;

  // Active now = events in last 2 minutes
  const activeNowCutoff = Date.now() - 2 * 60 * 1000;
  const activeNow = filtered.filter(e => e.timestamp > activeNowCutoff).length;

  return { visitors, quizStarted, quizCompleted, checkout, activeNow };
}

export function clearFunnelEvents() {
  localStorage.removeItem(STORAGE_KEY);
}
