/**
 * Question topic → diagram (and step) for the "Xem trên sơ đồ" button in MCQ explanations
 * (DIAGRAMS_PROMPT §3.6). Checked in tests: every diagram and step exists.
 */
export interface DiagramTarget {
  diagram: string;
  step?: string;
}

const RULE_TOPICS = ["exw", "fca", "fas", "fob", "cfr", "cif", "cpt", "cip", "dap", "dpu", "ddp"].map((r) => `rule-${r}`);

export const TOPIC_DIAGRAM: Record<string, DiagramTarget> = {
  // C1
  "export-process-steps": { diagram: "c1-export-process" },
  "two-flows": { diagram: "c1-two-flows" },
  "order-process": { diagram: "c1-order-process" },
  players: { diagram: "c1-stakeholder-hub" },
  "service-providers": { diagram: "c1-stakeholder-hub" },
  // C3
  "pricing-objectives": { diagram: "c3-pricing-objectives" },
  "incoterms-basics": { diagram: "c3-incoterms-purpose-scope" },
  "incoterms-scope": { diagram: "c3-incoterms-purpose-scope" },
  "carriage-stages": { diagram: "c3-carriage-incoterms" },
  "rule-comparison": { diagram: "c3-carriage-incoterms" },
  ...Object.fromEntries(RULE_TOPICS.map((t) => [t, { diagram: "c3-carriage-incoterms" }])),
  // C4
  "incoterms-insurance": { diagram: "c3-carriage-incoterms" },
  // C5
  consignment: { diagram: "c5-method-compare" },
  "open-account": { diagram: "c5-method-compare" },
  "method-selection": { diagram: "c5-method-compare" },
  "tt-advance": { diagram: "c5-tt-advance" },
  "tt-deferred": { diagram: "c5-tt-deferred" },
  "documentary-collection": { diagram: "c5-documentary-collection" },
  "dp-da": { diagram: "c5-documentary-collection", step: "s5" },
  "bill-of-exchange": { diagram: "c5-documentary-collection", step: "s1" },
  "lc-concept": { diagram: "c5-lc-basic", step: "s1" },
  "lc-parties": { diagram: "c5-lc-basic" },
  "lc-procedure": { diagram: "c5-lc-basic" },
  "lc-contents": { diagram: "c5-lc-basic", step: "s2" },
  "lc-checklist": { diagram: "c5-lc-basic", step: "s3" },
  "lc-dates": { diagram: "c5-lc-basic", step: "s5" },
  discrepancies: { diagram: "c5-lc-basic", step: "s6" },
  // C7
  "bl-functions": { diagram: "c5-lc-fig113", step: "s10" },
  // C8
  "implementation-considerations": { diagram: "c8-export-procedure", step: "e1" },
  "export-procedure": { diagram: "c8-export-procedure" },
  "import-procedure": { diagram: "c8-import-procedure" },
  "incoterms-procedure-link": { diagram: "c8-export-procedure", step: "e5" },
};

export const diagramHref = (t: DiagramTarget) => `/diagrams/${t.diagram}${t.step ? `?step=${t.step}` : ""}`;
