import { Rng, minBy } from "./random";
import { decodeOrder, evaluateOrder, makeSolution, repairOrder } from "./decoder";
import { greedyOrder, nearestNeighborOrder } from "./constructors";
import { pathScanningCandidateOrders } from "./pathScanning";
import type { AlgorithmResult, AlgoRoute, AlgoScenario, ConvergencePoint } from "./types";

type Neighborhood =
  | "swap"
  | "insertion"
  | "inversion"
  | "route_relocate"
  | "route_exchange";

const NEIGHBORHOODS: Neighborhood[] = [
  "swap",
  "insertion",
  "inversion",
  "route_relocate",
  "route_exchange",
];

/** 当前解码路线在排列中的 [start,end) 区间 */
function routeRanges(routes: AlgoRoute[]): [number, number][] {
  const ranges: [number, number][] = [];
  let offset = 0;
  for (const r of routes) {
    const start = offset;
    offset += r.stripIds.length;
    ranges.push([start, offset]);
  }
  return ranges;
}

/** 基础邻域（不依赖路线边界） */
function basicNeighbor(order: number[], rng: Rng): number[] {
  const m = [...order];
  if (m.length < 2) return m;
  const move = rng.choice(["swap", "insertion", "inversion"] as const);
  if (move === "swap") {
    const [i, j] = rng.sample(m.length, 2);
    [m[i], m[j]] = [m[j], m[i]];
  } else if (move === "insertion") {
    const [i, j] = rng.sample(m.length, 2);
    const [v] = m.splice(i, 1);
    m.splice(j, 0, v);
  } else {
    const [i, j] = rng.sample(m.length, 2).sort((a, b) => a - b);
    const seg = m.slice(i, j + 1).reverse();
    for (let k = 0; k < seg.length; k++) m[i + k] = seg[k];
  }
  return m;
}

/** 路线感知邻域：依据 decodeOrder 的路线边界做 relocate / exchange */
function routeAwareNeighbor(
  order: number[],
  scenario: AlgoScenario,
  rng: Rng,
  move: Neighborhood
): number[] {
  const { routes, repairedOrder } = decodeOrder(order, scenario);
  const ranges = routeRanges(routes).filter(([s, e]) => e > s);
  if (repairedOrder.length < 2 || ranges.length === 0) return [...repairedOrder];
  const candidate = [...repairedOrder];

  if (move === "route_relocate" && ranges.length >= 2) {
    const src = rng.choice(ranges);
    const tgt = rng.choice(ranges);
    const sourceIndex = src[0] + rng.randrange(src[1] - src[0]);
    let targetIndex = tgt[0] + rng.randrange(tgt[1] - tgt[0] + 1);
    const [value] = candidate.splice(sourceIndex, 1);
    if (targetIndex > sourceIndex) targetIndex -= 1;
    candidate.splice(Math.max(0, Math.min(targetIndex, candidate.length)), 0, value);
    return candidate;
  }

  if (move === "route_exchange" && ranges.length >= 2) {
    const [left, right] = rng.sample(ranges.length, 2).map((i) => ranges[i]);
    const li = left[0] + rng.randrange(left[1] - left[0]);
    const ri = right[0] + rng.randrange(right[1] - right[0]);
    [candidate[li], candidate[ri]] = [candidate[ri], candidate[li]];
    return candidate;
  }

  return basicNeighbor(candidate, rng);
}

