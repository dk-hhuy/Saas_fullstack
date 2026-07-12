import { NextResponse } from "next/server";
import { unsubscribeReminderByToken } from "@/lib/actions/reminder.actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return new NextResponse(renderPage("Invalid link", "Missing unsubscribe token."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    await unsubscribeReminderByToken(token);
    return new NextResponse(
      renderPage(
        "You are unsubscribed",
        "Study reminder emails are turned off. You can re-enable them anytime on My Journey."
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not process unsubscribe";
    return new NextResponse(renderPage("Unsubscribe failed", message), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function renderPage(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | TutorForge</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 48px auto; padding: 0 16px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #555; line-height: 1.5; }
    a { color: #fe5933; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
  <p><a href="/my-journey">Back to My Journey</a></p>
</body>
</html>`;
}
