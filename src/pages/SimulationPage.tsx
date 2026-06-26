import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useAppStore, useCurrentScenario } from "../store/appStore";
import { rebuildScenario } from "../scenarios/scenarioFactory";
import { planRoutes } from "../algorithms";
import { SimulationEngine } from "../simulation/simulationEngine";
import { simStore } from "../simulation/simStore";
import type { PlanResult } from "../types/domain";
import Workspace, { SidebarSection, SidebarHeader } from "../components/layout/Workspace";
import WorldCanvas from "../three/WorldCanvas";
import DroneModel from "../three/DroneModel";
import SeedingEffect from "../three/SeedingEffect";
import SimDriver from "../three/SimDriver";
import SimRouteOverlay from "../three/SimRouteOverlay";
import FollowCamera from "../three/FollowCamera";
import SimulationDashboard from "../components/simulation/SimulationDashboard";
import SimulationControls from "../components/simulation/SimulationControls";
import { MODE_LABELS } from "../components/planning/labels";
import "./Simulation.css";

const SPEEDS = [0.5, 1, 2, 4];

export default function SimulationPage() {
  const navigate = useNavigate();
  const baseScenario = useCurrentScenario();
  const drone = useAppStore((s) => s.droneParams);
  const lastPlanResult = useAppStore((s) => s.lastPlanResult);

  const effectiveScenario = useMemo(
    () => rebuildScenario(baseScenario, drone),
    [baseScenario, drone]
  );

  const plan: PlanResult = useMemo(() => {
    if (lastPlanResult) return lastPlanResult;
    return planRoutes(effectiveScenario, drone, "pathScanning").results[0];
  }, [lastPlanResult, effectiveScenario, drone]);

  const engine = useMemo(
    () => new SimulationEngine(plan, drone, effectiveScenario.obstacles),
    [plan, drone, effectiveScenario]
  );

  const droneRef = useRef<THREE.Group>(null);
  const emitterRef = useRef(new THREE.Vector3());
  const activeRef = useRef(false);
  const speedRef = useRef(1);

  const [speed, setSpeed] = useState(1);
  const [follow, setFollow] = useState(false);

  // 引擎重建：复位倍速并推送初始快照
  useEffect(() => {
    speedRef.current = 1;
    setSpeed(1);
    simStore.set(engine.getSnapshot());
  }, [engine]);

  const changeSpeed = (dir: 1 | -1) => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, idx + dir))];
    speedRef.current = next;
    setSpeed(next);
  };

  const algorithmLabel = MODE_LABELS[plan.algorithm] ?? plan.algorithm;

  const left = (
    <>
      <SidebarHeader eyebrow="Simulation · 播种模拟" title={baseScenario.name} />
      <SidebarSection title="任务概览">
        <dl className="stat-list">
          <div className="stat-row"><dt>算法</dt><dd>{algorithmLabel}</dd></div>
          <div className="stat-row"><dt>规划趟数</dt><dd className="mono">{plan.routes.length}</dd></div>
          <div className="stat-row"><dt>总航程</dt><dd className="mono">{plan.totalDistance.toFixed(0)} m</dd></div>
          <div className="stat-row"><dt>航带总数</dt><dd className="mono">{engine.totalStrips}</dd></div>
        </dl>
      </SidebarSection>
      <p className="side-hint mono">
        {lastPlanResult ? "来自航线规划页的结果" : "未规划：已用 Path Scanning 生成默认航线"}
      </p>
    </>
  );

  const right = <SimulationDashboard drone={drone} algorithmLabel={algorithmLabel} />;

  return (
    <Workspace left={left} right={right}>
      <WorldCanvas scenario={effectiveScenario} orbitEnabled={!follow} stripInteractive={false}>
        <SimRouteOverlay plan={plan} />
        <DroneModel ref={droneRef} />
        <SeedingEffect emitterRef={emitterRef} activeRef={activeRef} />
        <FollowCamera active={follow} droneRef={droneRef} />
        <SimDriver
          engine={engine}
          speedRef={speedRef}
          droneRef={droneRef}
          emitterRef={emitterRef}
          activeRef={activeRef}
        />
      </WorldCanvas>

      <SimulationControls
        speed={speed}
        follow={follow}
        onToggle={() => engine.toggle()}
        onReset={() => {
          engine.reset();
          simStore.set(engine.getSnapshot());
        }}
        onSpeedDown={() => changeSpeed(-1)}
        onSpeedUp={() => changeSpeed(1)}
        onToggleCamera={() => setFollow((f) => !f)}
        onBack={() => navigate("/planning")}
      />
    </Workspace>
  );
}
