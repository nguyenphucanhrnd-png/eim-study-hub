import { CHAPTERS } from "@/config/chapters";
import { createRng } from "@/lib/rng";
import { edgeGeometry, nodeBox } from "./engine/geometry";
import { buildGapQuestion, quizSteps, scoreOrder, shuffledForOrderQuiz, type PoolStep } from "./engine/quiz";
import { provenanceLabel } from "./engine/style";
import { playFrames, resolveVariant, type DiagramSpec } from "./engine/types";
import { validateDiagram } from "./engine/validate";
import { DIAGRAMS, loadAllSpecs, loadStepPool } from "./catalog";

/** Expected step counts (DIAGRAMS_PROMPT §6). Diagrams are added here as they are built. */
export const EXPECTED_STEPS: Record<string, number> = {
  "c5-lc-basic": 9,
  "c5-tt-advance": 5,
  "c5-tt-deferred": 5,
  "c5-documentary-collection": 7,
  "c5-lc-fig113": 11,
  "c8-export-procedure": 10,
  "c8-import-procedure": 9,
};

let specs: DiagramSpec[] = [];
beforeAll(async () => {
  specs = await loadAllSpecs();
});

describe("diagram specs", () => {
  it("every registered data spec passes validation", () => {
    for (const s of specs) expect(validateDiagram(s), s.id).toEqual([]);
  });

  it("step counts match the slides", () => {
    for (const [id, n] of Object.entries(EXPECTED_STEPS)) {
      const s = specs.find((x) => x.id === id);
      expect(s, id).toBeDefined();
      expect(quizSteps(s!).length, id).toBe(n);
    }
  });

  it("registry metadata agrees with the specs", () => {
    for (const s of specs) {
      const m = DIAGRAMS.find((d) => d.id === s.id)!;
      expect(m.chapter).toBe(s.chapter);
      expect(m.provenance).toBe(s.provenance);
      expect(m.stepCount).toBe(s.steps.length || s.nodes.length);
      if (s.provenance === "slide") expect(s.slideRef).toMatch(/^C\d p\.\d+/);
    }
  });

  it("every theory section anchor used by the registry exists in the chapter topics or theory", () => {
    for (const d of DIAGRAMS) expect(CHAPTERS.some((c) => c.id === d.chapter)).toBe(true);
  });

  it("L/C (slide C5 p.20): arrows run exactly as on the slide", () => {
    const s = specs.find((x) => x.id === "c5-lc-basic")!;
    const arrow = (n: number) => {
      const step = s.steps.find((st) => st.order === n)!;
      const e = s.edges.find((ed) => ed.id === step.edgeIds[0])!;
      return `${e.from}→${e.to}`;
    };
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(arrow)).toEqual([
      "importer→issuing",
      "issuing→advising",
      "advising→exporter",
      "exporter→importer",
      "exporter→advising",
      "advising→issuing",
      "issuing→advising",
      "issuing→importer",
      "advising→exporter",
    ]);
    expect(s.steps.find((st) => st.order === 9)!.ext).toMatch(/E-15/);
    expect(s.edges.find((e) => e.id === "e4")!.kind).toBe("goods");
  });
});

describe("validator", () => {
  const base: DiagramSpec = {
    id: "c5-x",
    chapter: "C5",
    title: "T",
    titleVi: "T",
    provenance: "slide",
    slideRef: "C5 p.1",
    nodes: [
      { id: "a", label: "A", role: "seller", x: 100, y: 100 },
      { id: "b", label: "B", role: "buyer", x: 500, y: 100 },
    ],
    edges: [{ id: "e1", from: "a", to: "b", kind: "goods" }],
    steps: [{ id: "s1", order: 1, title: "t", titleVi: "t", edgeIds: ["e1"], actors: ["a"], what: "w", why: "y", source: "KB" }],
    keyTakeaways: ["k"],
  };
  it("accepts a minimal valid spec", () => expect(validateDiagram(base)).toEqual([]));
  it("rejects a missing node, a gap in numbering, a slide without slideRef and an unknown topic", () => {
    const bad = structuredClone(base);
    bad.edges.push({ id: "e2", from: "a", to: "zzz", kind: "money" });
    bad.steps.push({ ...bad.steps[0]!, id: "s3", order: 3, practiceTopic: "not-a-topic" });
    delete bad.slideRef;
    const msgs = validateDiagram(bad).map((i) => i.message).join(" | ");
    expect(msgs).toMatch(/missing node "zzz"/);
    expect(msgs).toMatch(/1…2 without gaps/);
    expect(msgs).toMatch(/slideRef/);
    expect(msgs).toMatch(/unknown practiceTopic/);
  });
  it("allows sub-steps such as 5b only with a parent step", () => {
    const ok = structuredClone(base);
    ok.steps.push({ ...ok.steps[0]!, id: "s1b", order: 1, badge: "1b" });
    expect(validateDiagram(ok)).toEqual([]);
    const orphan = structuredClone(base);
    orphan.steps.push({ ...orphan.steps[0]!, id: "s4b", order: 4, badge: "4b" });
    expect(validateDiagram(orphan).map((i) => i.message).join()).toMatch(/no parent/);
  });
});

