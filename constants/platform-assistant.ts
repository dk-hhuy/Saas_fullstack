/** Minimum interval between assistant messages per user. */
export const ASSISTANT_RATE_LIMIT_MS = 2_000;

/** Max assistant requests per user per rolling window. */
export const ASSISTANT_RATE_WINDOW_MS = 60_000;
export const ASSISTANT_MAX_REQUESTS_PER_WINDOW = 20;

/** Max characters per user message. */
export const ASSISTANT_MAX_MESSAGE_CHARS = 2_000;

/** Max prior turns sent to the model (user + assistant pairs). */
export const ASSISTANT_MAX_HISTORY_MESSAGES = 12;

export const ASSISTANT_STORAGE_KEY = "tutorforge_assistant_thread";
