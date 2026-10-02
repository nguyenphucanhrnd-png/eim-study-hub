import { McqSchema, type MCQ } from "@/schemas/mcq";
import { BLUEPRINT, DIFFICULTIES, EXAM_COUNT, bankTargets, groupOf, topicCapPerExam } from "@/config/blueprint";
import type { ChapterId } from "@/config/chapters";
import { ERRATA_BY_ID, errataIdsFromTags } from "@/config/errata";
import { computeCalc, textContainsValue } from "@/lib/calc";

export interface BankFile {
  path: string;
  content: unknown;
}

export interface Issue {
  where: string;
  message: string;
}

export interface ValidateOptions {
  /** Chapters whose counts must match the blueprint. Default: all. Others only produce warnings. */
  completeChapters?: ChapterId[];
  examCount?: number;
}

export interface ValidateResult {
  questions: MCQ[];
  errors: Issue[];
  warnings: Issue[];
}

const AGGREGATE_OPTION = /\b(all of the above|none of the above|both [a-d] and [a-d])\b/i;
const CAPS_NEGATIVE = /\b(NOT|EXCEPT)\b/;
const lowercaseNegative = (stem: string) => /\b(which|what|who)\b[^?]*\b(not|except)\b/i.test(stem) && !CAPS_NEGATIVE.test(stem);

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function tokens(stem: string): Set<string> {
  return new Set(
    stem
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function validateBank(files: BankFile[], opts: ValidateOptions = {}): ValidateResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const questions: MCQ[] = [];
  const examCount = opts.examCount ?? EXAM_COUNT;

  // 1. Schema (incl. topic list, 4 options, correct ∈ options, whyWrong for each distractor, non-empty source).
  for (const file of files) {
    if (!Array.isArray(file.content)) {
      errors.push({ where: file.path, message: "file must contain a JSON array of questions" });
      continue;
    }
    file.content.forEach((item, idx) => {
      const parsed = McqSchema.safeParse(item);
      const id = typeof item === "object" && item && "id" in item ? String((item as { id: unknown }).id) : `#${idx}`;
      if (!parsed.success) {
        for (const iss of parsed.error.issues)
          errors.push({ where: `${file.path} ${id}`, message: `${iss.path.join(".") || "(root)"}: ${iss.message}` });
        return;
      }
      const expectedChapter = /c0?(\d)\.json$/i.exec(file.path)?.[1];
      if (expectedChapter && parsed.data.chapter !== `C${expectedChapter}`)
        errors.push({ where: `${file.path} ${id}`, message: `chapter ${parsed.data.chapter} stored in wrong file` });
      questions.push(parsed.data);
    });
  }

  // 2. Duplicate ids.
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) errors.push({ where: q.id, message: "duplicate id" });
    seen.add(q.id);
  }

  // 3. Per-question content rules.
  let negativeCount = 0;
  let aggregateCount = 0;
  for (const q of questions) {
    const ex = q.explanation;

    for (const eid of errataIdsFromTags(q.tags)) {
      const er = ERRATA_BY_ID[eid];
      if (!er) errors.push({ where: q.id, message: `unknown erratum tag ${eid}` });
      else if (er.mode === "N") errors.push({ where: q.id, message: `uses (N) erratum ${eid} — must not be tested` });
      else if (er.extNoteRequired && !ex.extNote) errors.push({ where: q.id, message: `(T) erratum ${eid} requires an extNote` });
    }
    if (ex.extNote && !ex.extNote.startsWith("[EXT]"))
      errors.push({ where: q.id, message: 'extNote must start with "[EXT]"' });

    // Calculation questions must carry inputs and must recompute to the correct option.
    const isCalc = q.tags.includes("calculation");
    if (isCalc && !q.calc) errors.push({ where: q.id, message: 'tagged "calculation" but has no calc field' });
    if (q.calc) {
      if (!isCalc) warnings.push({ where: q.id, message: 'has calc but no "calculation" tag' });
      try {
        const value = computeCalc(q.calc);
        if (Math.abs(value - q.calc.expected) > Math.max(1e-6, Math.abs(value) * 1e-9))
          errors.push({ where: q.id, message: `calc result ${value} ≠ expected ${q.calc.expected}` });
        const correctText = q.options.find((o) => o.id === q.correct)?.text ?? "";
        if (!textContainsValue(correctText, q.calc.expected))
          errors.push({ where: q.id, message: `correct option does not show ${q.calc.expected}` });
        for (const o of q.options)
          if (o.id !== q.correct && textContainsValue(o.text, q.calc.expected))
            errors.push({ where: q.id, message: `distractor ${o.id} also shows the expected value` });
      } catch (e) {
        errors.push({ where: q.id, message: `calc error: ${(e as Error).message}` });
      }
    }

    if (CAPS_NEGATIVE.test(q.stem)) negativeCount++;
    if (lowercaseNegative(q.stem)) warnings.push({ where: q.id, message: "negative stem should write NOT/EXCEPT in CAPS" });

    if (q.options.some((o) => AGGREGATE_OPTION.test(o.text))) {
      aggregateCount++;
      if (!q.lockOrder) errors.push({ where: q.id, message: "aggregate option (All/None/Both) requires lockOrder: true" });
    }

    if (wordCount(ex.summary) > 40) warnings.push({ where: q.id, message: `summary ${wordCount(ex.summary)} words (>40)` });
    const wc = wordCount(ex.whyCorrect);
    if (wc < 40 || wc > 120) warnings.push({ where: q.id, message: `whyCorrect ${wc} words (40–120)` });
    for (const [oid, txt] of Object.entries(ex.whyWrong)) {
      const n = wordCount(txt ?? "");
      if (n < 15 || n > 50) warnings.push({ where: q.id, message: `whyWrong.${oid} ${n} words (15–50)` });
    }
  }

  const n = questions.length;
  if (n > 0 && negativeCount / n > 0.1)
    errors.push({ where: "bank", message: `NOT/EXCEPT stems ${negativeCount}/${n} exceed 10%` });
  if (n > 0 && aggregateCount / n > 0.03)
    errors.push({ where: "bank", message: `All/None/Both options ${aggregateCount}/${n} exceed 3%` });

  // 4. Near-duplicate stems (token Jaccard > 0.8).
  const toks = questions.map((q) => tokens(q.stem));
  for (let i = 0; i < questions.length; i++)
    for (let j = i + 1; j < questions.length; j++) {
      const s = jaccard(toks[i]!, toks[j]!);
      if (s > 0.8)
        warnings.push({ where: `${questions[i]!.id} ~ ${questions[j]!.id}`, message: `near-duplicate stems (J=${s.toFixed(2)})` });
    }

  // 5. Blueprint counts per group × difficulty, and topic concentration.
  const complete = new Set<ChapterId>(opts.completeChapters ?? BLUEPRINT.map((g) => g.chapter));
  const targets = bankTargets(examCount);
  for (const g of BLUEPRINT) {
    const inGroup = questions.filter((q) => groupOf(q.chapter, q.topic).id === g.id);
    for (const d of DIFFICULTIES) {
      const have = inGroup.filter((q) => q.difficulty === d).length;
      const want = targets[g.id]![d];
      if (have !== want) {
        const issue = { where: `blueprint ${g.id}`, message: `difficulty ${d}: ${have} questions, blueprint needs ${want}` };
        (complete.has(g.chapter) ? errors : warnings).push(issue);
      }
    }
    const maxPerTopic = topicCapPerExam(g) * examCount;
    const byTopic = new Map<string, number>();
    for (const q of inGroup) byTopic.set(q.topic, (byTopic.get(q.topic) ?? 0) + 1);
    for (const [topic, cnt] of byTopic)
      if (cnt > maxPerTopic)
        (complete.has(g.chapter) ? errors : warnings).push({
          where: `blueprint ${g.id}`,
          message: `topic ${topic} has ${cnt} questions; cap is ${maxPerTopic} (≤${topicCapPerExam(g)}/exam)`,
        });
  }

  return { questions, errors, warnings };
}