describe("engine helpers", () => {
  it("clips edges to node outlines and offsets parallel arrows", () => {
    const a = { id: "a", label: "A", role: "seller" as const, x: 0, y: 0, w: 200, h: 100, shape: "ellipse" as const };
    const b = { id: "b", label: "B", role: "buyer" as const, x: 600, y: 0, w: 200, h: 100 };
    const g = edgeGeometry({ id: "e", from: "a", to: "b", kind: "goods" }, a, b);
    expect(g.x1).toBeGreaterThan(nodeBox(a).hw);
    expect(g.x2).toBeLessThan(600 - nodeBox(b).hw);
    const up = edgeGeometry({ id: "e", from: "a", to: "b", kind: "goods", curve: 30 }, a, b);
    expect(up.y1).toBeCloseTo(30);
  });

  it("plays parallel lanes together", () => {
    const steps = [
      { id: "g1", order: 1, lane: "goods" },
      { id: "g2", order: 2, lane: "goods" },
      { id: "m1", order: 1, lane: "money" },
    ].map((s) => ({ ...s, title: "t", titleVi: "t", edgeIds: [], actors: ["a"], what: "w", why: "y", source: "s" }));
    const lanes = [{ id: "goods", label: "G" }, { id: "money", label: "M" }];
    expect(playFrames({ steps, lanes, playback: "parallel-lanes" }).map((f) => f.map((s) => s.id))).toEqual([["g1", "m1"], ["g2"]]);
    expect(playFrames({ steps, lanes }).length).toBe(3);
  });

  it("labels provenance in Vietnamese", () => {
    expect(provenanceLabel("slide", "C5 p.20")).toBe("Sơ đồ từ slide – Chương 5, trang 20");
    expect(provenanceLabel("derived")).toBe("Sơ đồ tổng hợp từ nội dung slide");
  });

  it("resolves variants by replacing fields", () => {
    const s = specs.find((x) => x.id === "c5-lc-basic")!;
    expect(resolveVariant(s, null).steps).toBe(s.steps);
  });
});

describe("quiz logic", () => {
  const ids = ["a", "b", "c", "d"];
  it("scores order per position", () => {
    expect(scoreOrder(ids, ids).pct).toBe(100);
    const r = scoreOrder(["b", "a", "c", "d"], ids);
    expect(r.correctAt).toEqual([false, false, true, true]);
    expect(r.correctPosition).toEqual([2, 1, 3, 4]);
    expect(r.pct).toBe(50);
  });
  it("never starts the order quiz already solved", () => {
    const s = specs.find((x) => x.id === "c5-lc-basic")!;
    const steps = quizSteps(s);
    for (let seed = 1; seed < 30; seed++) {
      const out = shuffledForOrderQuiz(steps, createRng(seed));
      expect(out.map((x) => x.id)).not.toEqual(steps.map((x) => x.id));
      expect([...out].map((x) => x.id).sort()).toEqual(steps.map((x) => x.id).sort());
    }
  });
  it("gap quiz: 4 distinct options, distractors only from other diagrams", async () => {
    const s = specs.find((x) => x.id === "c5-lc-basic")!;
    const pool: PoolStep[] = await loadStepPool();
    for (let seed = 1; seed < 20; seed++) {
      const q = buildGapQuestion(quizSteps(s), s.id, pool, createRng(seed))!;
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.titleVi)).size).toBe(4);
      const own = new Set(s.steps.map((st) => st.titleVi));
      expect(q.options.filter((o) => own.has(o.titleVi))).toHaveLength(1);
    }
  });
});
