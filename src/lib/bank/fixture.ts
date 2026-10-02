import type { MCQ } from "@/schemas/mcq";
import { BLUEPRINT, DIFFICULTIES, bankTargets, groupTopics } from "@/config/blueprint";
import { createRng, shuffle } from "@/lib/rng";

const words = (n: number, w: string) => Array(n).fill(w).join(" ");

/**
 * Synthetic bank that exactly matches the blueprint, for tests and script smoke-runs.
 * Topics are spread round-robin; stems are unique filler text.
 */
export function makeFixtureBank(seed: number, examCount = 12): MCQ[] {
  const rng = createRng(seed);
  const targets = bankTargets(examCount);
  const out: MCQ[] = [];
  const counters = new Map<string, number>();
  for (const g of BLUEPRINT) {
    const topics = groupTopics(g);
    let k = Math.floor(rng() * topics.length);
    for (const d of DIFFICULTIES)
      for (let i = 0; i < targets[g.id]![d]; i++) {
        const topic = topics[k++ % topics.length]!;
        const key = `${g.chapter}-${topic}`;
        const n = (counters.get(key) ?? 0) + 1;
        counters.set(key, n);
        const correct = shuffle(["a", "b", "c", "d"] as const, rng)[0]!;
        const whyWrong: MCQ["explanation"]["whyWrong"] = {};
        for (const o of ["a", "b", "c", "d"] as const) if (o !== correct) whyWrong[o] = words(20, "sai");
        out.push({
          id: `${key}-${String(n).padStart(3, "0")}`,
          chapter: g.chapter,
          topic,
          difficulty: d,
          cognitive: d === 1 ? "remember" : d === 2 ? "apply" : "analyze",
          stem: `Fixture ${key} number ${n} ${Math.floor(rng() * 1e9).toString(36)} ${Math.floor(rng() * 1e9).toString(36)}?`,
          options: (["a", "b", "c", "d"] as const).map((id) => ({ id, text: `Option ${id}` })),
          correct,
          explanation: { summary: "Tóm tắt.", whyCorrect: words(50, "đúng"), whyWrong, source: "KB fixture" },
          tags: ["fixture"],
        });
      }
  }
  return out;
}
