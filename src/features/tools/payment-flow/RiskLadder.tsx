import { Callout } from "@/components/ui/Callout";
import { RISK_LADDER } from "./data";

/** [EXT] Exporter vs importer risk ladder (KB §5.5, Trade Finance Guide). */
export function RiskLadder() {
  const n = RISK_LADDER.length;
  return (
    <Callout kind="ext" title="Mở rộng – So sánh rủi ro nhà XK vs nhà NK">
      <p>
        Thang rủi ro cho <strong>nhà xuất khẩu</strong> từ thấp đến cao; với nhà nhập khẩu thì ngược lại. (Nguồn: U.S. Department of
        Commerce/ITA, <em>Trade Finance Guide</em> – nội dung [EXT], không phải từ slide.)
      </p>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-600 dark:text-slate-400">
            <th scope="col" className="py-1 pr-2">
              Phương thức
            </th>
            <th scope="col" className="w-1/4 py-1 pr-2">
              Rủi ro nhà XK
            </th>
            <th scope="col" className="w-1/4 py-1">
              Rủi ro nhà NK
            </th>
          </tr>
        </thead>
        <tbody>
          {RISK_LADDER.map((m, i) => (
            <tr key={m}>
              <th scope="row" className="py-1 pr-2 text-left font-normal">
                {m}
              </th>
              <td className="py-1 pr-2">
                <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${((i + 1) / n) * 100}%` }} />
                <span className="sr-only">hạng {i + 1}/{n}</span>
              </td>
              <td className="py-1">
                <div className="h-2.5 rounded-full bg-amber-600" style={{ width: `${((n - i) / n) * 100}%` }} />
                <span className="sr-only">hạng {n - i}/{n}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Callout>
  );
}

export default RiskLadder;
