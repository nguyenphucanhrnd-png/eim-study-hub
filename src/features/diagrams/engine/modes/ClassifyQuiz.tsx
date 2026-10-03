import { useMemo, useState } from "react";
import { Button, cx } from "@/components/ui";

export interface ClassifyItem {
  id: string;
  textVi: string;
  bucket: string;
  /** Short reason shown after checking (from the KB). */
  whyVi?: string;
}

/** Score of a classification: share of items placed in the right bucket (0–100). */
export function scoreClassify(items: ClassifyItem[], answers: Record<string, string>): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => answers[i.id] === i.bucket).length / items.length) * 100);
}

/** Stable shuffle (seeded) so the order differs from the diagram order. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * "Phân loại" quiz: each card gets one bucket (buttons, fully keyboard-accessible), then Kiểm tra.
 * Used for "nước người bán hay người mua?", "nội bộ hay bên ngoài?", "Incoterms quy định / không quy định".
 */
export function ClassifyQuiz({
  items,
  buckets,
  instructions,
  onScore,
}: {
  items: ClassifyItem[];
  buckets: { id: string; label: string }[];
  instructions: string;
  onScore: (pct: number) => void;
}) {
  const [seed, setSeed] = useState(7);
  const order = useMemo(() => shuffle(items, seed), [items, seed]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const pct = scoreClassify(items, answers);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 dark:text-slate-300">{instructions}</p>
      <ul className="space-y-2">
        {order.map((it) => {
          const a = answers[it.id];
          const ok = a === it.bucket;
          return (
            <li
              key={it.id}
              className={cx(
                "rounded-lg border p-2 text-sm",
                checked ? (ok ? "border-correct bg-green-50 dark:bg-green-950/30" : "border-wrong bg-red-50 dark:bg-red-950/30") : "border-slate-200 dark:border-slate-700",
              )}
            >
              <p className="font-medium">{it.textVi}</p>
              <div role="radiogroup" aria-label={`Phân loại: ${it.textVi}`} className="mt-1.5 flex flex-wrap gap-1.5">
                {buckets.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={a === b.id}
                    disabled={checked}
                    onClick={() => setAnswers((x) => ({ ...x, [it.id]: b.id }))}
                    className={cx(
                      "rounded-md border px-2.5 py-1 text-xs font-semibold",
                      a === b.id ? "border-navy-700 bg-navy-800 text-white dark:border-navy-300 dark:bg-navy-300 dark:text-navy-950" : "border-slate-300 dark:border-slate-600",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {checked && !ok && (
                <p className="mt-1 text-xs text-wrong dark:text-red-400">
                  Đáp án: {buckets.find((b) => b.id === it.bucket)?.label}
                  {it.whyVi ? ` – ${it.whyVi}` : ""}
                </p>
              )}
              {checked && ok && it.whyVi && <p className="mt-1 text-xs text-correct dark:text-green-400">✓ {it.whyVi}</p>}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        {!checked ? (
          <Button
            disabled={Object.keys(answers).length < items.length}
            onClick={() => {
              setChecked(true);
              onScore(pct);
            }}
          >
            Kiểm tra
          </Button>
        ) : (
          <>
            <p className="font-semibold">
              Kết quả: {items.filter((i) => answers[i.id] === i.bucket).length}/{items.length} ({pct}%)
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setAnswers({});
                setChecked(false);
                setSeed((s) => s + 1);
              }}
            >
              Làm lại
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
