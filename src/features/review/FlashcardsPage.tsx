import { useEffect, useMemo, useState } from "react";
import { CHAPTERS, type ChapterId } from "@/config/chapters";
import { loadFlashcards, loadGlossary } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { useProgress } from "@/store/progressStore";
import { Button, PageHeader, cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import type { Flashcard } from "@/schemas/glossary";

type Deck = "en-vi" | "vi-en" | "concept";

async function loadDecks() {
  const [glossary, concepts] = await Promise.all([loadGlossary(), loadFlashcards()]);
  // Term cards are derived from the glossary so the two never drift apart.
  const terms = glossary.map((g, i) => ({ id: `term-${i}-${g.en}`, chapter: g.chapter ?? "C1", en: g.en, vi: g.vi }));
  return { terms, concepts };
}

interface Card {
  id: string;
  chapter: ChapterId;
  front: string;
  back: string;
  source?: string;
}

export default function FlashcardsPage() {
  const data = useAsync(loadDecks, []);
  const cardStatus = useProgress((s) => s.cards);
  const setCardStatus = useProgress((s) => s.setCardStatus);
  const [deck, setDeck] = useState<Deck>("concept");
  const [chapter, setChapter] = useState<ChapterId | "all">("all");
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards: Card[] = useMemo(() => {
    if (data.status !== "ready") return [];
    const all: Card[] =
      deck === "concept"
        ? data.data.concepts.map((c: Flashcard) => ({ id: c.id, chapter: c.chapter, front: c.front, back: c.back, source: c.source }))
        : data.data.terms.map((t) => ({
            id: `${t.id}-${deck}`,
            chapter: t.chapter,
            front: deck === "en-vi" ? t.en : t.vi,
            back: deck === "en-vi" ? t.vi : t.en,
            source: "KB §10",
          }));
    return all.filter((c) => (chapter === "all" || c.chapter === chapter) && (!onlyUnknown || cardStatus[c.id] !== "known"));
    // cardStatus is read at filter time only, so marking a card does not reshuffle the current deck.
  }, [data, deck, chapter, onlyUnknown]);

  useEffect(() => {
    setI(0);
    setFlipped(false);
  }, [deck, chapter, onlyUnknown]);

  const card = cards[Math.min(i, cards.length - 1)];
  const known = cards.filter((c) => cardStatus[c.id] === "known").length;
  const go = (delta: number) => {
    setFlipped(false);
    setI((x) => (cards.length ? (x + delta + cards.length) % cards.length : 0));
  };
  const mark = (status: "known" | "unknown") => {
    if (!card) return;
    setCardStatus(card.id, status);
    go(1);
  };

  return (
    <>
      <PageHeader title="Flashcards" subtitle="Lật thẻ để xem đáp án, tự đánh giá Đã thuộc / Chưa thuộc. Phím tắt: Space/Enter (khi thẻ đang được chọn) lật thẻ, ← → chuyển thẻ." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented
          label="Bộ thẻ"
          value={deck}
          onChange={setDeck}
          options={[
            { value: "concept", label: "Khái niệm" },
            { value: "en-vi", label: "Thuật ngữ EN → VI" },
            { value: "vi-en", label: "Thuật ngữ VI → EN" },
          ]}
        />
        <select
          aria-label="Lọc theo chương"
          value={chapter}
          onChange={(e) => setChapter(e.target.value as ChapterId | "all")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:[color-scheme:dark]"
        >
          <option value="all">Tất cả chương</option>
          {CHAPTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} – {c.shortVi}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyUnknown} onChange={(e) => setOnlyUnknown(e.target.checked)} className="h-4 w-4" />
          Chỉ thẻ chưa thuộc
        </label>
      </div>

      {data.status === "ready" && !card && <p className="text-slate-600 dark:text-slate-400">Không còn thẻ nào trong bộ lọc này. 🎉</p>}

      {card && (
        <div
          className="mx-auto max-w-2xl"
          onKeyDown={(e) => {
            // Space/Enter on the focused card already toggles it via click.
            if (e.key === "ArrowRight") go(1);
            else if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <p className="mb-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              Thẻ {Math.min(i, cards.length - 1) + 1}/{cards.length} · {card.chapter}
            </span>
            <span>
              Đã thuộc {known}/{cards.length}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className={cx(
              "flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 p-8 text-center transition-colors duration-200",
              flipped
                ? "border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/30"
                : "border-navy-200 bg-white dark:border-navy-700 dark:bg-slate-900",
              cardStatus[card.id] === "known" && !flipped && "border-green-300",
            )}
          >
            <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{flipped ? "Đáp án" : "Câu hỏi"}</span>
            <span aria-live="polite" className={cx("text-lg", !flipped && "font-semibold")}>
              {flipped ? card.back : card.front}
            </span>
            {flipped && card.source && <span className="mt-3 text-xs text-slate-600 dark:text-slate-400">Nguồn: {card.source}</span>}
            <span className="sr-only">{flipped ? "(nhấn để lật lại mặt trước)" : "(nhấn để xem đáp án)"}</span>
          </button>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => go(-1)}>
              ← Trước
            </Button>
            <Button variant="secondary" onClick={() => mark("unknown")} className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
              Chưa thuộc
            </Button>
            <Button variant="secondary" onClick={() => mark("known")} className="border-green-400 text-green-800 dark:border-green-700 dark:text-green-300">
              Đã thuộc
            </Button>
            <Button variant="secondary" onClick={() => go(1)}>
              Sau →
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
