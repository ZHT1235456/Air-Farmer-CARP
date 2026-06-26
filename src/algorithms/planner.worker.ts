/// <reference lib="webworker" />
import type { AlgorithmMode, DroneParams, Scenario } from "../types/domain";
import { planRoutes, type PlanOutput } from "./index";

export interface PlanRequest {
  reqId: number;
  scenario: Scenario;
  drone: DroneParams;
  mode: AlgorithmMode;
  seed?: number;
}

export interface PlanResponse {
  reqId: number;
  output: PlanOutput;
}

self.onmessage = (e: MessageEvent<PlanRequest>) => {
  const { reqId, scenario, drone, mode, seed } = e.data;
  const output = planRoutes(scenario, drone, mode, seed ?? 42);
  const res: PlanResponse = { reqId, output };
  (self as DedicatedWorkerGlobalScope).postMessage(res);
};
