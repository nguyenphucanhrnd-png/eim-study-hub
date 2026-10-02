import { useEffect } from "react";
import { useSettings, type ThemePref } from "@/store/settingsStore";
import { Icon, type IconName } from "@/components/ui/Icon";

const NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
const META: Record<ThemePref, { icon: IconName; label: string }> = {
  system: { icon: "monitor", label: "Giao diện: theo hệ thống" },
  light: { icon: "sun", label: "Giao diện: sáng" },
  dark: { icon: "moon", label: "Giao diện: tối" },
};

/** Keeps <html class="dark"> in sync with the preference and, for "system", with the OS setting. */
export function useThemeEffect(): void {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (theme !== "system") return;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const { icon, label } = META[theme];
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={`${label}. Nhấn để đổi.`}
      title={label}
    >
      <Icon name={icon} />
    </button>
  );
}
