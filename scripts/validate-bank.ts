/**
 * npm run validate:bank [-- --bank <dir>] [-- --chapters C3,C5] [-- --warnings]
 * Fails (exit 1) on schema errors, duplicate ids, (N)-errata use, wrong calculations,
 * blueprint count mismatches, and invalid case studies (src/data/cases/cases.json). With --chapters, only the listed chapters must match
 * the blueprint (used while the bank is generated chapter by chapter).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateBank } from "../src/lib/bank/validate.ts";
import { validateCases } from "../src/lib/bank/validateCases.ts";
import { CHAPTER_IDS, type ChapterId } from "../src/config/chapters.ts";
import { DEFAULT_BANK_DIR, ROOT, parseArgs, readBank } from "./lib/io.ts";

const args = parseArgs(process.argv.slice(2));
const dir = typeof args.bank === "string" ? join(ROOT, args.bank) : DEFAULT_BANK_DIR;
const files = readBank(dir);

let completeChapters: ChapterId[] | undefined;
if (typeof args.chapters === "string") {
  completeChapters = args.chapters.split(",").map((c) => c.trim().toUpperCase()) as ChapterId[];
  const bad = completeChapters.filter((c) => !(CHAPTER_IDS as readonly string[]).includes(c));
  if (bad.length) throw new Error(`Unknown chapters: ${bad.join(", ")}`);
} else if (args.partial === true) completeChapters = [];

const { questions, errors, warnings } = validateBank(files, { completeChapters });

// Case studies: schema always enforced; per-chapter targets only in a full (non-partial) run.
const caseFile = join(ROOT, "src", "data", "cases", "cases.json");
const caseRes = validateCases(JSON.parse(readFileSync(caseFile, "utf8")), { enforceTargets: completeChapters === undefined });
errors.push(...caseRes.errors);
warnings.push(...caseRes.warnings);

console.log(`validate:bank — ${files.length} file(s), ${questions.length} valid question(s) in ${dir}; ${caseRes.cases.length} case(s)`);
if (completeChapters) console.log(`Blueprint enforced for: ${completeChapters.length ? completeChapters.join(", ") : "(none, --partial)"}`);

const showAllWarnings = args.warnings === true;
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s)${showAllWarnings ? "" : " (first 20; use --warnings for all)"}`);
  for (const w of showAllWarnings ? warnings : warnings.slice(0, 20)) console.log(`  - [${w.where}] ${w.message}`);
}
if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s)`);
  for (const e of errors) console.log(`  - [${e.where}] ${e.message}`);
  process.exit(1);
}
console.log("\n✓ No errors.");
