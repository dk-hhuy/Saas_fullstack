export type ReminderFrequency = "daily" | "weekly";

export interface ReminderCandidate {
  userId: string;
  email: string;
  frequency: ReminderFrequency;
  unsubscribeToken: string;
  lastSessionAt: string | null;
  currentStreak: number;
  totalSessions: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function idleDaysSince(lastSessionAt: string | null, now = new Date()) {
  if (!lastSessionAt) return Number.POSITIVE_INFINITY;
  const last = new Date(lastSessionAt).getTime();
  if (Number.isNaN(last)) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - last) / MS_PER_DAY);
}

export function idleThresholdDays(frequency: ReminderFrequency) {
  return frequency === "daily" ? 2 : 7;
}

export function isDueForReminder(
  candidate: ReminderCandidate,
  alreadySentToday: boolean,
  now = new Date()
) {
  if (alreadySentToday) return false;

  const idleDays = idleDaysSince(candidate.lastSessionAt, now);
  const threshold = idleThresholdDays(candidate.frequency);

  if (idleDays < threshold) return false;

  // Only nudge learners who have started at least one session.
  if (candidate.totalSessions < 1) return false;

  return true;
}

export function buildReminderSubject(candidate: ReminderCandidate) {
  if (candidate.currentStreak > 0) {
    return `Keep your ${candidate.currentStreak}-day learning streak going`;
  }
  return "Ready for your next voice lesson?";
}
