import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { BankFile } from "../../src/lib/bank/validate.ts";

export const ROOT = join(import.meta.dirname, "..", "..");
export const DEFAULT_BANK_DIR = join(ROOT, "src", "data", "questions");
export const DEFAULT_EXAMS_FILE = join(ROOT, "src", "data", "exams", "exams.json");

/** Minimal `--flag value` / `--flag` parser. */
export function parseArgs(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      out[a.slice(2)] = next;
      i++;
    } else out[a.slice(2)] = true;
  }
  return out;
}

export function readBank(dir: string): BankFile[] {
  if (!existsSync(dir)) throw new Error(`Bank directory not found: ${dir}`);
  return readdirSync(dir)
    .filter((f) => /^c0[1-8]\.json$/.test(f))
    .sort()
    .map((f) => {
      const p = join(dir, f);
      let content: unknown;
      try {
        content = JSON.parse(readFileSync(p, "utf8"));
      } catch (e) {
        content = { parseError: (e as Error).message };
      }
      return { path: relative(ROOT, p).split(sep).join("/"), content };
    });
}
