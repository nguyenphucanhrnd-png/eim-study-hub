import type { MCQ } from "@/schemas/mcq";
import { weakTopics } from "./insights";

const q = (id: string, chapter: MCQ["chapter"], topic: string) => ({ id, chapter, topic }) as MCQ;
const st = (attempts: number, correct: number) => ({ attempts, correct, lastCorrect: true, lastAnsweredAt: 0 });

describe("weakTopics", () => {
  const bank = [q("1", "C3", "fob"), q("2", "C3", "fob"), q("3", "C5", "lc"), q("4", "C2", "fx-risk"), q("5", "C6", "art-price")];

  it("aggregates per topic, needs ≥5 attempts and sorts by accuracy", () => {
    const stats = { "1": st(3, 1), "2": st(2, 1), "3": st(5, 4), "4": st(6, 3), "5": st(4, 0) };
    const res = weakTopics(bank, stats);
    expect(res.map((t) => t.topic)).toEqual(["fob", "fx-risk", "lc"]);
    expect(res[0]).toMatchObject({ chapter: "C3", attempts: 5, correct: 2, accuracy: 40 });
  });

  it("limits the list", () => {
    const stats = { "1": st(5, 0), "3": st(5, 1), "4": st(5, 2) };
    expect(weakTopics(bank, stats, 5, 2)).toHaveLength(2);
  });
});
