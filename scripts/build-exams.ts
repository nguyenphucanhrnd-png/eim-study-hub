/**
 * npm run build:exams [-- --bank <dir>] [-- --out <file>] [-- --seed <n>]
 * Partitions the (fully valid) bank into EXAM_COUNT fixed exams per the blueprint.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { validateBank } from "../src/lib/bank/validate.ts";
import { buildExams } from "../src/lib/bank/buildExams.ts";
import { bankReport } from "../src/lib/bank/report.ts";
import type { ExamsFile } from "../src/schemas/exam.ts";
import { DEFAULT_BANK_DIR, DEFAULT_EXAMS_FILE, ROOT, parseArgs, readBank } from "./lib/io.ts";

const args = parseArgs(process.argv.slice(2));
const dir = typeof args.bank === "string" ? join(ROOT, args.bank) : DEFAULT_BANK_DIR;
const out = typeof args.out === "string" ? join(ROOT, args.out) : DEFAULT_EXAMS_FILE;
const seed = typeof args.seed === "string" ? Number(args.seed) : 20260101;

const { questions, errors } = validateBank(readBank(dir));
if (errors.length) {
  console.error(`✗ Bank has ${errors.length} error(s). Run npm run validate:bank first.`);
  process.exit(1);
}

const { exams, warnings } = buildExams(questions, { seed });
const file: ExamsFile = { seed, generatedFrom: relative(ROOT, dir).split(sep).join("/"), exams };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(file, null, 2) + "\n");

console.log(`build:exams — ${exams.length} exams written to ${relative(ROOT, out)} (seed ${seed})`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
const report = bankReport(questions, exams);
console.log("\n" + report.slice(report.indexOf("## Exams")));
