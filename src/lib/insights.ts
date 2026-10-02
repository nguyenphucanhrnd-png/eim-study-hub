import type { ChapterId } from "@/config/chapters";
import type { MCQ } from "@/schemas/mcq";
import type { QuestionStat } from "./progress";

export interface TopicAccuracy {
  chapter: ChapterId;
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

/** Topics with the lowest accuracy (ties → more attempts first), counting only topics with ≥ minAttempts. */
export function weakTopics(bank: MCQ[], stats: Record<string, QuestionStat>, minAttempts = 5, limit = 5): TopicAccuracy[] {
  const agg = new Map<string, TopicAccuracy>();
  for (const q of bank) {
    const s = stats[q.id];
    if (!s) continue;
    const key = `${q.chapter}/${q.topic}`;
    const cur = agg.get(key) ?? { chapter: q.chapter, topic: q.topic, attempts: 0, correct: 0, accuracy: 0 };
    cur.attempts += s.attempts;
    cur.correct += s.correct;
    agg.set(key, cur);
  }
  return [...agg.values()]
    .filter((t) => t.attempts >= minAttempts)
    .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.attempts) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit);
}
