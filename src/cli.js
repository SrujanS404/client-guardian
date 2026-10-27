#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const configPath = path.join(root, 'guardian.config.json');

function getAtPath(value, dottedPath) {
  return dottedPath.split('.').reduce((current, part) => current == null ? undefined : current[part], value);
}

function compareExpected(actual, expected, currentPath = '') {
  const issues = [];
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    for (const [key, expectedValue] of Object.entries(expected)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      if (actual == null || !(key in Object(actual))) {
        issues.push({ path: nextPath, expected: expectedValue, actual: 'MISSING', message: `Required field "${nextPath}" is missing.` });
      } else {
        issues.push(...compareExpected(actual[key], expectedValue, nextPath));
      }
    }
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      issues.push({ path: currentPath, expected, actual, message: `Expected "${currentPath}" to be an array.` });
    } else {
      if (actual.length < expected.length) issues.push({ path: currentPath, expected: `at least ${expected.length} item(s)`, actual: `${actual.length} item(s)`, message: `"${currentPath}" has fewer items than the saved client expects.` });
      expected.forEach((item, index) => {
        if (actual[index] !== undefined) issues.push(...compareExpected(actual[index], item, `${currentPath}[${index}]`));
      });
    }
  } else if (actual !== expected) {
    issues.push({ path: currentPath, expected, actual, message: `"${currentPath}" changed: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.` });
  }
  return issues;
}

function explain(issue) {
  const field = issue.path;
  if (issue.actual === 'MISSING') return `AI-style explanation: an older app still needs ${field}, but the new API no longer sends it. Keep the field in the response, or introduce a versioned endpoint / migration plan.`;
  return `AI-style explanation: older clients expect ${field} to remain compatible. Check whether the backend changed its name, type, or value. This is a rule-based demo explanation, not a call to an external AI model.`;
}

async function main() {
  const command = process.argv[2] || 'help';
  if (command === 'help' || command === '--help' || command === '-h') {
    console.log('Client Guardian\n\nCommands:\n  node src/cli.js test    Replay saved client requests\n  node src/cli.js help    Show this help\n\nStart the demo API first: npm run start:api');
    return;
  }
  if (command !== 'test') {
    console.error(`Unknown command: ${command}. Run node src/cli.js help.`);
    process.exitCode = 2;
    return;
  }

  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const fixturesDir = path.resolve(root, config.fixturesDir);
  const reportPath = path.resolve(root, config.reportFile);
  const files = (await fs.readdir(fixturesDir)).filter(file => file.endsWith('.json')).sort();
  const results = [];

  for (const file of files) {
    const fixture = JSON.parse(await fs.readFile(path.join(fixturesDir, file), 'utf8'));
    const started = Date.now();
    let status = null;
    let body = null;
    let issues = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs || 5000);
      try {
        const response = await fetch(new URL(fixture.request.path, config.baseUrl), {
          method: fixture.request.method || 'GET',
          headers: { 'content-type': 'application/json', ...(fixture.request.headers || {}) },
          body: fixture.request.body ? JSON.stringify(fixture.request.body) : undefined,
          signal: controller.signal
        });
        status = response.status;
        const text = await response.text();
        try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      } finally { clearTimeout(timeout); }
      if (status !== fixture.expected.status) {
        issues.push({ path: 'HTTP status', expected: fixture.expected.status, actual: status, message: `HTTP status changed: expected ${fixture.expected.status}, received ${status}.` });
      }
      if (fixture.expected.body !== undefined) issues.push(...compareExpected(body, fixture.expected.body, 'body'));
    } catch (error) {
      issues.push({ path: 'request', expected: 'API responds', actual: error.message, message: `Could not replay request. Is the backend running at ${config.baseUrl}? Details: ${error.message}` });
    }
    results.push({ fixture: file, name: fixture.name || file, clientVersion: fixture.clientVersion || 'unknown', method: fixture.request.method || 'GET', path: fixture.request.path, status, passed: issues.length === 0, durationMs: Date.now() - started, issues: issues.map(issue => ({ ...issue, explanation: explain(issue) })) });
  }

  const report = { generatedAt: new Date().toISOString(), baseUrl: config.baseUrl, total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, results };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log('\nLegacy Client API Compatibility Guardian');
  console.log('----------------------------------------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.clientVersion}  ${result.method} ${result.path}`);
    for (const issue of result.issues) console.log(`      - ${issue.message}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed, ${report.failed} failed.`);
  console.log(`Report saved to: ${path.relative(root, reportPath)}`);
  if (report.failed > 0) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
