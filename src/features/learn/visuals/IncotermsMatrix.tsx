import { cx } from "@/components/ui";
import { RULES, STAGES, type Party } from "@/features/tools/incoterms/data";

const COLOR: Record<Party, string> = { S: "bg-blue-500 dark:bg-blue-400", B: "bg-amber-400 dark:bg-amber-500" };

/** C3 visual summary: all 11 rules — upper bar = costs, lower bar = risk; red tick = risk transfer (KB §3.8). */
export default function IncotermsMatrix() {
  return (
    <figure className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <caption className="sr-only">Ma trận 11 điều kiện Incoterms 2020: chi phí (thanh trên) và rủi ro (thanh dưới) theo 9 chặng</caption>
          <thead>
            <tr>
              <th scope="col" className="w-16 p-1 text-left">
                Rule
              </th>
              {STAGES.map((s) => (
                <th key={s.id} scope="col" className="p-1 text-center font-medium leading-tight" title={s.en}>
                  {s.vi}
                </th>
              ))}
              <th scope="col" className="w-28 p-1 text-left">
                Bảo hiểm
              </th>
            </tr>
          </thead>
          <tbody>
            {RULES.map((r) => {
              const riskIdx = r.risks.indexOf("B");
              return (
                <tr key={r.code} className="border-t border-slate-100 dark:border-slate-800">
                  <th scope="row" className="p-1 text-left font-bold">
                    {r.code}
                    <span className="block text-[0.65rem] font-normal text-slate-600 dark:text-slate-400">{r.mode === "sea" ? "biển" : "mọi PT"}</span>
                  </th>
                  {STAGES.map((s, i) => (
                    <td key={s.id} className={cx("p-0.5", i === riskIdx && "border-l-[3px] border-red-600 dark:border-red-400")}>
                      <div className={cx("h-2.5 rounded-sm", COLOR[r.costs[i]!])} />
                      <div className={cx("mt-0.5 h-2.5 rounded-sm opacity-70", COLOR[r.risks[i]!])} />
                      <span className="sr-only">
                        chi phí: {r.costs[i] === "S" ? "bán" : "mua"}; rủi ro: {r.risks[i] === "S" ? "bán" : "mua"}
                      </span>
                    </td>
                  ))}
                  <td className="p-1">{r.insurance === "none" ? "—" : `Bán: ${r.insurance}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <span>Thanh trên = chi phí · thanh dưới = rủi ro</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-blue-500" /> người bán
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-amber-400" /> người mua
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-[3px] bg-red-600" /> điểm chuyển rủi ro
        </span>
      </figcaption>
    </figure>
  );
}
