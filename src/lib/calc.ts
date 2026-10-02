import type { Calc, CalcKind } from "@/schemas/mcq";

type Inputs = Record<string, number>;

const need = (inputs: Inputs, ...keys: string[]): number[] =>
  keys.map((k) => {
    const v = inputs[k];
    if (v === undefined) throw new Error(`missing input "${k}"`);
    return v;
  });

/** Formulas from KB §2.9 (revenue, gross profit/margin, FX), §6.5 (tolerance), §6.11 (insured amount). */
export const CALC_FORMULAS: Record<CalcKind, (inputs: Inputs) => number> = {
  revenue: (i) => {
    const [q, p] = need(i, "quantity", "price");
    return q! * p!;
  },
  "gross-profit": (i) => {
    const [r, c] = need(i, "revenue", "cogs");
    return r! - c!;
  },
  "gross-margin": (i) => {
    const [r, c] = need(i, "revenue", "cogs");
    return ((r! - c!) / r!) * 100;
  },
  "fx-value": (i) => {
    const [a, r] = need(i, "amount", "rate");
    return a! * r!;
  },
  "fx-gain-loss": (i) => {
    const [a, r0, r1] = need(i, "amount", "rateAtContract", "rateAtPayment");
    return a! * (r1! - r0!);
  },
  "insured-amount": (i) => {
    const [v, pct] = need(i, "value", "percent");
    return (v! * pct!) / 100;
  },
  "tolerance-min": (i) => {
    const [q, pct] = need(i, "quantity", "percent");
    return q! * (1 - pct! / 100);
  },
  "tolerance-max": (i) => {
    const [q, pct] = need(i, "quantity", "percent");
    return q! * (1 + pct! / 100);
  },
};

export function computeCalc(calc: Calc): number {
  return CALC_FORMULAS[calc.kind](calc.inputs);
}

const SCALE_WORDS: Record<string, number> = { billion: 1e9, bn: 1e9, million: 1e6, thousand: 1e3 };

/**
 * Extract numeric values from option text, honouring thousands separators and scale words:
 * "VND 1.40 billion" → [1.4e9], "EUR 50,400" → [50400], "12.5%" → [12.5].
 */
export function extractNumbers(text: string): number[] {
  const re = /(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s*(billion|bn|million|thousand)\b)?/gi;
  const out: number[] = [];
  for (const m of text.matchAll(re)) {
    const int = (m[1] ?? "0").replace(/,/g, "");
    const value = Number(m[2] ? `${int}.${m[2]}` : int);
    const scale = m[3] ? (SCALE_WORDS[m[3].toLowerCase()] ?? 1) : 1;
    out.push(value * scale);
  }
  return out;
}

export function textContainsValue(text: string, value: number): boolean {
  const tol = Math.max(1e-6, Math.abs(value) * 1e-9);
  return extractNumbers(text).some((n) => Math.abs(Math.abs(n) - Math.abs(value)) <= tol);
}
