import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { Scenario } from "../types/domain";
import { computeSceneBounds, computeCameraPose } from "./coords";
import RealisticWorld from "./world/RealisticWorld";

interface WorldCanvasProps {
  scenario: Scenario;
  /** 叠加在世界之上的三维内容（如航线、无人机） */
  children?: ReactNode;
  onPointerMissed?: () => void;
  /** 轨道控制是否启用（跟踪视角时关闭） */
  orbitEnabled?: boolean;
  /** 已播种航带集合 */
  seededIds?: Set<string>;
  /** 航带是否可点击 */
  stripInteractive?: boolean;
}

/** 通用三维画布：写实世界 + 斜俯视相机；供场景预览 / 规划 / 仿真共用 */
export default function WorldCanvas({
  scenario,
  children,
  onPointerMissed,
  orbitEnabled = true,
  seededIds,
  stripInteractive,
}: WorldCanvasProps) {
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
        toneMappingExposure: 1.05,
      }}
      onPointerMissed={onPointerMissed}
    >
      <fog attach="fog" args={["#cdd6cf", size * 1.4, size * 9]} />

      <PerspectiveCamera makeDefault fov={52} near={0.5} far={size * 12} position={pose.position} />
      <OrbitControls
        makeDefault
        enabled={orbitEnabled}
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

      <RealisticWorld scenario={scenario} seededIds={seededIds} stripInteractive={stripInteractive}>
        {children}
      </RealisticWorld>

      {/* 程序化柔光环境（离线、无 HDR）：为金属/漆面提供反射 */}
      <Environment resolution={64} frames={1} background={false}>
        <Lightformer
          intensity={2.4}
          color="#fff1d6"
          position={[0, 8, 0]}
          scale={[size * 1.5, size * 1.5, 1]}
        />
        <Lightformer
          intensity={1.6}
          color="#bcd6ff"
          position={[-size, 4, -size]}
          scale={[size, size, 1]}
          rotation={[0, Math.PI / 4, 0]}
        />
        <Lightformer
          intensity={1.2}
          color="#d9a441"
          position={[size, 3, size]}
          scale={[size, size, 1]}
          rotation={[0, -Math.PI / 4, 0]}
        />
      </Environment>

      {/* 轻量后处理：让金色与高光微微泛光 */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.22}
          luminanceThreshold={0.78}
          luminanceSmoothing={0.3}
          radius={0.7}
        />
      </EffectComposer>
    </Canvas>
  );
}