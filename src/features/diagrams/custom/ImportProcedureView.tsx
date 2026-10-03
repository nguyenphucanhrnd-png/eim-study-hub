import type { DiagramViewProps } from "../registry";
import { ProcedureView } from "./ProcedureView";

export default function ImportProcedureView({ focusStepId }: DiagramViewProps) {
  return <ProcedureView which="import" focusStepId={focusStepId} />;
}
