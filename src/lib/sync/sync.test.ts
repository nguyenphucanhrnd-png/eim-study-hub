import { emptyDoc, isEmptyDoc, mergeDocs, type SyncDoc } from "./merge";
import { SyncEngine, type SyncLocal, type SyncMeta, type SyncRemote, type SyncStatus } from "./engine";
import type { ExamAttempt, ExamSession } from "@/store/examStore";

const stat = (attempts: number, correct: number, at: number, lastCorrect = correct === attempts) => ({ attempts, correct, lastCorrect, lastAnsweredAt: at });
const attempt = (id: string, examId: string, startedAt: number, finishedAt: number): ExamAttempt => ({
  id,
  examId,
  title: examId,
  startedAt,
  finishedAt,
  elapsedSec: 60,
  timedOut: false,
  correct: 1,
  total: 50,
  score10: 0.2,
  questionIds: [],
  optionOrder: {},
  answers: {},
});
const session = (examId: string, startedAt: number): ExamSession => ({
  exam: { id: examId, title: examId, durationMin: 60, questionIds: [] },
  startedAt,
  durationSec: 3600,
  answers: {},
  current: 0,
});
const doc = (patch: (d: SyncDoc) => void): SyncDoc => {
  const d = emptyDoc();
  patch(d);
  return d;
};

describe("mergeDocs", () => {
  it("keeps the newest answer per question and the matching wrong-bank entry", () => {
    const local = doc((d) => {
      d.progress.stats = { q1: stat(2, 1, 200), q2: stat(1, 1, 100) };
      d.progress.wrongBank = { q1: { addedAt: 200, streak: 0 } };
    });
    const remote = doc((d) => {
      d.progress.stats = { q1: stat(3, 3, 300), q3: stat(1, 0, 50, false) };
      d.progress.wrongBank = { q3: { addedAt: 50, streak: 0 } };
    });
    const m = mergeDocs(local, remote, "local");
    expect(m.progress.stats).toEqual({ q1: stat(3, 3, 300), q2: stat(1, 1, 100), q3: stat(1, 0, 50, false) });
    // q1 was answered correctly later on the other device → it left the wrong bank there.
    expect(m.progress.wrongBank).toEqual({ q3: { addedAt: 50, streak: 0 } });
  });

  it("unions attempts and case history, newest first", () => {
    const local = doc((d) => {
      d.exams.attempts = [attempt("a2", "EXAM-01", 10, 20)];
      d.cases.history = [{ caseId: "CASE-C3-01", score: 7, at: 5 }];
    });
    const remote = doc((d) => {
      d.exams.attempts = [attempt("a3", "EXAM-02", 30, 40), attempt("a2", "EXAM-01", 10, 20)];
      d.cases.history = [{ caseId: "CASE-C3-01", score: 9, at: 8 }];
    });
    const m = mergeDocs(local, remote, "remote");
    expect(m.exams.attempts.map((a) => a.id)).toEqual(["a3", "a2"]);
    expect(m.cases.history.map((h) => h.score)).toEqual([9, 7]);
  });

  it("resolves set-like data by mode", () => {
    const local = doc((d) => (d.progress.flagged = { q1: 1 }));
    const remote = doc((d) => (d.progress.flagged = { q2: 2 }));
    expect(mergeDocs(local, remote, "union").progress.flagged).toEqual({ q1: 1, q2: 2 });
    expect(mergeDocs(local, remote, "local").progress.flagged).toEqual({ q1: 1 });
    expect(mergeDocs(local, remote, "remote").progress.flagged).toEqual({ q2: 2 });
  });

  it("never resurrects an exam session that was already submitted", () => {
    const local = doc((d) => (d.exams.attempts = [attempt("x", "EXAM-03", 100, 200)]));
    const remote = doc((d) => (d.exams.sessions = { "EXAM-03": session("EXAM-03", 100) }));
    expect(mergeDocs(local, remote, "union").exams.sessions).toEqual({});
  });

  it("detects empty documents and tolerates partial ones", () => {
    expect(isEmptyDoc(emptyDoc())).toBe(true);
    expect(isEmptyDoc(doc((d) => (d.progress.learned = { "C1#a": true })))).toBe(false);
    expect(mergeDocs({} as SyncDoc, emptyDoc(), "union")).toEqual(emptyDoc());
  });
});

// ---------- engine ----------

