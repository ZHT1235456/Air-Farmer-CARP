import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const DIST = 13;
const HEIGHT = 6;
const TWO_PI = Math.PI * 2;

/**
 * 第三人称跟踪相机：平滑跟随无人机本体。
 * 相机航向对无人机朝向做最短角差插值，避免航带末端朝向翻转导致的剧烈抖震。
 */
export default function FollowCamera({
  active,
  droneRef,
}: {
  active: boolean;
  droneRef: RefObject<THREE.Group>;
}) {
  const camera = useThree((s) => s.camera);
  const desired = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const yaw = useRef<number | null>(null);

  useFrame((_s, dt) => {
    if (!active) {
      yaw.current = null;
      return;
    }
    const d = droneRef.current;
    if (!d) return;

    const target = d.rotation.y;
    if (yaw.current === null) yaw.current = target;
    // 最短角差平滑插值
    let diff = ((target - yaw.current + Math.PI) % TWO_PI) - Math.PI;
    if (diff < -Math.PI) diff += TWO_PI;
    yaw.current += diff * Math.min(1, dt * 2.2);

    const h = yaw.current;
    const fx = Math.cos(h);
    const fz = -Math.sin(h);
    desired.current.set(d.position.x - fx * DIST, d.position.y + HEIGHT, d.position.z - fz * DIST);
    camera.position.lerp(desired.current, Math.min(1, dt * 3));
    look.current.copy(d.position);
    camera.lookAt(look.current);
  });

  return null;
}
