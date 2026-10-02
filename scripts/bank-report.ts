/** npm run report:bank [-- --bank <dir>] [-- --exams <file>] */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateBank } from "../src/lib/bank/validate.ts";
import { bankReport } from "../src/lib/bank/report.ts";
import { ExamsFileSchema } from "../src/schemas/exam.ts";
import { DEFAULT_BANK_DIR, DEFAULT_EXAMS_FILE, ROOT, parseArgs, readBank } from "./lib/io.ts";

const args = parseArgs(process.argv.slice(2));
const dir = typeof args.bank === "string" ? join(ROOT, args.bank) : DEFAULT_BANK_DIR;
const examsPath = typeof args.exams === "string" ? join(ROOT, args.exams) : DEFAULT_EXAMS_FILE;

const { questions } = validateBank(readBank(dir), { completeChapters: [] });
const exams = existsSync(examsPath) ? ExamsFileSchema.parse(JSON.parse(readFileSync(examsPath, "utf8"))).exams : [];
console.log(bankReport(questions, exams));
