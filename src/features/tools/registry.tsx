import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type Loader = () => Promise<{ default: ComponentType }>;

/** Chunk loaders for the interactive tools (each tool is its own chunk). */
const TOOL_LOADERS: Record<string, Loader> = {
  incoterms: () => import("./incoterms/IncotermsExplorer"),
  icc: () => import("./icc/IccChecker"),
  "payment-flow": () => import("./payment-flow/PaymentFlowStepper"),
  "lc-dates": () => import("./lc-dates/LcDateChecker"),
  "fx-profit": () => import("./fx-profit/FxCalculator"),
};

/** Lazy components used by /tools/:toolId and theory embeds. */
export const TOOL_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(TOOL_LOADERS).map(([id, load]) => [id, lazy(load)]),
);

/** Start downloading a tool's chunk early (e.g. on a direct visit to /tools/:toolId) to skip one request waterfall step. */
export function preloadTool(id: string): void {
  void TOOL_LOADERS[id]?.();
}
