import "@testing-library/jest-dom/vitest";

// jsdom lacks matchMedia (used by the theme effect).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
window.scrollTo = () => undefined;

// jsdom lacks ResizeObserver (used by Recharts' ResponsiveContainer).
if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
}

// React Router's data router builds `new Request(url, { signal })` with jsdom's AbortSignal, which
// Node's fetch Request rejects. Tests don't need request cancellation, so drop the signal.
{
  const NativeRequest = globalThis.Request;
  globalThis.Request = class extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      const { signal: _signal, ...rest } = init ?? {};
      super(input, rest);
    }
  } as typeof Request;
}
