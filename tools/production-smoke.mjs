#!/usr/bin/env node

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) {
    continue;
  }

  const [key, inlineValue] = arg.slice(2).split("=", 2);
  const nextValue = process.argv[i + 1];
  if (inlineValue !== undefined) {
    args.set(key, inlineValue);
  } else if (nextValue && !nextValue.startsWith("--")) {
    args.set(key, nextValue);
    i += 1;
  } else {
    args.set(key, "true");
  }
}

const baseUrl = args.get("base-url") || "https://bizprint.mn";
const apiBaseUrl = args.get("api-base-url") || joinUrl(baseUrl, "/api");
const timeoutMs = Number(args.get("timeout-ms") || 30_000);
const jsonOutput = args.get("json") === "true";

const checks = [
  { name: "home", url: joinUrl(baseUrl, "/") },
  { name: "login", url: joinUrl(baseUrl, "/login") },
  {
    name: "quote banner",
    url: joinUrl(
      baseUrl,
      "/quote?product=banner&size=1000x2000&material=Vinyl+440gsm&qty=1&sides=double",
    ),
  },
  { name: "geo districts", url: joinUrl(apiBaseUrl, "/geo/districts") },
  {
    name: "backend readiness",
    url: joinUrl(apiBaseUrl, "/system/readiness"),
    validate: validateReadiness,
  },
];

const results = [];
for (const check of checks) {
  results.push(await runGetCheck(check));
}

if (jsonOutput) {
  console.log(JSON.stringify({ baseUrl, apiBaseUrl, results }, null, 2));
} else {
  console.table(
    results.map(({ name, status, expected, latencyMs, passed, url, error }) => ({
      name,
      status,
      expected,
      latencyMs,
      passed,
      url,
      error,
    })),
  );
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  console.error(`Smoke failed for ${baseUrl}`);
  for (const result of failed) {
    console.error(`- ${result.name}: status=${result.status}, error=${result.error || "n/a"}`);
  }
  process.exit(1);
}

console.log(`Smoke passed for ${baseUrl}`);

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

async function runGetCheck(check) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(check.url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const expected = check.expected || 200;
    let passed = response.status === expected;
    let error = "";

    if (passed && check.validate) {
      const validation = check.validate(body);
      passed = validation.passed;
      error = validation.error;
    }

    return {
      name: check.name,
      url: check.url,
      status: response.status,
      expected,
      latencyMs: Date.now() - started,
      passed,
      error,
      body,
    };
  } catch (error) {
    return {
      name: check.name,
      url: check.url,
      status: 0,
      expected: check.expected || 200,
      latencyMs: Date.now() - started,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      body: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validateReadiness(body) {
  if (!body || typeof body !== "object") {
    return { passed: false, error: "Readiness response is not JSON object" };
  }

  if (body.status !== "ready") {
    return { passed: false, error: `Readiness status is ${body.status}` };
  }

  if (body.checks?.database !== "up") {
    return { passed: false, error: `Database check is ${body.checks?.database}` };
  }

  if (!body.commit) {
    return { passed: false, error: "Readiness response does not include commit" };
  }

  return { passed: true, error: "" };
}
