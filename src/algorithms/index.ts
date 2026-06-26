import type {
  AlgorithmMode,
  DroneParams,
  PlanResult,
  Scenario as DomainScenario,
} from "../types/domain";
import { toAlgoScenario, solutionToPlanResult } from "./adapter";
import { solvePathScanning } from "./pathScanning";
import { solveGA } from "./ga";
import { solveVNS } from "./vns";
import { solveMemeticGA } from "./memeticGA";
import { runRecommendedAlgorithms } from "./runner";
import type { AlgorithmResult, ConvergencePoint } from "./types";

export * from "./types";
export { toAlgoScenario, solutionToPlanResult } from "./adapter";
export { runRecommendedAlgorithms } from "./runner";

export interface PlanOutput {
  results: PlanResult[];
  /** 与 results 平行的收敛曲线，用于指标对比图 */
  convergence: ConvergencePoint[][];
}

const COMPARE_MODES: AlgorithmMode[] = ["pathScanning", "genetic", "vns", "memetic"];

/**
 * UI 入口：按算法模式求解，返回 domain PlanResult。
 * compare 模式返回四种算法结果；其余返回单个。
 */
export function planRoutes(
  scenario: DomainScenario,
  drone: DroneParams,
  mode: AlgorithmMode,
  seed = 42
): PlanOutput {
  const bundle = toAlgoScenario(scenario, drone, seed);
  const algo = bundle.algo;

  if (mode === "compare") {
    const results = runRecommendedAlgorithms(algo);
    return {
      results: results.map((r, i) => solutionToPlanResult(r.solution, COMPARE_MODES[i], bundle)),
      convergence: results.map((r) => r.convergence),
    };
  }

  let result: AlgorithmResult;
  switch (mode) {
    case "pathScanning":
      result = solvePathScanning(algo, { seed: seed + 11 });
      break;
    case "genetic":
      result = solveGA(algo, { seed: seed + 1 });
      break;
    case "vns": {
      const seedRun = solvePathScanning(algo, { seed: seed + 11 });
      result = solveVNS(algo, { initialOrder: seedRun.bestOrder, seed: seed + 5 });
      break;
    }
    case "memetic":
      result = solveMemeticGA(algo, { seed: seed + 6 });
      break;
    default:
      result = solvePathScanning(algo, { seed: seed + 11 });
  }

  return {
    results: [solutionToPlanResult(result.solution, mode, bundle)],
    convergence: [result.convergence],
  };
}
