import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { Scenario } from "../types/domain";
import { computeSceneBounds, computeCameraPose } from "./coords";
import RealisticWorld from "./world/RealisticWorld";

interface WorldCanvasProps {
  scenario: Scenario;
  /** 叠加在世界之上的三维内容（如航线、无人机） */
  children?: ReactNode;
  onPointerMissed?: () => void;
}

/** 通用三维画布：写实世界 + 斜俯视相机；供场景预览与航线规划共用 */
export default function WorldCanvas({ scenario, children, onPointerMissed }: WorldCanvasProps) {
  const bounds = useMemo(() => computeSceneBounds(scenario), [scenario]);
  const pose = useMemo(() => computeCameraPose(bounds), [bounds]);
  const size = bounds.size;

  return (
    <Canvas
      key={scenario.id}
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.62,
      }}
      onPointerMissed={onPointerMissed}
    >
      <fog attach="fog" args={["#cdd6cf", size * 1.4, size * 9]} />

      <PerspectiveCamera makeDefault fov={52} near={0.5} far={size * 12} position={pose.position} />
      <OrbitControls
        makeDefault
        target={pose.target}
        enableDamping
        dampingFactor={0.05}
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI * 0.495}
        minDistance={pose.minDistance}
        maxDistance={pose.maxDistance}
      />

      <RealisticWorld scenario={scenario}>{children}</RealisticWorld>
    </Canvas>
  );
}
