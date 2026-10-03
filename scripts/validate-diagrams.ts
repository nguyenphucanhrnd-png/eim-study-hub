/**
 * npm run validate:diagrams — fails (exit 1) when a diagram spec is invalid (DIAGRAMS_PROMPT §6):
 * Zod schema, edges/steps pointing at missing nodes/edges, step numbers not 1…n, missing what/why/source,
 * unknown practiceTopic, slide diagram without slideRef; plus registry metadata that disagrees with the spec.
 */
import { validateDiagram, type DiagramIssue } from "../src/features/diagrams/engine/validate.ts";
import { DIAGRAMS } from "../src/features/diagrams/catalog.ts";

const issues: DiagramIssue[] = [];
let checked = 0;
for (const meta of DIAGRAMS) {
  if (!meta.loadSpec) continue;
  const spec = await meta.loadSpec();
  checked++;
  issues.push(...validateDiagram(spec));
  const add = (message: string) => issues.push({ where: `registry ${meta.id}`, message });
  if (spec.id !== meta.id) add(`spec id "${spec.id}" ≠ registry id`);
  if (spec.chapter !== meta.chapter) add(`chapter ${spec.chapter} ≠ ${meta.chapter}`);
  if (spec.provenance !== meta.provenance) add(`provenance ${spec.provenance} ≠ ${meta.provenance}`);
  if (spec.slideRef !== meta.slideRef) add(`slideRef ${spec.slideRef} ≠ ${meta.slideRef}`);
  const count = spec.steps.length || spec.nodes.length;
  if (count !== meta.stepCount) add(`stepCount ${meta.stepCount} ≠ ${count} in spec`);
}
console.log(`validate:diagrams — ${DIAGRAMS.length} diagram(s), ${checked} data spec(s) checked`);
if (issues.length) {
  console.log(`\n✗ ${issues.length} error(s)`);
  for (const i of issues) console.log(`  - [${i.where}] ${i.message}`);
  process.exit(1);
}
console.log("✓ No errors.");
