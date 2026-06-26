import { describe, it, expect } from "vitest";
import { BUILT_IN_SCENARIOS } from "../scenarios/builtInScenarios";
import { toAlgoScenario } from "./adapter";
import { allStripIds, decodeOrder, makeSolution, objectiveValue } from "./decoder";
import { solvePathScanning } from "./pathScanning";
import { solveGA } from "./ga";
import { solveVNS } from "./vns";
import { solveMemeticGA } from "./memeticGA";
import type { AlgoScenario, Solution } from "./types";

const EPS = 1e-6;

function buildAlgo(scenarioIndex: number): AlgoScenario {
  const scenario = BUILT_IN_SCENARIOS[scenarioIndex];
  return toAlgoScenario(scenario, scenario.defaultDroneParams).algo;
}

/** 正确性清单（文档第 10 节） */
function validate(solution: Solution, algo: AlgoScenario) {
  const served = solution.routes.flatMap((r) => r.stripIds).sort((a, b) => a - b);
  const expected = allStripIds(algo).sort((a, b) => a - b);
  // 3. 每条航带恰好出现一次
  expect(served).toEqual(expected);
  // 1. coverage == 1
  expect(Math.abs(solution.coverage - 1)).toBeLessThan(EPS);
  // 2. violations == 0
  expect(solution.violations).toBe(0);
  // 4 & 5. 每条 route 满足容量与航程
  for (const route of solution.routes) {
    expect(route.demand).toBeLessThanOrEqual(algo.capacity + EPS);
    expect(route.distance).toBeLessThanOrEqual(algo.maxRouteDistance + EPS);
  }
}

const solvers = [
  { name: "PathScanning", run: (a: AlgoScenario) => solvePathScanning(a, { seed: a.seed + 11 }) },
  { name: "GA", run: (a: AlgoScenario) => solveGA(a, { seed: a.seed + 1, generations: 60 }) },
  { name: "VNS", run: (a: AlgoScenario) => solveVNS(a, { seed: a.seed + 5 }) },
  { name: "MemeticGA", run: (a: AlgoScenario) => solveMemeticGA(a, { seed: a.seed + 6, generations: 30 }) },
];

describe("CARP 算法正确性清单", () => {
  BUILT_IN_SCENARIOS.forEach((scenario, idx) => {
    describe(scenario.name, () => {
      const algo = buildAlgo(idx);

      it("场景含航带", () => {
        expect(algo.strips.length).toBeGreaterThan(0);
      });

      solvers.forEach((solver) => {
        it(`${solver.name} 满足全部约束`, () => {
          const { solution } = solver.run(algo);
          validate(solution, algo);
        });
      });
    });
  });
});

describe("decoder 与目标函数", () => {
  const algo = buildAlgo(0);

  it("objective 公式：distance + 30*returns + 5000*violations + 5000*missing", () => {
    const order = allStripIds(algo);
    const sol = makeSolution("t", order, algo);
    const expected = objectiveValue(sol.totalDistance, sol.returns, sol.violations, 0);
    expect(Math.abs(sol.objective - expected)).toBeLessThan(EPS);
  });

  it("returns == routes.length - 1", () => {
    const sol = makeSolution("t", allStripIds(algo), algo);
    expect(sol.returns).toBe(Math.max(0, sol.routes.length - 1));
  });

  it("decodeOrder 修复非法/重复 id 后仍覆盖全部航带", () => {
    const ids = allStripIds(algo);
    const messy = [...ids, ids[0], 99999, -3];
    const { repairedOrder } = decodeOrder(messy, algo);
    expect([...repairedOrder].sort((a, b) => a - b)).toEqual([...ids].sort((a, b) => a - b));
  });
});

describe("同 seed 输出稳定", () => {
  const algo = buildAlgo(0);
  it("GA 两次运行结果一致", () => {
    const a = solveGA(algo, { seed: 7, generations: 40 });
    const b = solveGA(algo, { seed: 7, generations: 40 });
    expect(a.bestOrder).toEqual(b.bestOrder);
    expect(a.solution.objective).toBeCloseTo(b.solution.objective, 6);
  });
  it("MemeticGA 两次运行结果一致", () => {
    const a = solveMemeticGA(algo, { seed: 9, generations: 25 });
    const b = solveMemeticGA(algo, { seed: 9, generations: 25 });
    expect(a.bestOrder).toEqual(b.bestOrder);
  });
});
