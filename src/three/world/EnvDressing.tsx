import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Point2D } from "../../types/domain";
import type { SceneBounds } from "../coords";
import { cloudTexture } from "./procTextures";

interface TreeInstance {
  x: number;
  z: number;
  height: number;
  trunkR: number;
  crown: number;
  color: THREE.Color;
}

interface HouseInstance {
  x: number;
  z: number;
  rot: number;
  w: number;
  d: number;
  wall: string;
  roof: string;
}

const TREE_COUNT = 20;
const HOUSE_COUNT = 5;
const WALLS = ["#e6dcc3", "#ded2b6", "#e9e2d0", "#d8c7a8"];
const ROOFS = ["#a85a44", "#8a5a3c", "#9c6b3f", "#7d4a3a"];

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** 环境点缀：更饱满的树木（树干 + 双层树冠）+ 农舍 + 云 */
export default function EnvDressing({ bounds, depot }: { bounds: SceneBounds; depot: Point2D }) {
  const { trees, houses } = useMemo(() => {
    const cx = bounds.center.x;
    const cy = bounds.center.y;
    const rnd = makeRng(1234);
    const ring = (rMin: number, rMax: number, i: number, n: number, jitter: number) => {
      const ang = (i / n) * Math.PI * 2 + (rnd() - 0.5) * jitter;
      const r = rMin + rnd() * (rMax - rMin);
      return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
    };

    const trees: TreeInstance[] = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      const p = ring(bounds.size * 0.7, bounds.size * 1.45, i, TREE_COUNT, 0.6);
      if (Math.hypot(p.x - depot.x, p.y - depot.y) < 12) continue;
      const hue = 95 + (rnd() - 0.5) * 50;
      trees.push({
        x: p.x,
        z: -p.y,
        height: 4 + rnd() * 3,
        trunkR: 0.6 + rnd() * 0.4,
        crown: 2.6 + rnd() * 1.8,
        color: new THREE.Color().setHSL(hue / 360, 0.4, 0.27 + rnd() * 0.1),
      });
    }

    const houses: HouseInstance[] = [];
    for (let i = 0; i < HOUSE_COUNT; i++) {
      const p = ring(bounds.size * 0.85, bounds.size * 1.5, i + 0.5, HOUSE_COUNT, 0.4);
      if (Math.hypot(p.x - depot.x, p.y - depot.y) < 16) continue;
      houses.push({
        x: p.x,
        z: -p.y,
        rot: rnd() * Math.PI * 2,
        w: 5 + rnd() * 3,
        d: 4 + rnd() * 2,
        wall: WALLS[Math.floor(rnd() * WALLS.length)],
        roof: ROOFS[Math.floor(rnd() * ROOFS.length)],
      });
    }
    return { trees, houses };
  }, [bounds, depot]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownLowRef = useRef<THREE.InstancedMesh>(null);
  const crownHighRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    trees.forEach((t, i) => {
      dummy.position.set(t.x, t.height / 2, t.z);
      dummy.scale.set(t.trunkR, t.height, t.trunkR);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, t.height + t.crown * 0.35, t.z);
      dummy.scale.set(t.crown, t.crown * 0.9, t.crown);
      dummy.updateMatrix();
      crownLowRef.current?.setMatrixAt(i, dummy.matrix);
      crownLowRef.current?.setColorAt(i, t.color);

      dummy.position.set(t.x, t.height + t.crown * 0.95, t.z);
      dummy.scale.setScalar(t.crown * 0.62);
      dummy.updateMatrix();
      crownHighRef.current?.setMatrixAt(i, dummy.matrix);
      crownHighRef.current?.setColorAt(i, t.color.clone().offsetHSL(0, 0, 0.06));
    });
    [trunkRef, crownLowRef, crownHighRef].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
    if (crownLowRef.current?.instanceColor) crownLowRef.current.instanceColor.needsUpdate = true;
    if (crownHighRef.current?.instanceColor) crownHighRef.current.instanceColor.needsUpdate = true;
  }, [trees]);

  const clouds = useMemo(() => {
    const tex = cloudTexture();
    const rnd = makeRng(99);
    const arr: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        pos: [
          bounds.center.x + (rnd() - 0.5) * bounds.size * 2.4,
          bounds.size * 0.7 + rnd() * bounds.size * 0.4,
          -bounds.center.y + (rnd() - 0.5) * bounds.size * 2.4,
        ],
        scale: bounds.size * (0.4 + rnd() * 0.35),
      });
    }
    return { tex, arr };
  }, [bounds]);

  const tc = trees.length;

  return (
    <group>
      {tc > 0 && (
        <>
          <instancedMesh ref={trunkRef} args={[undefined, undefined, tc]} castShadow>
            <cylinderGeometry args={[0.5, 0.72, 1, 8]} />
            <meshStandardMaterial color="#6b4f2e" roughness={0.95} metalness={0} />
          </instancedMesh>
          <instancedMesh ref={crownLowRef} args={[undefined, undefined, tc]} castShadow>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial flatShading roughness={0.9} metalness={0} />
          </instancedMesh>
          <instancedMesh ref={crownHighRef} args={[undefined, undefined, tc]} castShadow>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial flatShading roughness={0.9} metalness={0} />
          </instancedMesh>
        </>
      )}

      {houses.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.rot, 0]}>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[h.w, 3.2, h.d]} />
            <meshStandardMaterial color={h.wall} roughness={0.92} metalness={0} />
          </mesh>
          <mesh position={[0, 4.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[Math.max(h.w, h.d) * 0.78, 2.2, 4]} />
            <meshStandardMaterial color={h.roof} roughness={0.85} metalness={0} flatShading />
          </mesh>
        </group>
      ))}

      {clouds.arr.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.scale, c.scale * 0.55, 1]}>
          <spriteMaterial map={clouds.tex} transparent opacity={0.78} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}
