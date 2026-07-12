/** Minimum interval between checkpoint saves per user. */
export const CHECKPOINT_RATE_LIMIT_MS = 2_000;

/** Minimum interval between manual cron invocations (per IP). */
export const CRON_MANUAL_RATE_LIMIT_MS = 60_000;

/** Reminder preferences processed per cron chunk. */
export const REMINDER_CRON_BATCH_SIZE = 100;

/** Log library queries slower than this in development. */
export const SLOW_QUERY_WARN_MS = 1_000;
