export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  id?: string;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_resend_config",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { id?: string };
  return { sent: true, id: data.id };
}
