export function getAppBaseUrl(override?: string): string {
  if (override) {
    return override.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function buildClassroomJoinPath(inviteCode: string): string {
  return `/classroom/join?code=${encodeURIComponent(inviteCode)}`;
}

export function buildClassroomJoinUrl(inviteCode: string, baseUrl?: string): string {
  return `${getAppBaseUrl(baseUrl)}${buildClassroomJoinPath(inviteCode)}`;
}

export function buildClassroomInvitePlainText(input: {
  classroomName: string;
  inviteCode: string;
  teacherName?: string;
  baseUrl?: string;
}) {
  const joinUrl = buildClassroomJoinUrl(input.inviteCode, input.baseUrl);
  const subject = `Join ${input.classroomName} on TutorForge`;
  const opener = input.teacherName
    ? `${input.teacherName} invited you to join "${input.classroomName}" on TutorForge.`
    : `You're invited to join "${input.classroomName}" on TutorForge.`;

  const body = `${opener}

Invite code: ${input.inviteCode}
Join link: ${joinUrl}

Open the link and enter the code to join the class.

— TutorForge`;

  return { subject, body, joinUrl };
}

export function buildClassroomInviteMailtoUrl(input: {
  classroomName: string;
  inviteCode: string;
  studentEmail?: string;
  teacherName?: string;
  baseUrl?: string;
}): string {
  const { subject, body } = buildClassroomInvitePlainText(input);
  const params = new URLSearchParams({ subject, body });
  const email = input.studentEmail?.trim();

  if (email) {
    return `mailto:${email}?${params.toString()}`;
  }

  return `mailto:?${params.toString()}`;
}

export function isValidInviteEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
