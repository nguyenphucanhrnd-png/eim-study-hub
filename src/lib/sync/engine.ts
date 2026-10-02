import { emptyDoc, mergeDocs, normalizeDoc, type MergeMode, type SyncDoc } from "./merge";

/** Server side of sync (Supabase in the app, a fake in tests). */
export interface SyncRemote {
  fetch(userId: string): Promise<{ doc: SyncDoc; updatedAt: string } | null>;
  /** Saves the document and returns the server's updated_at. */
  save(userId: string, doc: SyncDoc): Promise<string>;
}

/** Device side of sync: the persisted stores. */
export interface SyncLocal {
  read(): SyncDoc;
  write(doc: SyncDoc): void;
  /** Called on every local change; returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void;
}

/** Which account the local data belongs to, and the server timestamp of the last successful sync. */
export interface SyncMeta {
  owner: string | null;
  lastSyncedAt: string | null;
}
export interface SyncMetaStorage {
  read(): SyncMeta;
  write(meta: SyncMeta): void;
}

export type SyncState = "off" | "syncing" | "idle" | "error";
export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null;
  error: string | null;
}

const same = (a: SyncDoc, b: SyncDoc) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Keeps the local stores and the user's server document in step.
 * - start(): first sync for the signed-in user (union merge on a device's first sync; local data of a *different*
 *   account is discarded rather than merged, so shared computers do not leak progress between accounts).
 * - local changes mark the device dirty and trigger a debounced upload (fetch → merge "local" → save).
 * - pull() (window focus) adopts other devices' changes when this device has nothing unsynced.
 */
export class SyncEngine {
  private userId: string | null = null;
  private dirty = false;
  private applying = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly remote: SyncRemote,
    private readonly local: SyncLocal,
    private readonly meta: SyncMetaStorage,
    private readonly onStatus: (s: SyncStatus) => void,
    private readonly debounceMs = 3000,
  ) {}

  get activeUser(): string | null {
    return this.userId;
  }

  async start(userId: string): Promise<void> {
    this.stop();
    this.userId = userId;
    const meta = this.meta.read();
    if (meta.owner && meta.owner !== userId) {
      this.apply(emptyDoc());
      this.meta.write({ owner: null, lastSyncedAt: null });
    }
    this.unsubscribe = this.local.subscribe(() => {
      if (this.applying || !this.userId) return;
      this.dirty = true;
      this.schedule();
    });
    await this.sync();
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.userId = null;
    this.dirty = false;
    this.onStatus({ state: "off", lastSyncedAt: null, error: null });
  }

  /** Upload pending changes now (e.g. when the tab is hidden). */
  flush(): Promise<void> {
    return this.dirty ? this.sync() : this.queue;
  }

  /** Pick up changes made on other devices (only when this device has nothing unsynced). */
  pull(): Promise<void> {
    return this.dirty ? this.flush() : this.sync();
  }

  /** Sign-out helper: wipe this device's copy (the server copy is kept). */
  clearLocal(): void {
    this.apply(emptyDoc());
    this.meta.write({ owner: null, lastSyncedAt: null });
  }

  sync(): Promise<void> {
    this.queue = this.queue.then(() => this.runSync()).catch(() => undefined);
    return this.queue;
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.sync();
    }, this.debounceMs);
  }

  private apply(doc: SyncDoc): void {
    this.applying = true;
    try {
      this.local.write(doc);
    } finally {
      this.applying = false;
    }
  }

  private async runSync(): Promise<void> {
    const userId = this.userId;
    if (!userId) return;
    const wasDirty = this.dirty;
    this.dirty = false;
    const prev = this.meta.read();
    this.onStatus({ state: "syncing", lastSyncedAt: prev.owner === userId ? prev.lastSyncedAt : null, error: null });
    try {
      const remote = await this.remote.fetch(userId);
      if (this.userId !== userId) return; // signed out meanwhile
      // Read local state only now, right before merging, so changes made during the fetch are included.
      const local = normalizeDoc(this.local.read());
      let updatedAt: string;
      if (!remote) {
        updatedAt = await this.remote.save(userId, local);
      } else {
        const meta = this.meta.read();
        const firstSyncHere = meta.owner !== userId || !meta.lastSyncedAt;
        const mode: MergeMode = firstSyncHere ? "union" : wasDirty ? "local" : remote.updatedAt !== meta.lastSyncedAt ? "remote" : "local";
        const merged = mergeDocs(local, remote.doc, mode);
        if (!same(merged, local)) this.apply(merged);
        updatedAt = same(merged, normalizeDoc(remote.doc)) ? remote.updatedAt : await this.remote.save(userId, merged);
      }
      if (this.userId !== userId) return;
      this.meta.write({ owner: userId, lastSyncedAt: updatedAt });
      this.onStatus({ state: "idle", lastSyncedAt: updatedAt, error: null });
    } catch (e) {
      if (wasDirty) this.dirty = true;
      this.onStatus({
        state: "error",
        lastSyncedAt: prev.owner === userId ? prev.lastSyncedAt : null,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }
}
