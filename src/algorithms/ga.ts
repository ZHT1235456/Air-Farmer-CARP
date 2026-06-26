import { Rng } from "./random";
import { allStripIds, evaluateOrder, makeSolution, repairOrder } from "./decoder";
import { greedyOrder, nearestNeighborOrder, scanlineOrder } from "./constructors";
import type { AlgorithmResult, AlgoScenario, ConvergencePoint } from "./types";

/** OX 顺序交叉：继承父代 A 的连续片段，再按父代 B 的相对顺序填充 */
export function orderCrossover(parentA: number[], parentB: number[], rng: Rng): number[] {
  const n = parentA.length;
  if (n < 2) return [...parentA];
  const [left, right] = rng.sample(n, 2).sort((a, b) => a - b);
  const child: (number | null)[] = new Array(n).fill(null);
  for (let i = left; i <= right; i++) child[i] = parentA[i];
  const inChild = new Set(child.filter((v): v is number => v !== null));
  const fill = parentB.filter((v) => !inChild.has(v));
  let fi = 0;
  const seq: number[] = [];
  for (let i = right + 1; i < n; i++) seq.push(i);
  for (let i = 0; i <= right; i++) seq.push(i);
  for (const idx of seq) {
    if (child[idx] === null) child[idx] = fill[fi++];
  }
  return child.filter((v): v is number => v !== null);
}

export function mutateOrder(order: number[], rng: Rng, mutationRate = 0.25): number[] {
  const m = [...order];
  if (rng.random() >= mutationRate || m.length < 2) return m;
  const move = rng.choice(["swap", "inversion", "insertion"] as const);
  const [i, j] = rng.sample(m.length, 2).sort((a, b) => a - b);
  if (move === "swap") {
    [m[i], m[j]] = [m[j], m[i]];
  } else if (move === "inversion") {
    const seg = m.slice(i, j + 1).reverse();
    for (let k = 0; k < seg.length; k++) m[i + k] = seg[k];
  } else {
    const [value] = m.splice(j, 1);
    m.splice(i, 0, value);
  }
  return m;
}

export function tournamentSelect(
  population: number[][],
  scores: number[],
  rng: Rng,
  k = 3
): number[] {
  const candidates = rng.sample(population.length, k);
  let best = candidates[0];
  for (const idx of candidates) if (scores[idx] < scores[best]) best = idx;
  return [...population[best]];
}

export function initialPopulation(scenario: AlgoScenario, size: number, rng: Rng): number[][] {
  const base = [
    greedyOrder(scenario),
    nearestNeighborOrder(scenario),
    scanlineOrder(scenario),
    [...scanlineOrder(scenario)].reverse(),
  ];
  const population = base.map((o) => repairOrder(o, scenario));
  const ids = allStripIds(scenario);
  while (population.length < size) {
    population.push(rng.shuffle([...ids]));
  }
  return population.slice(0, size);
}

export interface GaOptions {
  seed?: number;
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  algorithmName?: string;
}

export function solveGA(scenario: AlgoScenario, opts: GaOptions = {}): AlgorithmResult {
  const seed = opts.seed ?? scenario.seed;
  const populationSize = opts.populationSize ?? 64;
  const generations = opts.generations ?? 160;
  const mutationRate = opts.mutationRate ?? 0.3;
  const name = opts.algorithmName ?? "GA";

  const rng = new Rng(seed);
  const start = performance.now();
  let population = initialPopulation(scenario, populationSize, rng);
  const eliteCount = Math.max(2, Math.floor(populationSize / 16));
  const convergence: ConvergencePoint[] = [];

  let bestOrder = population[0];
  let bestScore = Infinity;

  for (let generation = 0; generation < generations; generation++) {
    const scores = population.map((o) => evaluateOrder(o, scenario));
    const ranked = population.map((_, i) => i).sort((a, b) => scores[a] - scores[b]);
    if (scores[ranked[0]] < bestScore) {
      bestScore = scores[ranked[0]];
      bestOrder = [...population[ranked[0]]];
    }
    const best = makeSolution(name, bestOrder, scenario);
    convergence.push({
      algorithm: name,
      iteration: generation,
      objective: best.objective,
      totalDistance: best.totalDistance,
    });

    const next: number[][] = ranked.slice(0, eliteCount).map((idx) => [...population[idx]]);
    while (next.length < populationSize) {
      const parentA = tournamentSelect(population, scores, rng);
      const parentB = tournamentSelect(population, scores, rng);
      let child = rng.random() < 0.85 ? orderCrossover(parentA, parentB, rng) : [...parentA];
      child = mutateOrder(child, rng, mutationRate);
      next.push(repairOrder(child, scenario));
    }
    population = next;
  }

  const runtimeSec = (performance.now() - start) / 1000;
  const solution = makeSolution(name, bestOrder, scenario, runtimeSec);
  return { solution, convergence, bestOrder };
}
