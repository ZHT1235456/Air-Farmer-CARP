import { useCallback, useEffect, useRef, useState } from "react";
import type { AlgorithmMode, DroneParams, Scenario } from "../types/domain";
import type { PlanOutput } from "../algorithms";
import type { PlanRequest, PlanResponse } from "../algorithms/planner.worker";

/** 封装 Web Worker 求解：run() 触发后台计算，UI 不阻塞 */
export function usePlanner() {
  const workerRef = useRef<Worker | null>(null);
  const cbRef = useRef<((o: PlanOutput) => void) | null>(null);
  const reqRef = useRef(0);
  const [planning, setPlanning] = useState(false);

  useEffect(() => {
    const w = new Worker(new URL("../algorithms/planner.worker.ts", import.meta.url), {
      type: "module",
    });
    w.onmessage = (e: MessageEvent<PlanResponse>) => {
      const { reqId, output } = e.data;
      if (reqId === reqRef.current) {
        setPlanning(false);
        cbRef.current?.(output);
      }
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  const run = useCallback(
    (
      scenario: Scenario,
      drone: DroneParams,
      mode: AlgorithmMode,
      seed: number,
      onDone: (o: PlanOutput) => void
    ) => {
      const reqId = ++reqRef.current;
      cbRef.current = onDone;
      setPlanning(true);
      const req: PlanRequest = { reqId, scenario, drone, mode, seed };
      workerRef.current?.postMessage(req);
    },
    []
  );

  return { planning, run };
}
