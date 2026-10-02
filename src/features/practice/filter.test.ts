import type { MCQ } from "@/schemas/mcq";
import { filterQuestions, type PracticeFilter } from "./filter";

const q = (id: string, chapter: MCQ["chapter"], topic: string, difficulty: MCQ["difficulty"]) => ({ id, chapter, topic, difficulty }) as MCQ;
const bank = [q("1", "C3", "fob", 1), q("2", "C3", "cif", 2), q("3", "C5", "lc", 3), q("4", "C5", "tt", 1)];
const base: PracticeFilter = { chapters: [], topic: null, difficulties: [], mode: "all" };
const ids = (f: Partial<PracticeFilter>, stats = {}, wrong = {}) => filterQuestions(bank, { ...base, ...f }, stats, wrong).map((x) => x.id);

describe("filterQuestions", () => {
  it("returns everything with an empty filter", () => expect(ids({})).toEqual(["1", "2", "3", "4"]));
  it("filters by chapters and difficulty", () => {
    expect(ids({ chapters: ["C5"] })).toEqual(["3", "4"]);
    expect(ids({ difficulties: [1] })).toEqual(["1", "4"]);
    expect(ids({ chapters: ["C3", "C5"], difficulties: [2, 3] })).toEqual(["2", "3"]);
  });
  it("applies the topic only when exactly one chapter is selected", () => {
    expect(ids({ chapters: ["C3"], topic: "cif" })).toEqual(["2"]);
    expect(ids({ chapters: ["C3", "C5"], topic: "cif" })).toEqual(["1", "2", "3", "4"]);
  });
  it("supports not-yet-done and wrong-bank modes", () => {
    const stats = { "1": { attempts: 1, correct: 1, lastCorrect: true, lastAnsweredAt: 0 } };
    expect(ids({ mode: "new" }, stats)).toEqual(["2", "3", "4"]);
    expect(ids({ mode: "wrong" }, stats, { "3": { addedAt: 0, streak: 0 } })).toEqual(["3"]);
  });
});
