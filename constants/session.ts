/** Max messages stored per voice session (append-only). */
export const MAX_SESSION_MESSAGES = 500;

/** Max characters per transcript message. */
export const MAX_MESSAGE_CONTENT_CHARS = 10_000;

/** Max JSON body size for checkpoint API (~1 MB). */
export const MAX_CHECKPOINT_PAYLOAD_BYTES = 1_024 * 1_024;
