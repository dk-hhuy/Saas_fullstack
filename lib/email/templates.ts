import type { ReminderCandidate } from "@/lib/reminder-engine";
import { buildReminderSubject } from "@/lib/reminder-engine";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
}

export function buildStudyReminderEmail(candidate: ReminderCandidate) {
  const baseUrl = appBaseUrl();
  const unsubscribeUrl = `${baseUrl}/api/reminders/unsubscribe?token=${candidate.unsubscribeToken}`;
  const journeyUrl = `${baseUrl}/my-journey`;
  const companionsUrl = `${baseUrl}/companions`;

  const subject = buildReminderSubject(candidate);

  const intro =
    candidate.currentStreak > 0
      ? `You are on a ${candidate.currentStreak}-day streak. A short voice session today keeps the momentum going.`
      : "It has been a few days since your last session. Pick a companion and practice out loud for a few minutes.";

  const text = `${intro}

Continue learning: ${journeyUrl}
Browse companions: ${companionsUrl}

Unsubscribe from study reminders: ${unsubscribeUrl}

— TutorForge`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 12px">TutorForge study reminder</h1>
  <p style="margin:0 0 16px">${intro}</p>
  <p style="margin:0 0 20px">
    <a href="${journeyUrl}" style="display:inline-block;background:#fe5933;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Open My Journey</a>
    &nbsp;
    <a href="${companionsUrl}" style="color:#fe5933">Browse companions</a>
  </p>
  <p style="font-size:12px;color:#666;margin:24px 0 0">
    <a href="${unsubscribeUrl}" style="color:#666">Unsubscribe</a> from study reminder emails.
  </p>
</body>
</html>`;

  return { subject, text, html };
}
