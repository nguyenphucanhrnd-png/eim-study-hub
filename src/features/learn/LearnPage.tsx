import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { CHAPTERS, chapterBySlug } from "@/config/chapters";
import { loadTheory } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { useProgress } from "@/store/progressStore";
import { Badge, ComingSoon, PageHeader, ProgressBar, cx } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import NotFoundPage from "@/features/NotFoundPage";
import { parseTheory, type TheorySection } from "./parseTheory";
import { TheoryBlocks } from "./TheoryBlocks";
import { MiniCheck } from "./MiniCheck";
import { DIAGRAMS } from "@/features/diagrams/catalog";

/**
 * Long chapters render their sections lazily (when within ~800px of the viewport) to keep the main thread
 * free on load. Everything renders at once for deep links, TOC navigation, Ctrl/Cmd+F and printing.
 */
function LazySection({ id, eager, children }: { id: string; eager: boolean; children: (show: boolean) => ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (eager || near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setNear(true);
    const obs = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager, near]);
  const show = eager || near;
  return (
    <section
      ref={ref}
      id={id}
      className="scroll-mt-20 border-t border-slate-200 pt-6 first-of-type:border-t-0 dark:border-slate-800"
      aria-labelledby={`${id}-h`}
      style={show ? undefined : { minHeight: "32rem" }}
    >
      {children(show)}
    </section>
  );
}

/**
 * Scroll to an element and keep it pinned while late content above it (lazy embeds) settles.
 * Stops after `ms` or as soon as the user scrolls/presses a key.
 */
function scrollAndPin(id: string, ms = 2000) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView();
  const end = performance.now() + ms;
  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  events.forEach((ev) => window.addEventListener(ev, stop, { once: true, passive: true }));
  const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const tick = () => {
    if (stopped || performance.now() > end) {
      events.forEach((ev) => window.removeEventListener(ev, stop));
      return;
    }
    if (Math.abs(el.getBoundingClientRect().top - offset) > 2) el.scrollIntoView();
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
}

