import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePref = "system" | "light" | "dark";

interface SettingsState {
  theme: ThemePref;
  /** Mock-exam duration override in minutes (default from blueprint config). */
  examDurationMin: number | null;
  setTheme: (theme: ThemePref) => void;
  setExamDuration: (min: number | null) => void;
}

/** Storage key is also read by the inline script in index.html to avoid a theme flash. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      examDurationMin: null,
      setTheme: (theme) => set({ theme }),
      setExamDuration: (examDurationMin) => set({ examDurationMin }),
    }),
    { name: "eim-settings", version: 1 },
  ),
);
