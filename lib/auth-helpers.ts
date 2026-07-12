import { auth } from "@clerk/nextjs/server";

export async function getOptionalUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}