/** Highlight the TOC entry of the section currently in view. */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function Toc({
  sections,
  chapterId,
  active,
  onNavigate,
}: {
  sections: TheorySection[];
  chapterId: string;
  active: string | null;
  onNavigate: (id: string) => void;
}) {
  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(id);
  };
  const learned = useProgress((s) => s.learned);
  return (
    <nav aria-label="Mục lục chương">
      <ol className="space-y-0.5 text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={go(s.id)}
              aria-current={active === s.id ? "location" : undefined}
              className={cx(
                "flex items-start gap-2 rounded-md px-2 py-1.5 leading-snug",
                active === s.id
                  ? "bg-navy-50 font-semibold text-navy-800 dark:bg-navy-900/60 dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              <span aria-hidden="true" className={learned[`${chapterId}#${s.id}`] ? "text-green-600" : "text-slate-300 dark:text-slate-600"}>
                ✔
              </span>
              <span>{s.title}</span>
              {learned[`${chapterId}#${s.id}`] && <span className="sr-only">(đã học)</span>}
            </a>
          </li>
        ))}
        {DIAGRAMS.some((d) => d.chapter === chapterId) && (
          <li className="pt-2">
            <p className="px-2 pb-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Sơ đồ</p>
            <ul>
              {DIAGRAMS.filter((d) => d.chapter === chapterId).map((d) => (
                <li key={d.id}>
                  <a
                    href={`#diagram-${d.id}`}
                    onClick={go(`diagram-${d.id}`)}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 leading-snug text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <span aria-hidden="true">◇</span>
                    <span>{d.titleVi}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        )}
        <li>
          <a href="#mini-check" onClick={go("mini-check")} className="block rounded-md px-2 py-1.5 pl-7 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            Mini-check
          </a>
        </li>
      </ol>
    </nav>
  );
}

function LearnedButton({ storageKey }: { storageKey: string }) {
  const learned = useProgress((s) => !!s.learned[storageKey]);
  const toggle = useProgress((s) => s.toggleLearned);
  return (
    <button
      type="button"
      onClick={() => toggle(storageKey)}
      aria-pressed={learned}
      className={cx(
        "shrink-0 rounded-lg border px-3 py-1 text-xs font-medium transition-colors duration-150",
        learned
          ? "border-green-600 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950/40 dark:text-green-300"
          : "border-slate-300 text-slate-600 hover:border-green-600 dark:border-slate-700 dark:text-slate-400",
      )}
    >
      {learned ? "✔ Đã học" : "Đánh dấu đã học"}
    </button>
  );
}

export default function LearnPage() {
  const { chapterId } = useParams();
  const chapter = chapterBySlug(chapterId);
  const source = useAsync(() => (chapter ? loadTheory(chapter.id) : Promise.resolve(null)), [chapter?.id]);
  const theory = useMemo(() => (source.status === "ready" && source.data ? parseTheory(source.data) : null), [source]);
  const ids = useMemo(() => theory?.sections.map((s) => s.id) ?? [], [theory]);
  const [renderAll, setRenderAll] = useState(() => typeof window !== "undefined" && !!window.location.hash);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const active = useActiveSection(ids);

  // Find-in-page and printing need every section in the DOM.
  useEffect(() => {
    if (renderAll) return;
    const onKey = (e: KeyboardEvent) => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f" && setRenderAll(true);
    const onPrint = () => setRenderAll(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeprint", onPrint);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeprint", onPrint);
    };
  }, [renderAll]);

  // TOC links: render everything first, then scroll, so the target does not move while earlier sections expand.
  const navigateTo = useCallback((targetId: string) => {
    setTocOpen(false);
    setRenderAll(true);
    setPendingTarget(targetId);
  }, []);
  useEffect(() => {
    if (!pendingTarget) return;
    const raf = window.requestAnimationFrame(() => {
      window.history.replaceState(null, "", `#${pendingTarget}`);
      scrollAndPin(pendingTarget);
      setPendingTarget(null);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pendingTarget]);
  const learnedMap = useProgress((s) => s.learned);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTocOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tocOpen]);

  // Scroll to the hash target once content has rendered (deep links like /learn/c3#rule-cif).
  useEffect(() => {
    if (!theory || !window.location.hash) return;
    scrollAndPin(decodeURIComponent(window.location.hash.slice(1)));
  }, [theory]);

  if (!chapter) return <NotFoundPage />;
  const learnedCount = ids.filter((id) => learnedMap[`${chapter.id}#${id}`]).length;
  const idx = CHAPTERS.findIndex((c) => c.id === chapter.id);
  const prev = CHAPTERS[idx - 1];
  const next = CHAPTERS[idx + 1];

  return (
    <>
      <PageHeader title={chapter.titleVi} subtitle={chapter.titleEn}>
        <Badge color={chapter.color}>{chapter.id}</Badge>
      </PageHeader>

      {source.status === "ready" && !theory && <ComingSoon phase={2} what={`Nội dung lý thuyết ${chapter.id}`} />}

      {theory && (
        <div className="xl:grid xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-8">
          <aside className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mục lục</p>
              <div className="mb-3 px-2">
                <ProgressBar value={ids.length ? (learnedCount / ids.length) * 100 : 0} color={chapter.color} label="Tiến độ đã học" />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Đã học {learnedCount}/{ids.length} mục
                </p>
              </div>
              <Toc sections={theory.sections} chapterId={chapter.id} active={active} onNavigate={navigateTo} />
            </div>
          </aside>

          <div className="min-w-0 max-w-[52rem] leading-relaxed">
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm xl:hidden dark:border-slate-700"
              aria-expanded={tocOpen}
              aria-controls="toc-drawer"
            >
              <Icon name="menu" className="h-4 w-4" /> Mục lục · đã học {learnedCount}/{ids.length}
            </button>

            <TheoryBlocks blocks={theory.intro} />

            {theory.sections.map((s, i) => (
              <LazySection key={s.id} id={s.id} eager={renderAll || i === 0}>
                {(show) => (
                  <>
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                      <h2 id={`${s.id}-h`} className="text-xl font-bold text-navy-900 dark:text-white">
                        {s.title}
                      </h2>
                      <LearnedButton storageKey={`${chapter.id}#${s.id}`} />
                    </div>
                    {show && <TheoryBlocks blocks={s.blocks} />}
                  </>
                )}
              </LazySection>
            ))}

            <section id="mini-check" className="scroll-mt-20 border-t border-slate-200 pt-6 dark:border-slate-800" aria-labelledby="mini-check-h">
              <h2 id="mini-check-h" className="mb-3 text-xl font-bold text-navy-900 dark:text-white">
                Mini-check: 5 câu ngẫu nhiên
              </h2>
              <MiniCheck chapter={chapter.id} />
            </section>

            <nav aria-label="Chuyển chương" className="mt-10 flex justify-between gap-4 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
              {prev ? (
                <Link to={`/learn/${prev.slug}`} className="text-navy-700 hover:underline dark:text-navy-200">
                  ← {prev.id}: {prev.shortVi}
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link to={`/learn/${next.slug}`} className="text-navy-700 hover:underline dark:text-navy-200">
                  {next.id}: {next.shortVi} →
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {tocOpen && theory && (
        <div className="fixed inset-0 z-40 xl:hidden" id="toc-drawer" role="dialog" aria-modal="true" aria-label="Mục lục chương">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setTocOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Mục lục</p>
              <button type="button" onClick={() => setTocOpen(false)} aria-label="Đóng mục lục" className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" autoFocus>
                <Icon name="close" />
              </button>
            </div>
            <Toc sections={theory.sections} chapterId={chapter.id} active={active} onNavigate={navigateTo} />
          </div>
        </div>
      )}
    </>
  );
}
