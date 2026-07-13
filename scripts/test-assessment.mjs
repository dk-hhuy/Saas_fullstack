/**
 * Smoke test: placement_assessments table + optional Gemini generation.
 * Usage: node scripts/test-assessment.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

let passed = 0;
let failed = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
  passed++;
}

function fail(msg, err) {
  console.error(`✗ ${msg}`);
  if (err) console.error(`  ${err}`);
  failed++;
}

async function testTableExists() {
  if (!url || !serviceKey) {
    fail("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const res = await fetch(`${url}/rest/v1/placement_assessments?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (res.ok) {
    ok("placement_assessments table is reachable");
    return;
  }

  const body = await res.text();
  fail(`placement_assessments query failed (${res.status})`, body.slice(0, 200));
}

async function testInsertAndDelete() {
  if (!url || !serviceKey) return;

  const testUserId = `e2e-test-${Date.now()}`;
  const payload = {
    user_id: testUserId,
    subject: "maths",
    topic: "smoke test",
    questions: [
      {
        question: "What is 2+2?",
        options: ["3", "4", "5", "6"],
        correctIndex: 1,
      },
    ],
    answers: { 0: 1 },
    score: 1,
    total: 1,
    recommended_level: "advanced",
  };

  const insertRes = await fetch(`${url}/rest/v1/placement_assessments`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!insertRes.ok) {
    const body = await insertRes.text();
    fail(`insert failed (${insertRes.status})`, body.slice(0, 300));
    return;
  }

  const [row] = await insertRes.json();
  ok(`insert succeeded (id: ${row.id})`);

  const delRes = await fetch(`${url}/rest/v1/placement_assessments?id=eq.${row.id}`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (delRes.ok) {
    ok("cleanup delete succeeded");
  } else {
    fail(`cleanup delete failed (${delRes.status})`);
  }
}

async function testGeminiPlacement() {
  if (!geminiKey) {
    console.log("⊘ Skipping Gemini test (no GEMINI_API_KEY)");
    return;
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `Return JSON only: {"questions":[{"question":"string","options":["A","B","C","D"],"correctIndex":0}]}. Include exactly 3 questions.`,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: "Subject: maths\nTopic: Algebra basics" }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    fail(`Gemini placement generation failed (${res.status})`, body.slice(0, 300));
    return;
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    fail("Gemini returned empty content");
    return;
  }

  const parsed = JSON.parse(content);
  const count = parsed.questions?.length ?? 0;
  if (count >= 3) {
    ok(`Gemini generated ${count} placement questions`);
  } else {
    fail(`Gemini returned only ${count} questions`);
  }
}

async function testAssessmentPage() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/assessment`, { redirect: "manual" });

  if (res.status === 307 || res.status === 302 || res.status === 308) {
    const location = res.headers.get("location") ?? "";
    if (location.includes("sign-in")) {
      ok(`GET /assessment redirects unauthenticated users (${res.status})`);
    } else {
      ok(`GET /assessment responds with redirect ${res.status} → ${location}`);
    }
    return;
  }

  if (res.status === 200) {
    ok("GET /assessment returns 200");
    return;
  }

  fail(`GET /assessment unexpected status ${res.status}`);
}

console.log("\nAssessment smoke tests\n");

await testTableExists();
await testInsertAndDelete();
await testGeminiPlacement();
await testAssessmentPage();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
