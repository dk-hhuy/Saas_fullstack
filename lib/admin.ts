/** Comma-separated Clerk user IDs with marketplace admin access. */
export function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getAdminUserIds().includes(userId);
}
