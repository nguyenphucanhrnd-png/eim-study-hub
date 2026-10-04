import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CHAPTERS, CHAPTER_BY_ID, type ChapterId } from "@/config/chapters";
import { loadGlossary } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { foldVi } from "@/lib/text";
import { PageHeader, cx } from "@/components/ui";

export default function GlossaryPage() {
  const data = useAsync(loadGlossary, []);
  const [q, setQ] = useState("");
  const [chapter, setChapter] = useState<ChapterId | "all">("all");
  const entries = data.status === "ready" ? data.data : [];

  const results = useMemo(() => {
    const needle = foldVi(q.trim());
    return entries
      .filter((e) => chapter === "all" || e.chapter === chapter)
      .filter((e) => !needle || foldVi(`${e.en} ${e.vi}`).includes(needle))
      .sort((a, b) => a.en.localeCompare(b.en));
  }, [entries, q, chapter]);

  return (
    <>
      <PageHeader title="Thuật ngữ EN–VI" subtitle="Tra cứu tức thì; gõ tiếng Anh hoặc tiếng Việt (có dấu hay không dấu đều được)." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label htmlFor="glossary-q" className="mb-1 block text-sm font-medium">
            Tìm thuật ngữ
          </label>
          <input
            id="glossary-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="vd: subrogation, thu tin dung, vận đơn…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="glossary-ch" className="mb-1 block text-sm font-medium">
            Chương
          </label>
          <select
            id="glossary-ch"
            value={chapter}
            onChange={(e) => setChapter(e.target.value as ChapterId | "all")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:[color-scheme:dark]"
          >
            <option value="all">Tất cả</option>
            {CHAPTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} – {c.shortVi}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-2 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
        {results.length} thuật ngữ
      </p>
      {/* overflow-clip (not overflow-hidden) rounds the corners without creating a scroll box, so the header can stick below the app bar. */}
      <div className="overflow-clip rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse">
          <thead className="sticky top-14 z-10 bg-slate-100 text-left text-sm dark:bg-slate-800">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">
                English
              </th>
              <th scope="col" className="px-4 py-2 font-semibold">
                Tiếng Việt
              </th>
              <th scope="col" className="w-20 px-4 py-2 font-semibold">
                Chương
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((e) => {
              const ch = e.chapter ? CHAPTER_BY_ID[e.chapter] : null;
              return (
                <tr key={e.en} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-2 font-medium">{e.en}</td>
                  <td className="px-4 py-2">{e.vi}</td>
                  <td className="px-4 py-2">
                    {ch && (
                      <Link to={`/learn/${ch.slug}`} className={cx("rounded px-1.5 py-0.5 text-xs font-semibold text-white")} style={{ backgroundColor: ch.color }}>
                        {ch.id}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {results.length === 0 && data.status === "ready" && <p className="p-4 text-slate-600 dark:text-slate-400">Không tìm thấy thuật ngữ phù hợp.</p>}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Nguồn: KB §10 – Glossary EN–VI.</p>
    </>
  );
}
