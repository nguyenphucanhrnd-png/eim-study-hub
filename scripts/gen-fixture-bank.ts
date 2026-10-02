/**
 * npm run fixture:bank — writes a SYNTHETIC 600-question bank to .fixtures/questions (git-ignored)
 * so validate/build/report can be exercised end-to-end before real content exists.
 * Never copy these into src/data: stems are placeholders, not course content.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeFixtureBank } from "../src/lib/bank/fixture.ts";
import { ROOT } from "./lib/io.ts";

const dir = join(ROOT, ".fixtures", "questions");
mkdirSync(dir, { recursive: true });
const bank = makeFixtureBank(7);
for (let c = 1; c <= 8; c++) {
  const qs = bank.filter((q) => q.chapter === `C${c}`);
  writeFileSync(join(dir, `c0${c}.json`), JSON.stringify(qs, null, 2));
}
console.log(`Wrote ${bank.length} synthetic questions to .fixtures/questions`);
