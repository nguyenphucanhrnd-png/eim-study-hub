/**
 * Supabase wiring for accounts & sync. The client library is imported lazily, so visitors who never sign in
 * do not download it. Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app runs fully offline.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { useProgress } from "@/store/progressStore";
import { useExams } from "@/store/examStore";
import { useCases } from "@/store/caseStore";
import type { SyncLocal, SyncMeta, SyncMetaStorage, SyncRemote } from "./engine";
import { normalizeDoc, type SyncDoc } from "./merge";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const PROGRESS_TABLE = "user_progress";

let clientPromise: Promise<SupabaseClient> | null = null;

export function getClient(): Promise<SupabaseClient> {
  if (!CLOUD_ENABLED) return Promise.reject(new Error("Cloud sync is not configured"));
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  );
  return clientPromise;
}

/** A Supabase session saved by an earlier visit (supabase-js stores it under sb-<project>-auth-token). */
export function hasStoredSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) if (/^sb-.+-auth-token$/.test(localStorage.key(i) ?? "")) return true;
  } catch {
    /* storage unavailable */
  }
  return false;
}

/** The URL is a return from an auth email (confirmation or password reset). */
export function urlHasAuthCallback(): boolean {
  if (typeof window === "undefined") return false;
  return /access_token=|error_description=|type=recovery/.test(window.location.hash) || /[?&](code|error_description)=/.test(window.location.search);
}

export function supabaseRemote(client: SupabaseClient): SyncRemote {
  return {
    async fetch(userId) {
      const { data, error } = await client
        .from(PROGRESS_TABLE)
        .select("progress, exams, cases, updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return { doc: normalizeDoc(data as Partial<SyncDoc>), updatedAt: String(data.updated_at) };
    },
    async save(userId, doc) {
      const { data, error } = await client
        .from(PROGRESS_TABLE)
        .upsert({ user_id: userId, progress: doc.progress, exams: doc.exams, cases: doc.cases }, { onConflict: "user_id" })
        .select("updated_at")
        .single();
      if (error) throw new Error(error.message);
      return String(data.updated_at);
    },
  };
}

/** The persisted stores as one sync document. */
export const storesLocal: SyncLocal = {
  read() {
    const p = useProgress.getState();
    const e = useExams.getState();
    const c = useCases.getState();
    return {
      progress: { stats: p.stats, wrongBank: p.wrongBank, flagged: p.flagged, learned: p.learned, cards: p.cards },
      exams: { sessions: e.sessions, attempts: e.attempts },
      cases: { drafts: c.drafts, revealed: c.revealed, checks: c.checks, history: c.history },
    };
  },
  write(doc) {
    useProgress.setState(doc.progress);
    useExams.setState(doc.exams);
    useCases.setState(doc.cases);
  },
  subscribe(onChange) {
    const subs = [useProgress.subscribe(onChange), useExams.subscribe(onChange), useCases.subscribe(onChange)];
    return () => subs.forEach((u) => u());
  },
};

const META_KEY = "eim-sync-meta";

export const localMeta: SyncMetaStorage = {
  read(): SyncMeta {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) return { owner: null, lastSyncedAt: null, ...(JSON.parse(raw) as Partial<SyncMeta>) };
    } catch {
      /* ignore */
    }
    return { owner: null, lastSyncedAt: null };
  },
  write(meta) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      /* ignore */
    }
  },
};

/** Supabase auth error → Vietnamese message for the UI. */
export function authErrorVi(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng.";
  if (m.includes("email not confirmed")) return "Email chưa được xác nhận. Hãy mở email xác nhận và bấm vào liên kết.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email này đã được đăng ký. Hãy đăng nhập.";
  if (m.includes("password should be") || m.includes("weak password")) return "Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự, gồm chữ và số.";
  if (m.includes("rate limit") || m.includes("too many")) return "Bạn thao tác quá nhiều lần. Hãy thử lại sau ít phút.";
  if (m.includes("same password") || m.includes("different from the old")) return "Mật khẩu mới phải khác mật khẩu cũ.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Không kết nối được máy chủ. Hãy kiểm tra mạng.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Email không hợp lệ.";
  return `Có lỗi xảy ra: ${msg}`;
}
