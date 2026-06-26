import { useMemo } from "react";
import type { SceneBounds } from "../coords";
import { grassTexture } from "./procTextures";

/** 田外草地底盘，低于田块，承接阴影 */
export default function GroundPlane({ bounds }: { bounds: SceneBounds }) {
  const span = Math.max(bounds.width, bounds.height) * 3 + 200;
  const tex = useMemo(() => grassTexture(Math.max(6, Math.round(span / 14))), [span]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[bounds.center.x, -0.6, -bounds.center.y]}
      receiveShadow
    >
      <planeGeometry args={[span, span]} />
      <meshStandardMaterial map={tex} roughness={1} metalness={0} />
    </mesh>
  );
}
