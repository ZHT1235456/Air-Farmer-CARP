import { Rng } from "./random";
import { evaluateOrder, makeSolution, repairOrder } from "./decoder";
import { initialPopulation, mutateOrder, orderCrossover, tournamentSelect } from "./ga";
import { localSearchOrder } from "./vns";
import { pathScanningCandidateOrders } from "./pathScanning";
import type { AlgorithmResult, AlgoScenario, ConvergencePoint } from "./types";

export interface MemeticOptions {
  seed?: number;
  seedOrders?: number[][];
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  localSearchRate?: number;
  algorithmName?: string;
}

/** MemeticGA = GA + 高质量初始种群 + 局部搜索（更稳定，更慢） */
export function solveMemeticGA(scenario: AlgoScenario, opts: MemeticOptions = {}): AlgorithmResult {
  const seed = opts.seed ?? scenario.seed;
  const populationSize = opts.populationSize ?? 42;
  const generations = opts.generations ?? 80;
  const mutationRate = opts.mutationRate ?? 0.32;
  const localSearchRate = opts.localSearchRate ?? 0.14;
  const name = opts.algorithmName ?? "MemeticGA";

  const rng = new Rng(seed);
  const start = performance.now();
  let population = initialPopulation(scenario, populationSize, rng);

  const highQuality = [
    ...(opts.seedOrders ?? []),
    ...pathScanningCandidateOrders(scenario, seed),
  ];
  for (let i = 0; i < highQuality.length && i < populationSize; i++) {
    population[i] = repairOrder(highQuality[i], scenario);
  }

  const eliteCount = Math.max(2, Math.floor(populationSize / 12));
  let bestOrder = population[0];
  let bestScore = Infinity;
  const convergence: ConvergencePoint[] = [];

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
    // 对前两个精英执行轻量局部搜索
    for (let e = 0; e < Math.min(2, next.length); e++) {
      next[e] = localSearchOrder(next[e], scenario, rng, 16);
    }
    while (next.length < populationSize) {
      const parentA = tournamentSelect(population, scores, rng);
      const parentB = tournamentSelect(population, scores, rng);
      let child = rng.random() < 0.88 ? orderCrossover(parentA, parentB, rng) : [...parentA];
      child = mutateOrder(child, rng, mutationRate);
      if (rng.random() < localSearchRate) {
        child = localSearchOrder(child, scenario, rng, 12);
      }
      next.push(repairOrder(child, scenario));
    }
    population = next;
  }

  // 末代再检查，防止最后一代生成更优个体但未更新 best
  const finalScores = population.map((o) => evaluateOrder(o, scenario));
  let fbi = 0;
  for (let i = 1; i < finalScores.length; i++) if (finalScores[i] < finalScores[fbi]) fbi = i;
  if (finalScores[fbi] < bestScore) bestOrder = [...population[fbi]];

  const runtimeSec = (performance.now() - start) / 1000;
  const solution = makeSolution(name, bestOrder, scenario, runtimeSec);
  return { solution, convergence, bestOrder };
}
