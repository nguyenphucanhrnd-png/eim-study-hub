import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy-800 text-white hover:bg-navy-700 dark:bg-navy-300 dark:text-navy-950 dark:hover:bg-navy-200",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
};
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ variant = "primary", className, ...props }, ref) {
    return <button ref={ref} type="button" className={cx(BTN_BASE, VARIANTS[variant], className)} {...props} />;
  },
);

export function ButtonLink({ to, variant = "primary", children }: { to: string; variant?: Variant; children: ReactNode }) {
  return (
    <Link to={to} className={cx(BTN_BASE, VARIANTS[variant])}>
      {children}
    </Link>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900", className)}>
      {children}
    </div>
  );
}

/** Mix a #rrggbb colour with black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * t);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch) as [number, number, number];
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  // Tinted background; text shaded darker (light mode) or lighter (dark mode) to keep ≥4.5:1 contrast.
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        color && "text-[var(--badge-fg)] dark:text-[var(--badge-fg-dark)]",
      )}
      style={
        color
          ? ({ backgroundColor: `${color}1f`, "--badge-fg": shade(color, -0.25), "--badge-fg-dark": shade(color, 0.55) } as CSSProperties)
          : undefined
      }
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

/** Placeholder for features scheduled in a later phase. */
export function ComingSoon({ phase, what }: { phase: number; what: string }) {
  return (
    <Card className="border-dashed text-center">
      <p className="font-medium text-slate-700 dark:text-slate-300">{what}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sẽ được xây dựng ở Phase {phase}.</p>
    </Card>
  );
}

export function ProgressBar({ value, color, label }: { value: number; color?: string; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
    >
      <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${pct}%`, backgroundColor: color ?? "var(--color-navy-600)" }} />
    </div>
  );
}
