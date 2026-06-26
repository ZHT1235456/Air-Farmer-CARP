import { useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { SimulationEngine } from "../simulation/simulationEngine";
import { simStore } from "../simulation/simStore";

export const CRUISE = 5;
const LAND_Y = 0.9;

interface Props {
  engine: SimulationEngine;
  speedRef: MutableRefObject<number>;
  droneRef: RefObject<THREE.Group>;
  emitterRef: MutableRefObject<THREE.Vector3>;
  activeRef: MutableRefObject<boolean>;
}

/** Canvas 内驱动器：每帧推进引擎、更新无人机位姿（含起降高度）、写入快照 store */
export default function SimDriver({ engine, speedRef, droneRef, emitterRef, activeRef }: Props) {
  const acc = useRef(0);
  const yRef = useRef(LAND_Y);

  useFrame((_s, dt) => {
    const step = Math.min(dt, 0.05);
    engine.advance(step, speedRef.current);
    const snap = engine.getSnapshot();

    // 起降高度：飞行/播种/返航在巡航高度；补给/待开始/完成落地
    let target = yRef.current;
    const s = snap.status;
    if (s === "running" || s === "seeding" || s === "returning") target = CRUISE;
    else if (s === "refilling" || s === "idle" || s === "completed") target = LAND_Y;
    yRef.current += (target - yRef.current) * Math.min(1, dt * 3);

    if (droneRef.current) {
      droneRef.current.position.set(snap.pos.x, yRef.current, -snap.pos.y);
      droneRef.current.rotation.y = snap.heading;
    }
    emitterRef.current.set(snap.pos.x, yRef.current - 0.7, -snap.pos.y);
    // 仅在巡航高度播种时喷粒子（落地补给不喷）
    activeRef.current = snap.isSeeding && yRef.current > CRUISE - 1;

    acc.current += dt;
    if (acc.current >= 0.1) {
      acc.current = 0;
      simStore.set(snap);
    }
  });

  return null;
}
