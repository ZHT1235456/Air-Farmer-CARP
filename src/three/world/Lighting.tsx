import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Point2D } from "../../types/domain";
import { getSunDir } from "./sun";

interface LightingProps {
  /** 场景中心（世界 2D 坐标） */
  center: Point2D;
  /** 场景较大边长，用于阴影锥与光源距离 */
  size: number;
}

/** 半球光 + 定向太阳光（投影），阴影锥按场景包围盒配置 */
export default function Lighting({ center, size }: LightingProps) {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sun = useMemo(() => getSunDir(), []);

  const cx = center.x;
  const cz = -center.y;
  const dist = size * 1.6;

  useEffect(() => {
    target.position.set(cx, 0, cz);
    target.updateMatrixWorld();
    if (dirRef.current) {
      dirRef.current.target = target;
      dirRef.current.target.updateMatrixWorld();
    }
  }, [cx, cz, target]);

  return (
    <>
      <hemisphereLight color={0xbcd6ff} groundColor={0x55452e} intensity={0.55} />
      <primitive object={target} />
      <directionalLight
        ref={dirRef}
        color={0xfff1d6}
        intensity={2.6}
        position={[cx + sun.x * dist, sun.y * dist, cz + sun.z * dist]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={dist * 3}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      />
    </>
  );
}
