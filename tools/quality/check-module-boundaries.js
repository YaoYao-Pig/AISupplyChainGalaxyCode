#!/usr/bin/env node

/*
 * Lightweight boundary checker for src/galaxy modules.
 * It scans import/require statements and fails on forbidden cross-domain dependencies.
 *
 * Existing legacy violations can be listed in tools/quality/boundary-allowlist.json
 * to avoid blocking current delivery while still preventing new violations.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GALAXY_ROOT = path.join(ROOT, 'src', 'galaxy');
const ALLOWLIST_PATH = path.join(ROOT, 'tools', 'quality', 'boundary-allowlist.json');

const JS_EXTENSIONS = ['.js', '.jsx'];

const FORBIDDEN_BY_DOMAIN = {
  store: new Set(['windows', 'search', 'nodeDetails', 'runtime', 'native']),
  service: new Set(['windows', 'search', 'nodeDetails', 'runtime', 'native', 'store']),
  runtime: new Set(['windows', 'search', 'nodeDetails', 'native']),
  native: new Set(['windows', 'search', 'nodeDetails', 'runtime']),
  utils: new Set(['windows', 'search', 'nodeDetails', 'runtime', 'native', 'store', 'service'])
};

function walk(dir, acc) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(full, acc);
      continue;
    }
    if (JS_EXTENSIONS.includes(path.extname(item.name))) {
      acc.push(full);
    }
  }
}

function getDomain(absFilePath) {
  const rel = path.relative(GALAXY_ROOT, absFilePath).replace(/\\/g, '/');
  const first = rel.split('/')[0];
  if (!first || first.startsWith('.')) return null;
  return first;
}

function extractDeps(content) {
  const deps = [];
  const importRe = /import\s+(?:[^'";]+\s+from\s+)?['"]([^'"\n]+)['"]/g;
  const requireRe = /require\(\s*['"]([^'"\n]+)['"]\s*\)/g;

  let m;
  while ((m = importRe.exec(content)) !== null) deps.push(m[1]);
  while ((m = requireRe.exec(content)) !== null) deps.push(m[1]);

  return deps;
}

function resolveLocal(fromFile, request) {
  const base = path.resolve(path.dirname(fromFile), request);
  const candidates = [
    base,
    ...JS_EXTENSIONS.map(ext => base + ext),
    ...JS_EXTENSIONS.map(ext => path.join(base, 'index' + ext))
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return new Set();

  try {
    const raw = fs.readFileSync(ALLOWLIST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed.violations) ? parsed.violations : [];
    return new Set(rows.map(v => `${v.file}|${v.from}|${v.to}|${v.dep}`));
  } catch (err) {
    console.error('[check:boundaries] Invalid allowlist JSON:', err.message);
    process.exit(1);
  }
}

function violationKey(v) {
  return `${v.file}|${v.fromDomain}|${v.toDomain}|${v.dep}`;
}

function main() {
  if (!fs.existsSync(GALAXY_ROOT)) {
    console.error('[check:boundaries] Missing directory: src/galaxy');
    process.exit(1);
  }

  const allowlist = loadAllowlist();
  const files = [];
  walk(GALAXY_ROOT, files);

  const violations = [];
  const allowed = [];

  for (const file of files) {
    const fromDomain = getDomain(file);
    if (!fromDomain || !FORBIDDEN_BY_DOMAIN[fromDomain]) continue;

    const content = fs.readFileSync(file, 'utf8');
    const deps = extractDeps(content);

    for (const dep of deps) {
      if (!dep.startsWith('.')) continue;

      const resolved = resolveLocal(file, dep);
      if (!resolved || !resolved.startsWith(GALAXY_ROOT)) continue;

      const toDomain = getDomain(resolved);
      if (!toDomain || toDomain === fromDomain) continue;

      if (FORBIDDEN_BY_DOMAIN[fromDomain].has(toDomain)) {
        const v = {
          file: path.relative(ROOT, file).replace(/\\/g, '/'),
          fromDomain,
          toDomain,
          dep
        };

        if (allowlist.has(violationKey(v))) {
          allowed.push(v);
        } else {
          violations.push(v);
        }
      }
    }
  }

  if (allowed.length > 0) {
    console.log(`[check:boundaries] WARN: ${allowed.length} legacy violation(s) are allowlisted.`);
    for (const v of allowed) {
      console.log(`  ~ ${v.file}: ${v.fromDomain} -> ${v.toDomain} via '${v.dep}'`);
    }
  }

  if (violations.length === 0) {
    console.log('[check:boundaries] PASS: no new boundary violations found.');
    return;
  }

  console.error('[check:boundaries] FAIL: boundary violations found:');
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.fromDomain} -> ${v.toDomain} via '${v.dep}'`);
  }
  process.exit(2);
}

main();
