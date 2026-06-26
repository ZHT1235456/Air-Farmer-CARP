import { useMemo, useState } from "react";
import { useAppStore, useCurrentScenario } from "../store/appStore";
import { rebuildScenario } from "../scenarios/scenarioFactory";
import { usePlanner } from "../hooks/usePlanner";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 有效场景：按当前参数重算航带，同时驱动三维世界与算法
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

  return (
    <div className="plan-page">
      <WorldCanvas scenario={effectiveScenario}>
        <RouteRenderer plan={selectedResult} />
      </WorldCanvas>

      {/* 左：参数 + 算法 + 生成 */}
      <aside className="plan-left">
        <span className="eyebrow">Route Planning · 航线规划</span>
        <h1 className="plan-left__title">{baseScenario.name}</h1>

        <div className="plan-section">
          <span className="plan-section__label">无人机参数</span>
          <DroneParamPanel />
        </div>

        <div className="plan-section">
          <span className="plan-section__label">算法模式</span>
          <AlgorithmSelector />
        </div>

        <button className="btn-primary plan-generate" onClick={generate} disabled={planning}>
          {planning ? "正在求解…" : "生成航线"}
        </button>
      </aside>

      {/* 右：结果指标 */}
      <aside className="plan-right">
        <PlanResultPanel drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((v) => !v)} />
      </aside>

      {/* 计算遮罩 */}
      {planning && (
        <div className="plan-loading">
          <div className="plan-spinner" />
          <span className="mono">正在后台求解航线…</span>
        </div>
      )}

      {/* 底部抽屉：对比表 + 收敛曲线 */}
      {planOutput && (
        <div className={"plan-drawer" + (drawerOpen ? " is-open" : "")}>
          <button className="plan-drawer__handle" onClick={() => setDrawerOpen((v) => !v)}>
            {drawerOpen ? "▼ 收起" : "▲ 算法对比 / 收敛曲线"}
          </button>
          {drawerOpen && (
            <div className="plan-drawer__body">
              <div className="plan-drawer__col">
                <h3 className="plan-drawer__title">指标对比</h3>
                <AlgorithmCompareTable output={planOutput} />
              </div>
              <div className="plan-drawer__col">
                <h3 className="plan-drawer__title">收敛曲线</h3>
                <ConvergenceChart output={planOutput} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
