import { create } from "zustand";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { CLOUD_ENABLED, getClient, localMeta, storesLocal, supabaseRemote } from "@/lib/sync/cloud";
import { SyncEngine, type SyncStatus } from "@/lib/sync/engine";

export type AuthStatus = "disabled" | "uninitialized" | "loading" | "signedOut" | "signedIn" | "recovery";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  sync: SyncStatus;
  /** Load the Supabase client, restore the session and start syncing. Safe to call repeatedly. */
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Returns "signedIn" when e-mail confirmation is off, "confirm" when the user must click the e-mail link. */
  signUp: (email: string, password: string) => Promise<"signedIn" | "confirm">;
  signOut: (clearLocalData: boolean) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  /** Set a new password (after following a reset link, or while signed in). */
  updatePassword: (password: string) => Promise<void>;
  syncNow: () => Promise<void>;
}

const OFF: SyncStatus = { state: "off", lastSyncedAt: null, error: null };

let initPromise: Promise<void> | null = null;
let client: SupabaseClient | null = null;
let engine: SyncEngine | null = null;

/** Where auth e-mails send the user back to. */
const accountUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}account`;

export const useAuth = create<AuthState>()((set, get) => {
  const toUser = (s: Session): AuthUser => ({ id: s.user.id, email: s.user.email ?? "" });

  const applySession = (event: string, session: Session | null) => {
    if (!session) {
      engine?.stop();
      set({ status: "signedOut", user: null, sync: OFF });
      return;
    }
    const user = toUser(session);
    const status: AuthStatus = event === "PASSWORD_RECOVERY" ? "recovery" : get().status === "recovery" && event !== "USER_UPDATED" ? "recovery" : "signedIn";
    set({ status, user });
    if (engine && engine.activeUser !== user.id) void engine.start(user.id);
  };

  return {
    status: CLOUD_ENABLED ? "uninitialized" : "disabled",
    user: null,
    sync: OFF,

    init() {
      if (!CLOUD_ENABLED) return Promise.resolve();
      initPromise ??= (async () => {
        set({ status: "loading" });
        client = await getClient();
        engine = new SyncEngine(supabaseRemote(client), storesLocal, localMeta, (s) => set({ sync: s }));
        // Supabase recommends not awaiting other auth calls inside this callback → defer the work.
        client.auth.onAuthStateChange((event, session) => {
          setTimeout(() => applySession(event, session), 0);
        });
        const { data } = await client.auth.getSession();
        applySession("INITIAL_SESSION", data.session);
        window.addEventListener("focus", () => void engine?.pull());
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") void engine?.flush();
        });
      })().catch((e) => {
        initPromise = null;
        set({ status: "signedOut" });
        throw e;
      });
      return initPromise;
    },

    async signIn(email, password) {
      await get().init();
      const { data, error } = await client!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      applySession("SIGNED_IN", data.session);
    },

    async signUp(email, password) {
      await get().init();
      const { data, error } = await client!.auth.signUp({ email, password, options: { emailRedirectTo: accountUrl() } });
      if (error) throw error;
      if (data.session) {
        applySession("SIGNED_IN", data.session);
        return "signedIn";
      }
      return "confirm";
    },

    async signOut(clearLocalData) {
      await get().init();
      try {
        await engine?.flush();
      } catch {
        /* keep going: signing out must always work */
      }
      engine?.stop();
      await client!.auth.signOut();
      if (clearLocalData) engine?.clearLocal();
      set({ status: "signedOut", user: null, sync: OFF });
    },

    async sendPasswordReset(email) {
      await get().init();
      const { error } = await client!.auth.resetPasswordForEmail(email, { redirectTo: accountUrl() });
      if (error) throw error;
    },

    async updatePassword(password) {
      await get().init();
      const { error } = await client!.auth.updateUser({ password });
      if (error) throw error;
      set({ status: "signedIn" });
    },

    async syncNow() {
      await engine?.sync();
    },
  };
});
