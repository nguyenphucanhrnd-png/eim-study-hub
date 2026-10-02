import { applyStat, applyWrongBank, type WrongEntry } from "./progress";

describe("wrong-answer bank", () => {
  it("adds a question on a wrong answer", () => {
    const bank = applyWrongBank({}, "q1", false, 100);
    expect(bank.q1).toEqual({ addedAt: 100, streak: 0 });
  });

  it("ignores correct answers for questions not in the bank", () => {
    const bank: Record<string, WrongEntry> = {};
    expect(applyWrongBank(bank, "q1", true, 100)).toBe(bank);
  });

  it("removes a question after 2 consecutive correct answers", () => {
    let bank = applyWrongBank({}, "q1", false, 100);
    bank = applyWrongBank(bank, "q1", true, 200);
    expect(bank.q1?.streak).toBe(1);
    bank = applyWrongBank(bank, "q1", true, 300);
    expect(bank.q1).toBeUndefined();
  });

  it("resets the streak when answered wrong again, keeping the original addedAt", () => {
    let bank = applyWrongBank({}, "q1", false, 100);
    bank = applyWrongBank(bank, "q1", true, 200);
    bank = applyWrongBank(bank, "q1", false, 300);
    expect(bank.q1).toEqual({ addedAt: 100, streak: 0 });
    bank = applyWrongBank(bank, "q1", true, 400);
    expect(bank.q1?.streak).toBe(1);
  });
});

describe("question stats", () => {
  it("accumulates attempts and correct answers", () => {
    const a = applyStat(undefined, true, 1);
    const b = applyStat(a, false, 2);
    expect(b).toEqual({ attempts: 2, correct: 1, lastCorrect: false, lastAnsweredAt: 2 });
  });
});
