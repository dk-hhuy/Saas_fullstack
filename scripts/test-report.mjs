/**
 * Smoke test: report data layer + RPC quiz hub + pages.
 * Usage: node scripts/test-report.mjs
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
const base = process.env.APP_URL ?? "http://localhost:3000";

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

async function testRpcExists() {
  if (!url || !serviceKey) {
    fail("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const res = await fetch(`${url}/rest/v1/rpc/get_session_quiz_hub`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_limit: 5 }),
  });

  if (res.status === 404) {
    const body = await res.text();
    fail("get_session_quiz_hub RPC not found — run migration 020", body.slice(0, 200));
    return;
  }

  if (!res.ok) {
    const body = await res.text();
    fail(`RPC call failed (${res.status})`, body.slice(0, 300));
    return;
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    fail("RPC did not return an array");
    return;
  }

  ok(`get_session_quiz_hub RPC works (returned ${data.length} row(s))`);

  if (data.length > 0) {
    const row = data[0];
    const keys = Object.keys(row).sort().join(",");
    const expected = "companion_name,companion_subject,companion_topic,created_at,question_count,session_id";
    if (keys === expected) {
      ok("RPC row shape is correct (no quiz JSONB)");
    } else {
      fail(`Unexpected RPC row keys: ${keys}`);
    }

    if (typeof row.question_count === "number" && row.question_count > 0) {
      ok(`RPC returns question_count=${row.question_count}`);
    }
  } else {
    console.log("⊘ No quiz sessions in DB for RPC sample (OK if empty)");
  }
}

async function testQuizHubPayloadLight() {
  if (!url || !serviceKey) return;

  const heavyRes = await fetch(
    `${url}/rest/v1/session_history?select=id,quiz&quiz=not.is.null&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const rpcRes = await fetch(`${url}/rest/v1/rpc/get_session_quiz_hub`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_limit: 1 }),
  });

  if (!heavyRes.ok || !rpcRes.ok) {
    console.log("⊘ Skipping payload compare (missing data or RPC)");
    return;
  }

  const [heavy] = await heavyRes.json();
  const [light] = await rpcRes.json();

  if (!heavy?.quiz) {
    console.log("⊘ No quiz row to compare payload size");
    return;
  }

  const heavySize = JSON.stringify(heavy).length;
  const lightSize = JSON.stringify(light ?? {}).length;

  if (lightSize < heavySize) {
    ok(`RPC payload lighter than full quiz (${lightSize} vs ${heavySize} bytes)`);
  } else {
    fail(`RPC payload not lighter (${lightSize} vs ${heavySize} bytes)`);
  }
}

async function testReportTables() {
  if (!url || !serviceKey) return;

  const checks = [
    ["user_learning_stats", "user_learning_stats?select=user_id&limit=1"],
    ["placement_assessments", "placement_assessments?select=id&limit=1"],
    [
      "session_history (weekly columns)",
      "session_history?select=created_at,ended_at,duration_seconds&limit=1",
    ],
  ];

  for (const [name, path] of checks) {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (res.ok) {
      ok(`${name} reachable`);
    } else {
      fail(`${name} failed (${res.status})`, (await res.text()).slice(0, 150));
    }
  }
}

async function testPages() {
  for (const route of ["/report", "/assessment"]) {
    const res = await fetch(`${base}${route}`, { redirect: "manual" });

    if (res.status === 200) {
      ok(`GET ${route} returns 200`);
    } else if ([302, 307, 308].includes(res.status)) {
      const location = res.headers.get("location") ?? "";
      ok(`GET ${route} redirects (${res.status}) → ${location.split("?")[0]}`);
    } else {
      fail(`GET ${route} unexpected status ${res.status}`);
    }
  }
}

console.log("\nReport & assessment data smoke tests\n");

await testRpcExists();
await testQuizHubPayloadLight();
await testReportTables();
await testPages();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
