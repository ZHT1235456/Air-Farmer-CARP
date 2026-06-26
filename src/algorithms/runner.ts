import { evaluateOrder } from "./decoder";
import { minBy } from "./random";
import { solvePathScanning } from "./pathScanning";
import { solveGA } from "./ga";
import { solveVNS } from "./vns";
import { solveMemeticGA } from "./memeticGA";
import type { AlgorithmResult, AlgoScenario } from "./types";

/** 按推荐流程运行四种算法：PathScanning → GA → VNS（用前者最优做种）→ MemeticGA */
export function runRecommendedAlgorithms(scenario: AlgoScenario): AlgorithmResult[] {
  const path = solvePathScanning(scenario, { seed: scenario.seed + 11 });
  const ga = solveGA(scenario, { seed: scenario.seed + 1 });

  const vnsSeed = minBy([path.bestOrder, ga.bestOrder], (order) =>
    evaluateOrder(order, scenario)
  );
  const vns = solveVNS(scenario, { initialOrder: vnsSeed, seed: scenario.seed + 5 });

  const memetic = solveMemeticGA(scenario, {
    seed: scenario.seed + 6,
    seedOrders: [ga.bestOrder, path.bestOrder, vns.bestOrder],
  });

  return [path, ga, vns, memetic];
}
