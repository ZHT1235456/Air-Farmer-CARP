import { dist } from "../geometry/distance";
import { Rng, minBy } from "./random";
import {
  allStripIds,
  bestRouteGeometry,
  makeSolution,
  repairOrder,
  routeDemand,
  stripById,
} from "./decoder";
import { greedyOrder, nearestNeighborOrder, scanlineOrder } from "./constructors";
import type { AlgorithmResult, AlgoScenario, AlgoStrip, ConvergencePoint } from "./types";

const EPS = 1e-9;

type Rule =
  | "nearest"
  | "farthest_depot"
  | "nearest_depot"
  | "demand_density"
  | "capacity_fill"
  | "randomized";

interface Candidate {
  stripId: number;
  increment: number;
  depotDistance: number;
  demand: number;
  length: number;
  remainingCapacity: number;
}

function stripDepotDistance(strip: AlgoStrip, scenario: AlgoScenario): number {
  const center = {
    x: (strip.start.x + strip.end.x) / 2,
    y: (strip.start.y + strip.end.y) / 2,
  };
  return dist(center, scenario.depot);
}

function pathScanningRuleOrder(scenario: AlgoScenario, rule: Rule, rng: Rng): number[] {
  const strips = stripById(scenario);
  // 排序后遍历以保证可复现
  const remaining = new Set([...allStripIds(scenario)].sort((a, b) => a - b));
  const order: number[] = [];

  while (remaining.size > 0) {
    const current: number[] = [];
    for (;;) {
      const baseDistance = current.length ? bestRouteGeometry(current, scenario).distance : 0;
      const baseDemand = routeDemand(current, scenario);
      const feasible: Candidate[] = [];
      for (const stripId of remaining) {
        const candidate = [...current, stripId];
        const candidateDemand = routeDemand(candidate, scenario);
        const candidateDistance = bestRouteGeometry(candidate, scenario).distance;
        if (
          candidateDemand <= scenario.capacity + EPS &&
          candidateDistance <= scenario.maxRouteDistance + EPS
        ) {
          const strip = strips.get(stripId)!;
          feasible.push({
            stripId,
            increment: candidateDistance - baseDistance,
            depotDistance: stripDepotDistance(strip, scenario),
            demand: strip.demand,
            length: strip.length,
            remainingCapacity: scenario.capacity - baseDemand,
          });
        }
      }
      if (feasible.length === 0) break;

      let chosen: Candidate;
      switch (rule) {
        case "nearest":
          chosen = minBy(feasible, (i) => i.increment * 1e6 - i.demand + i.stripId * 1e-6);
          break;
        case "farthest_depot":
          chosen = minBy(feasible, (i) => i.increment - 0.25 * i.depotDistance + i.stripId * 1e-6);
          break;
        case "nearest_depot":
          chosen = minBy(feasible, (i) => i.increment + 0.2 * i.depotDistance + i.stripId * 1e-6);
          break;
        case "demand_density":
          chosen = minBy(feasible, (i) => i.increment / Math.max(i.demand, 1e-9) + i.stripId * 1e-6);
          break;
        case "capacity_fill":
          chosen = minBy(
            feasible,
            (i) =>
              Math.abs(i.remainingCapacity - i.demand) / Math.max(i.remainingCapacity, 1e-9) * 1e6 +
              i.increment
          );
          break;
        default:
          chosen = minBy(feasible, (i) => i.increment + rng.uniform(-12, 12) + i.stripId * 1e-6);
      }

      current.push(chosen.stripId);
      remaining.delete(chosen.stripId);
    }

    if (current.length === 0) {
      const id = Math.min(...remaining);
      current.push(id);
      remaining.delete(id);
    }
    order.push(...current);
  }

  return repairOrder(order, scenario);
}

export function pathScanningCandidateOrders(scenario: AlgoScenario, seed: number): number[][] {
  const rng = new Rng(seed);
  const rules: Rule[] = [
    "nearest",
    "farthest_depot",
    "nearest_depot",
    "demand_density",
    "capacity_fill",
    "randomized",
  ];
  const candidates: number[][] = [
    greedyOrder(scenario),
    nearestNeighborOrder(scenario),
    scanlineOrder(scenario),
    [...scanlineOrder(scenario)].reverse(),
  ];
  for (const rule of rules) candidates.push(pathScanningRuleOrder(scenario, rule, rng));
  for (let i = 0; i < 6; i++) candidates.push(pathScanningRuleOrder(scenario, "randomized", rng));

  const unique: number[][] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const repaired = repairOrder(c, scenario);
    const key = repaired.join(",");
    if (!seen.has(key)) {
      unique.push(repaired);
      seen.add(key);
    }
  }
  return unique;
}

export interface SolveOptions {
  seed?: number;
}

export function solvePathScanning(
  scenario: AlgoScenario,
  opts: SolveOptions = {}
): AlgorithmResult {
  const seed = opts.seed ?? scenario.seed;
  const name = "PathScanning";
  const start = performance.now();
  const candidates = pathScanningCandidateOrders(scenario, seed);
  let bestOrder = candidates[0];
  let bestScore = Infinity;
  const convergence: ConvergencePoint[] = [];
  candidates.forEach((order, idx) => {
    const solution = makeSolution(name, order, scenario);
    if (solution.objective < bestScore) {
      bestScore = solution.objective;
      bestOrder = [...order];
    }
    const best = makeSolution(name, bestOrder, scenario);
    convergence.push({
      algorithm: name,
      iteration: idx,
      objective: best.objective,
      totalDistance: best.totalDistance,
    });
  });
  const runtimeSec = (performance.now() - start) / 1000;
  const solution = makeSolution(name, bestOrder, scenario, runtimeSec);
  return { solution, convergence, bestOrder };
}
