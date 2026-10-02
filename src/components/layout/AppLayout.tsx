import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { SidebarNav } from "./Sidebar";
import { ThemeToggle, useThemeEffect } from "./ThemeToggle";
import { AccountButton } from "./AccountButton";

export function AppLayout() {
  useThemeEffect();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // On navigation: close the drawer, scroll to top and move focus to main content for screen readers.
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-navy-800 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Bỏ qua đến nội dung chính
      </a>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label="Mở menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <Icon name="menu" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-bold text-navy-800 dark:text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-xs text-white dark:bg-navy-300 dark:text-navy-950">
            EIM
          </span>
          <span className="hidden sm:inline">Study Hub</span>
        </Link>
        <span className="hidden truncate text-sm text-slate-500 md:inline dark:text-slate-400">
          · Quản trị Xuất Nhập khẩu — PGS.TS. Bùi Thanh Trang (UEH)
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/glossary"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Tra thuật ngữ"
            title="Tra thuật ngữ"
          >
            <Icon name="search" />
          </Link>
          <ThemeToggle />
          <AccountButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 lg:block dark:border-slate-800">
          <SidebarNav />
        </aside>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
              <span className="font-bold text-navy-800 dark:text-white">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng menu"
                onClick={() => setDrawerOpen(false)}
                autoFocus
              >
                <Icon name="close" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
