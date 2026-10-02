import { Link } from "react-router-dom";
import { cx } from "@/components/ui";
import { useAuth } from "@/store/authStore";

const DOT: Record<string, string> = {
  idle: "bg-correct",
  syncing: "bg-navy-400",
  error: "bg-wrong",
  off: "bg-slate-400",
};
const LABEL: Record<string, string> = {
  idle: "đã đồng bộ",
  syncing: "đang đồng bộ",
  error: "lỗi đồng bộ",
  off: "chưa đồng bộ",
};

/** Header entry to /account: "Đăng nhập" for guests, the user's initial + sync status dot when signed in. */
export function AccountButton() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const sync = useAuth((s) => s.sync.state);
  if (status === "disabled") return null;

  if ((status === "signedIn" || status === "recovery") && user) {
    const initial = (user.email[0] ?? "?").toUpperCase();
    return (
      <Link
        to="/account"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white dark:bg-navy-300 dark:text-navy-950"
        aria-label={`Tài khoản ${user.email} – ${LABEL[sync]}`}
        title={`${user.email} – ${LABEL[sync]}`}
      >
        {initial}
        <span aria-hidden className={cx("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900", DOT[sync])} />
      </Link>
    );
  }
  return (
    <Link
      to="/account"
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy-800 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-slate-800"
    >
      Đăng nhập
    </Link>
  );
}
