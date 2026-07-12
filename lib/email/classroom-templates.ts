function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
}

export function buildClassroomInviteEmail(input: {
  classroomName: string;
  inviteCode: string;
  teacherName: string;
}) {
  const baseUrl = appBaseUrl();
  const joinUrl = `${baseUrl}/classroom/join?code=${encodeURIComponent(input.inviteCode)}`;
  const subject = `Join ${input.classroomName} on TutorForge`;

  const text = `${input.teacherName} invited you to join "${input.classroomName}" on TutorForge.

Join with invite code: ${input.inviteCode}
Or open: ${joinUrl}

— TutorForge`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 12px">You're invited to a TutorForge classroom</h1>
  <p style="margin:0 0 12px"><strong>${input.teacherName}</strong> invited you to join <strong>${input.classroomName}</strong>.</p>
  <p style="margin:0 0 8px">Invite code: <strong style="letter-spacing:0.08em">${input.inviteCode}</strong></p>
  <p style="margin:0 0 20px">
    <a href="${joinUrl}" style="display:inline-block;background:#fe5933;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Join classroom</a>
  </p>
  <p style="font-size:12px;color:#666;margin:0">Teachers can see session counts and minutes for students in their class, but not full transcripts.</p>
</body>
</html>`;

  return { subject, text, html };
}
