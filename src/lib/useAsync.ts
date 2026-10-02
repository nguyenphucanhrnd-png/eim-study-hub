import { useEffect, useState } from "react";

export type AsyncState<T> = { status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T };

/** Run an async loader when deps change; ignores results from stale runs. */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    load().then(
      (data) => live && setState({ status: "ready", data }),
      (error: unknown) => live && setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      live = false;
    };
  }, deps);
  return state;
}
