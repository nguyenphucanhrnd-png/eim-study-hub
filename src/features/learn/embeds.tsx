import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { TOOL_COMPONENTS } from "@/features/tools/registry";

type Lazy = LazyExoticComponent<ComponentType>;

/** Components usable from theory markdown via `::embed[name]`. */
export const EMBEDS: Record<string, Lazy> = {
  // Interactive tools
  "incoterms-explorer": TOOL_COMPONENTS.incoterms!,
  "icc-checker": TOOL_COMPONENTS.icc!,
  "payment-flow": TOOL_COMPONENTS["payment-flow"]!,
  "lc-date-checker": TOOL_COMPONENTS["lc-dates"]!,
  "fx-calculator": TOOL_COMPONENTS["fx-profit"]!,
  "risk-ladder": lazy(() => import("@/features/tools/payment-flow/PaymentFlowStepper").then((m) => ({ default: m.RiskLadder }))),
  // Visual summaries (one per chapter)
  "two-flows": lazy(() => import("./visuals/TwoFlows")),
  "export-plan-map": lazy(() => import("./visuals/ExportPlanMap")),
  "incoterms-matrix": lazy(() => import("./visuals/IncotermsMatrix")),
  "icc-tiers": lazy(() => import("./visuals/IccTiers")),
  "payment-compare": lazy(() => import("./visuals/PaymentCompare")),
  "contract-map": lazy(() => import("./visuals/ContractMap")),
  "document-map": lazy(() => import("./visuals/DocumentMap")),
  "procedure-flow": lazy(() => import("./visuals/ProcedureFlow")),
};
