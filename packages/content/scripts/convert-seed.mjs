// One-time, reproducible converter: docs/dronops_requirements_seed.sql ->
// packages/content/src/requirements/{framework}.ts. Generated files are NOT
// hand-edited; re-run this when the seed revs:  node scripts/convert-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const seedPath = join(repoRoot, "docs", "dronops_requirements_seed.sql");
const outDir = join(here, "..", "src", "requirements");

const SEED_VERSION = "v1.0 (2026-06-07)";

// framework -> { file, jurisdiction, kind }  (derivation rules per owner spec)
const FRAMEWORKS = {
  "CAR-UAC": { file: "caruac", jurisdiction: "UAE-Federal", kind: "regulation" },
  "DCAR-UAS": { file: "dcar", jurisdiction: "UAE-Dubai", kind: "regulation" },
  "GACAR Part 107": { file: "gacar107", jurisdiction: "KSA", kind: "regulation" },
  "GACAR Part 48": { file: "gacar48", jurisdiction: "KSA", kind: "regulation" },
  "GACA AC 107-01": { file: "ac10701", jurisdiction: "KSA", kind: "guidance" },
};

const sql = readFileSync(seedPath, "utf8");
const body = sql.slice(sql.toLowerCase().indexOf("values") + "values".length);

// Extract top-level (...) tuples, respecting '' escaping inside string literals.
function parseTuples(str) {
  const tuples = [];
  let depth = 0,
    cur = "",
    inStr = false;
  for (let j = 0; j < str.length; j++) {
    const c = str[j];
    if (inStr) {
      if (c === "'" && str[j + 1] === "'") {
        cur += "''";
        j++;
      } else if (c === "'") {
        inStr = false;
        cur += c;
      } else cur += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      cur += c;
      continue;
    }
    if (c === "(") {
      depth++;
      if (depth === 1) {
        cur = "";
        continue;
      }
    }
    if (c === ")") {
      depth--;
      if (depth === 0) {
        tuples.push(cur);
        cur = "";
        continue;
      }
    }
    if (depth >= 1) cur += c;
  }
  return tuples;
}

// Split a tuple into top-level comma-separated fields (respect strings + array[]).
function splitFields(t) {
  const fields = [];
  let cur = "",
    inStr = false,
    bracket = 0;
  for (let j = 0; j < t.length; j++) {
    const c = t[j];
    if (inStr) {
      if (c === "'" && t[j + 1] === "'") {
        cur += "''";
        j++;
      } else if (c === "'") {
        inStr = false;
        cur += c;
      } else cur += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      cur += c;
      continue;
    }
    if (c === "[") bracket++;
    if (c === "]") bracket--;
    if (c === "," && bracket === 0) {
      fields.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) fields.push(cur.trim());
  return fields;
}

const unquote = (s) => s.slice(1, -1).replace(/''/g, "'");
const parseArray = (s) =>
  splitFields(s.slice(s.indexOf("[") + 1, s.lastIndexOf("]"))).map(unquote);

const rows = parseTuples(body)
  .map((t) => t.trim())
  .filter((t) => t.startsWith("'"))
  .map((t) => {
    const f = splitFields(t);
    const [id, framework, clause, title, summary, recordTypes, version] = f;
    return {
      id: unquote(id),
      framework: unquote(framework),
      clause: unquote(clause),
      title: unquote(title),
      summary: unquote(summary),
      recordTypes: parseArray(recordTypes),
      version: unquote(version),
    };
  });

const byFile = {};
for (const r of rows) {
  const fw = FRAMEWORKS[r.framework];
  if (!fw) throw new Error(`Unknown framework (no derivation rule): ${r.framework}`);
  (byFile[fw.file] ??= []).push({
    id: r.id,
    framework: r.framework,
    clause: r.clause,
    title: r.title,
    summary: r.summary,
    recordTypes: r.recordTypes,
    version: r.version,
    kind: fw.kind,
    jurisdiction: fw.jurisdiction,
  });
}

const exportName = (file) => file;
for (const [file, defs] of Object.entries(byFile)) {
  const lines = defs.map((d) => "  " + JSON.stringify(d) + ",").join("\n");
  const ts = `// AUTO-GENERATED from docs/dronops_requirements_seed.sql (seed ${SEED_VERSION}).
// Do not hand-edit — re-run scripts/convert-seed.mjs. Summaries are verbatim,
// QM-reviewed content; kind/jurisdiction are derived per the seed conversion rules.
import type { RequirementDef } from "./types";

export const ${exportName(file)}: RequirementDef[] = [
${lines}
];
`;
  writeFileSync(join(outDir, `${file}.ts`), ts);
  console.log(`${file}.ts: ${defs.length}`);
}
console.log(`total: ${rows.length}`);
