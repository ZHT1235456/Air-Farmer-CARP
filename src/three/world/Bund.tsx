import type { Field } from "../../types/domain";
import { segmentTransform } from "../coords";

const HEIGHT = 0.8;
const WIDTH = 1.2;

/** 田埂：沿农田多边形各边的抬高矮堤 */
export default function Bund({ field }: { field: Field }) {
  const poly = field.polygon;
  return (
    <group>
      {poly.map((a, i) => {
        const b = poly[(i + 1) % poly.length];
        const t = segmentTransform(a, b, HEIGHT / 2);
        return (
          <mesh
            key={i}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[t.length + WIDTH, HEIGHT, WIDTH]} />
            <meshStandardMaterial color="#6f5c3e" roughness={0.98} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
}