class FakeServer implements SyncRemote {
  rows = new Map<string, { doc: SyncDoc; updatedAt: string }>();
  clock = 0;
  saves = 0;
  failNext = false;
  async fetch(userId: string) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("offline");
    }
    const r = this.rows.get(userId);
    return r ? { doc: structuredClone(r.doc), updatedAt: r.updatedAt } : null;
  }
  async save(userId: string, d: SyncDoc) {
    this.saves++;
    const updatedAt = `t${++this.clock}`;
    this.rows.set(userId, { doc: structuredClone(d), updatedAt });
    return updatedAt;
  }
}

class FakeDevice implements SyncLocal {
  state: SyncDoc = emptyDoc();
  meta: SyncMeta = { owner: null, lastSyncedAt: null };
  private listeners = new Set<() => void>();
  read() {
    return structuredClone(this.state);
  }
  write(d: SyncDoc) {
    this.state = structuredClone(d);
    this.listeners.forEach((l) => l());
  }
  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  /** Simulate the user doing something in the app. */
  edit(patch: (d: SyncDoc) => void) {
    patch(this.state);
    this.listeners.forEach((l) => l());
  }
}

function engineFor(server: FakeServer, device: FakeDevice, statuses: SyncStatus[] = []) {
  return new SyncEngine(server, device, { read: () => device.meta, write: (m) => (device.meta = m) }, (s) => statuses.push(s), 1000);
}

describe("SyncEngine", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("uploads a guest's local progress on first sign-in", async () => {
    const server = new FakeServer();
    const device = new FakeDevice();
    device.edit((d) => (d.progress.stats = { q1: stat(1, 1, 10) }));
    await engineFor(server, device).start("alice");
    expect(server.rows.get("alice")!.doc.progress.stats).toEqual({ q1: stat(1, 1, 10) });
    expect(device.meta).toEqual({ owner: "alice", lastSyncedAt: "t1" });
  });

  it("merges on a second device and propagates later changes both ways", async () => {
    const server = new FakeServer();
    const a = new FakeDevice();
    const b = new FakeDevice();
    const ea = engineFor(server, a);
    const eb = engineFor(server, b);
    a.edit((d) => (d.progress.flagged = { q1: 1 }));
    await ea.start("alice");
    b.edit((d) => (d.progress.learned = { "C3#traps": true }));
    await eb.start("alice"); // first sync on B → union
    expect(b.state.progress.flagged).toEqual({ q1: 1 });
    expect(server.rows.get("alice")!.doc.progress.learned).toEqual({ "C3#traps": true });

    // B unflags q1 (debounced upload), then A pulls on focus and adopts B's state.
    b.edit((d) => (d.progress.flagged = {}));
    await vi.advanceTimersByTimeAsync(1000);
    await eb.sync();
    expect(server.rows.get("alice")!.doc.progress.flagged).toEqual({});
    await ea.pull();
    expect(a.state.progress.flagged).toEqual({});
    expect(a.state.progress.learned).toEqual({ "C3#traps": true });
  });

  it("does not merge another account's local data on a shared computer", async () => {
    const server = new FakeServer();
    const device = new FakeDevice();
    const e = engineFor(server, device);
    device.edit((d) => (d.progress.stats = { q1: stat(1, 0, 5) }));
    await e.start("alice");
    e.stop(); // signed out without clearing local data
    await e.start("bob");
    expect(device.state.progress.stats).toEqual({});
    expect(server.rows.get("bob")!.doc.progress.stats).toEqual({});
    expect(server.rows.get("alice")!.doc.progress.stats).toEqual({ q1: stat(1, 0, 5) });
  });

  it("reports errors and retries the pending upload later", async () => {
    const server = new FakeServer();
    const device = new FakeDevice();
    const statuses: SyncStatus[] = [];
    const e = engineFor(server, device, statuses);
    await e.start("alice");
    server.failNext = true;
    device.edit((d) => (d.progress.cards = { c1: "known" }));
    await vi.advanceTimersByTimeAsync(1000);
    await e.flush().catch(() => undefined);
    expect(statuses.some((s) => s.state === "error")).toBe(true);
    await e.flush();
    expect(server.rows.get("alice")!.doc.progress.cards).toEqual({ c1: "known" });
    expect(statuses.at(-1)!.state).toBe("idle");
  });

  it("does not write when nothing changed", async () => {
    const server = new FakeServer();
    const device = new FakeDevice();
    const e = engineFor(server, device);
    device.edit((d) => (d.progress.learned = { x: true }));
    await e.start("alice");
    const saves = server.saves;
    await e.pull();
    await e.pull();
    expect(server.saves).toBe(saves);
  });
});
