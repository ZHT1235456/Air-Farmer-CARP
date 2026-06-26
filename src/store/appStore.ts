import { create } from "zustand";
import type { AlgorithmMode, DroneParams, PlanResult, Scenario } from "../types/domain";
import { BUILT_IN_SCENARIOS } from "../scenarios/builtInScenarios";
import type { PlanOutput } from "../algorithms";

function defaultDroneFor(id: string): DroneParams {
  const s = BUILT_IN_SCENARIOS.find((x) => x.id === id) ?? BUILT_IN_SCENARIOS[0];
  return { ...s.defaultDroneParams };
}

interface AppState {
  scenarios: Scenario[];
  currentScenarioId: string;
  /** 当前选中的航带 id（场景预览点击） */
  selectedStripId: string | null;

  // ---- 航线规划相关 ----
  /** 当前可编辑的无人机参数（初始为场景默认） */
  droneParams: DroneParams;
  algorithmMode: AlgorithmMode;
  /** 求解中 */
  planning: boolean;
  /** 求解输出（含 results 与收敛曲线） */
  planOutput: PlanOutput | null;
  /** 对比模式下选中展示的算法索引 */
  selectedResultIndex: number;
  /** 进入仿真页携带的结果 */
  lastPlanResult: PlanResult | null;

  setScenario: (id: string) => void;
  selectStrip: (stripId: string | null) => void;
  setDroneParams: (patch: Partial<DroneParams>) => void;
  setAlgorithmMode: (mode: AlgorithmMode) => void;
  setPlanning: (v: boolean) => void;
  setPlanOutput: (output: PlanOutput | null) => void;
  selectResult: (index: number) => void;
  setLastPlanResult: (result: PlanResult | null) => void;
  resetPlan: () => void;
}

const FIRST = BUILT_IN_SCENARIOS[0].id;

/**
 * 全局应用状态：场景、参数、算法结果跨页面共享。
 * 导航切换不重建状态，满足规格「切换不破坏已生成场景」。
 */
export const useAppStore = create<AppState>((set) => ({
  scenarios: BUILT_IN_SCENARIOS,
  currentScenarioId: FIRST,
  selectedStripId: null,

  droneParams: defaultDroneFor(FIRST),
  algorithmMode: "pathScanning",
  planning: false,
  planOutput: null,
  selectedResultIndex: 0,
  lastPlanResult: null,

  setScenario: (id) =>
    set({
      currentScenarioId: id,
      selectedStripId: null,
      // 切场景重置参数与已生成结果
      droneParams: defaultDroneFor(id),
      planOutput: null,
      selectedResultIndex: 0,
    }),
  selectStrip: (stripId) => set({ selectedStripId: stripId }),

  setDroneParams: (patch) =>
    set((s) => ({ droneParams: { ...s.droneParams, ...patch }, planOutput: null })),
  setAlgorithmMode: (mode) => set({ algorithmMode: mode }),
  setPlanning: (v) => set({ planning: v }),
  setPlanOutput: (output) => set({ planOutput: output, selectedResultIndex: 0 }),
  selectResult: (index) => set({ selectedResultIndex: index }),
  setLastPlanResult: (result) => set({ lastPlanResult: result }),
  resetPlan: () => set({ planOutput: null, selectedResultIndex: 0 }),
}));

/** 便捷选择器：当前场景对象 */
export function useCurrentScenario(): Scenario {
  const scenarios = useAppStore((s) => s.scenarios);
  const id = useAppStore((s) => s.currentScenarioId);
  return scenarios.find((s) => s.id === id) ?? scenarios[0];
}
