import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHAPTER_BY_ID, type ChapterId } from "@/config/chapters";

export interface ChapterBar {
  chapter: ChapterId;
  correct: number;
  total: number;
}

/** % correct per chapter. Decorative for screen readers: the same data is in the table next to it. */
export default function ChapterChart({ data }: { data: ChapterBar[] }) {
  const rows = data.map((d) => ({ ...d, pct: d.total ? Math.round((d.correct / d.total) * 100) : 0 }));
  return (
    <div aria-hidden className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.15} />
          <XAxis dataKey="chapter" tick={{ fill: "currentColor", fontSize: 12 }} tickLine={false} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fill: "currentColor", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fillOpacity: 0.08 }}
            formatter={(_v, _n, item) => {
              const p = item.payload as (typeof rows)[number];
              return [`${p.pct}% (${p.correct}/${p.total})`, CHAPTER_BY_ID[p.chapter].shortVi];
            }}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.chapter} fill={CHAPTER_BY_ID[r.chapter].color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
