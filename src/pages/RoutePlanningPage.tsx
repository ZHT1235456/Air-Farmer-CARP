import { useMemo } from "react";
import { useAppStore, useCurrentScenario } from "../store/appStore";
import { rebuildScenario } from "../scenarios/scenarioFactory";
import { usePlanner } from "../hooks/usePlanner";
import Workspace, { SidebarSection, SidebarHeader } from "../components/layout/Workspace";
import ScenarioPicker from "../components/layout/ScenarioPicker";
import WorldCanvas from "../three/WorldCanvas";
import RouteRenderer from "../three/RouteRenderer";
import DroneParamPanel from "../components/planning/DroneParamPanel";
import AlgorithmSelector from "../components/planning/AlgorithmSelector";
import PlanResultPanel from "../components/planning/PlanResultPanel";
import AlgorithmCompareTable from "../components/planning/AlgorithmCompareTable";
import ConvergenceChart from "../components/planning/ConvergenceChart";
import "./RoutePlanning.css";

export default function RoutePlanningPage() {
  const baseScenario = useCurrentScenario();
  const drone = useAppStore((s) => s.droneParams);
  const mode = useAppStore((s) => s.algorithmMode);
  const planOutput = useAppStore((s) => s.planOutput);
  const selectedIndex = useAppStore((s) => s.selectedResultIndex);
  const setPlanOutput = useAppStore((s) => s.setPlanOutput);

  const { planning, run } = usePlanner();

  const effectiveScenario = useMemo(
    () => rebuildScenario(baseScenario, drone),
    [baseScenario, drone]
  );

  const selectedResult =
    planOutput && planOutput.results.length > 0
      ? planOutput.results[selectedIndex] ?? planOutput.results[0]
      : null;

  const generate = () => {
    run(effectiveScenario, drone, mode, 42, (output) => setPlanOutput(output));
  };

  const left = (
    <>
      <SidebarHeader eyebrow="Route Planning · 航线规划" title={baseScenario.name} />
      <SidebarSection title="农田场景">
        <ScenarioPicker />
      </SidebarSection>
      <SidebarSection title="无人机参数">
        <DroneParamPanel />
      </SidebarSection>
      <SidebarSection title="算法模式">
        <AlgorithmSelector />
      </SidebarSection>
      <button className="btn-primary plan-generate" onClick={generate} disabled={planning}>
        {planning ? "正在求解…" : "生成航线"}
      </button>
    </>
  );

  const right = (
    <>
      <PlanResultPanel />
      {planOutput && planOutput.results.length > 1 && (
        <SidebarSection title="算法指标对比">
          <AlgorithmCompareTable output={planOutput} />
        </SidebarSection>
      )}
      {planOutput && (
        <SidebarSection title="收敛曲线">
          <ConvergenceChart output={planOutput} />
        </SidebarSection>
      )}
    </>
  );

  return (
    <Workspace left={left} right={right} className="workspace--wide-right">
      <WorldCanvas scenario={effectiveScenario}>
        <RouteRenderer plan={selectedResult} />
      </WorldCanvas>
      {planning && (
        <div className="plan-loading" role="status" aria-live="polite">
          <div className="plan-tilling" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <span className="mono">正在后台求解航线…</span>
          <span className="plan-loading__sub">Web Worker · 元启法迭代中</span>
        </div>
      )}
    </Workspace>
  );
}
