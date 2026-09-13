#!/usr/bin/env node
/**
 * Locale Parity Check (HO-N) — STRUCTURAL DEEP KEY-SET DIFF
 * ==========================================================
 * Flattens packages/locales/src/{en,am}.json to dotted key paths and
 * asserts keys(en) === keys(am). Byte/char length is meaningless across
 * scripts — Amharic is not Latin — so structure is the only honest signal.
 *
 * Exit 0  → zero key-path divergence.
 * Exit 1  → prints every missing/extra path, grouped.
 *
 * Usage: node scripts/check-locale-parity.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(readFileSync(join(root, 'packages/locales/src/en.json'), 'utf8'));
const am = JSON.parse(readFileSync(join(root, 'packages/locales/src/am.json'), 'utf8'));

/** Flatten a nested object to a Set of dotted key paths (leaf keys only). */
function flatten(obj, prefix = '', out = new Set()) {
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out.add(path);
    }
  }
  return out;
}

const enKeys = flatten(en);
const amKeys = flatten(am);

const missingInAm = [...enKeys].filter((k) => !amKeys.has(k)).sort();
const missingInEn = [...amKeys].filter((k) => !enKeys.has(k)).sort();

// Structural sanity: a key that is a leaf in one locale but a BRANCH in the
// other (e.g. en has "events.status" as an object, am has it as a string)
// would not show up as a missing leaf above when the branch side still has
// leaves under it. Detect by comparing full path sets including branches.
function flattenAll(obj, prefix = '', out = new Set()) {
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    out.add(path);
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenAll(value, path, out);
    }
  }
  return out;
}

const enAll = flattenAll(en);
const amAll = flattenAll(am);
const structMissingInAm = [...enAll].filter((k) => !amAll.has(k)).sort();
const structMissingInEn = [...amAll].filter((k) => !enAll.has(k)).sort();

if (
  missingInAm.length === 0 &&
  missingInEn.length === 0 &&
  structMissingInAm.length === 0 &&
  structMissingInEn.length === 0
) {
  console.log(`locale parity: OK — ${enKeys.size} leaf keys, en/am structurally identical`);
  process.exit(0);
}

console.error('locale parity: FAIL');
if (missingInAm.length) {
  console.error(`\nMissing in am (${missingInAm.length}):`);
  for (const k of missingInAm) console.error(`  - ${k}`);
}
if (missingInEn.length) {
  console.error(`\nMissing in en (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`  - ${k}`);
}
if (structMissingInAm.length > missingInAm.length) {
  const extra = structMissingInAm.filter((k) => !missingInAm.includes(k));
  if (extra.length) {
    console.error(`\nStructural (branch/leaf mismatch or object placement), en→am (${extra.length}):`);
    for (const k of extra) console.error(`  - ${k}`);
  }
}
if (structMissingInEn.length > missingInEn.length) {
  const extra = structMissingInEn.filter((k) => !missingInEn.includes(k));
  if (extra.length) {
    console.error(`\nStructural (branch/leaf mismatch or object placement), am→en (${extra.length}):`);
    for (const k of extra) console.error(`  - ${k}`);
  }
}
process.exit(1);
