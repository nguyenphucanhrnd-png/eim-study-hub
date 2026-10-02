import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { CHAPTERS } from "@/config/chapters";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cx } from "@/components/ui";
import { useProgress } from "@/store/progressStore";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const MAIN: NavItem[] = [{ to: "/", label: "Tổng quan", icon: "home", end: true }];
const PRACTICE: NavItem[] = [
  { to: "/practice", label: "Luyện trắc nghiệm", icon: "practice" },
  { to: "/exams", label: "Thi thử", icon: "exam" },
  { to: "/cases", label: "Case study", icon: "case" },
];
const REVIEW: NavItem[] = [
  { to: "/review", label: "Ôn câu sai & đánh dấu", icon: "review" },
  { to: "/flashcards", label: "Flashcards", icon: "cards" },
  { to: "/glossary", label: "Thuật ngữ EN–VI", icon: "search" },
  { to: "/tools", label: "Công cụ tương tác", icon: "tool" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-[0.92rem] transition-colors duration-150",
    isActive
      ? "bg-navy-50 font-semibold text-navy-800 dark:bg-navy-900/60 dark:text-white"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  );

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function Items({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const wrongCount = useProgress((s) => Object.keys(s.wrongBank).length);
  return (
    <>
      {items.map((it) => (
        <li key={it.to}>
          <NavLink to={it.to} end={it.end} className={linkClass} onClick={onNavigate}>
            <Icon name={it.icon} className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{it.label}</span>
            {it.to === "/review" && wrongCount > 0 && (
              <span className="rounded-full bg-wrong/10 px-2 text-xs font-semibold text-wrong dark:bg-red-400/15 dark:text-red-300">
                {wrongCount}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Điều hướng chính" className="px-3 py-4">
      <Section title="Bắt đầu">
        <Items items={MAIN} onNavigate={onNavigate} />
      </Section>
      <Section title="Học lý thuyết">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <NavLink to={`/learn/${c.slug}`} className={linkClass} onClick={onNavigate}>
              <span
                className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded text-[0.7rem] font-bold text-white"
                style={{ backgroundColor: c.color }}
                aria-hidden="true"
              >
                {c.id}
              </span>
              <span className="flex-1 leading-snug">{c.shortVi}</span>
            </NavLink>
          </li>
        ))}
      </Section>
      <Section title="Luyện tập">
        <Items items={PRACTICE} onNavigate={onNavigate} />
      </Section>
      <Section title="Ôn tập & công cụ">
        <Items items={REVIEW} onNavigate={onNavigate} />
      </Section>
    </nav>
  );
}
