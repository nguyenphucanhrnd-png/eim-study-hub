import { PERILS } from "@/features/tools/icc/data";

/** C4 visual summary — nested coverage: ICC (C) ⊂ ICC (B) ⊂ ICC (A), from Table 6.2 (KB §4.5–4.6). */
export default function IccTiers() {
  const list = (tier: string) => PERILS.filter((p) => p.tier === tier);
  return (
    <figure className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="rounded-xl border-2 border-green-600 p-3 dark:border-green-500">
        <p className="text-sm font-bold text-green-800 dark:text-green-300">ICC (A) ≈ AR (All Risks) — rộng nhất, “all risks” trừ điểm loại trừ</p>
        <ul className="mt-1 grid gap-x-4 text-xs sm:grid-cols-2">
          {list("a-adds").map((p) => (
            <li key={p.id}>+ {p.en}</li>
          ))}
        </ul>
        <div className="mt-3 rounded-xl border-2 border-sky-600 p-3 dark:border-sky-500">
          <p className="text-sm font-bold text-sky-800 dark:text-sky-300">ICC (B) ≈ WA — named perils, rộng hơn C</p>
          <ul className="mt-1 grid gap-x-4 text-xs sm:grid-cols-2">
            {list("b-adds").map((p) => (
              <li key={p.id}>+ {p.en}</li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border-2 border-slate-500 p-3">
            <p className="text-sm font-bold">ICC (C) ≈ FPA — named perils, cơ bản/hẹp nhất</p>
            <ul className="mt-1 grid gap-x-4 text-xs sm:grid-cols-2">
              {list("major").map((p) => (
                <li key={p.id}>• {p.en}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-slate-600 dark:text-slate-400">
        Theft & Nondelivery: slide ghi Y cho cả A, B, C nhưng N cho WA, FPA — xem ghi chú ERRATA E-04. Tương ứng FPA≈C, WA≈B, AR≈A chỉ là
        gần đúng.
      </figcaption>
    </figure>
  );
}