export function neighborhoodOrder(
  order: number[],
  scenario: AlgoScenario,
  rng: Rng,
  neighborhood: Neighborhood
): number[] {
  let candidate = [...order];
  if (candidate.length < 2) return candidate;
  if (neighborhood === "swap") {
    const [i, j] = rng.sample(candidate.length, 2).sort((a, b) => a - b);
    [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
  } else if (neighborhood === "insertion") {
    const [i, j] = rng.sample(candidate.length, 2);
    const [v] = candidate.splice(i, 1);
    candidate.splice(j, 0, v);
  } else if (neighborhood === "inversion") {
    const [i, j] = rng.sample(candidate.length, 2).sort((a, b) => a - b);
    const seg = candidate.slice(i, j + 1).reverse();
    for (let k = 0; k < seg.length; k++) candidate[i + k] = seg[k];
  } else {
    candidate = routeAwareNeighbor(candidate, scenario, rng, neighborhood);
  }
  return repairOrder(candidate, scenario);
}

/** 轻量局部搜索：有限次随机邻域检查，接受更优解 */
export function localSearchOrder(
  order: number[],
  scenario: AlgoScenario,
  rng: Rng,
  maxChecks = 80,
  neighborhoods: Neighborhood[] = NEIGHBORHOODS
): number[] {
  let bestOrder = repairOrder(order, scenario);
  let bestScore = evaluateOrder(bestOrder, scenario);
  let checks = 0;
  let improved = true;
  while (improved && checks < maxChecks) {
    improved = false;
    for (const neighborhood of neighborhoods) {
      if (checks >= maxChecks) break;
      for (let t = 0; t < 4; t++) {
        if (checks >= maxChecks) break;
        const candidate = neighborhoodOrder(bestOrder, scenario, rng, neighborhood);
        const score = evaluateOrder(candidate, scenario);
        checks += 1;
        if (score < bestScore - 1e-9) {
          bestOrder = candidate;
          bestScore = score;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  return bestOrder;
}

export interface VnsOptions {
  seed?: number;
  initialOrder?: number[];
  maxIterations?: number;
  noImproveLimit?: number;
  trialsPerNeighborhood?: number;
  algorithmName?: string;
}

export function solveVNS(scenario: AlgoScenario, opts: VnsOptions = {}): AlgorithmResult {
  const seed = opts.seed ?? scenario.seed;
  const maxIterations = opts.maxIterations ?? 80;
  const noImproveLimit = opts.noImproveLimit ?? 18;
  const trials = opts.trialsPerNeighborhood ?? 5;
  const name = opts.algorithmName ?? "VNS";

  const rng = new Rng(seed);
  const start = performance.now();

  let currentOrder: number[];
  if (!opts.initialOrder) {
    const candidates = [
      ...pathScanningCandidateOrders(scenario, seed),
      greedyOrder(scenario),
      nearestNeighborOrder(scenario),
    ];
    currentOrder = minBy(candidates, (o) => evaluateOrder(o, scenario));
  } else {
    currentOrder = repairOrder(opts.initialOrder, scenario);
  }

  let bestOrder = [...currentOrder];
  let bestScore = evaluateOrder(bestOrder, scenario);
  let noImprove = 0;
  const convergence: ConvergencePoint[] = [];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let improved = false;
    for (const neighborhood of NEIGHBORHOODS) {
      let localBestOrder = bestOrder;
      let localBestScore = bestScore;
      for (let t = 0; t < trials; t++) {
        let candidate = neighborhoodOrder(bestOrder, scenario, rng, neighborhood);
        candidate = localSearchOrder(candidate, scenario, rng, 8, [neighborhood]);
        const score = evaluateOrder(candidate, scenario);
        if (score < localBestScore - 1e-9) {
          localBestOrder = candidate;
          localBestScore = score;
        }
      }
      if (localBestScore < bestScore - 1e-9) {
        bestOrder = [...localBestOrder];
        bestScore = localBestScore;
        improved = true;
        break;
      }
    }

    noImprove = improved ? 0 : noImprove + 1;
    const best = makeSolution(name, bestOrder, scenario);
    convergence.push({
      algorithm: name,
      iteration,
      objective: best.objective,
      totalDistance: best.totalDistance,
    });
    if (noImprove >= noImproveLimit) break;
  }

  const runtimeSec = (performance.now() - start) / 1000;
  const solution = makeSolution(name, bestOrder, scenario, runtimeSec);
  return { solution, convergence, bestOrder };
}
