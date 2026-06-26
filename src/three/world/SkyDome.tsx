import { Sky } from "@react-three/drei";
import { useMemo } from "react";
import { getSunDir } from "./sun";

/** 天空：drei Sky（大气散射），离线生成无需联网 HDR */
export default function SkyDome() {
  const sunPosition = useMemo(() => {
    const d = getSunDir();
    return [d.x, d.y, d.z] as [number, number, number];
  }, []);

  return (
    <Sky
      distance={8000}
      sunPosition={sunPosition}
      turbidity={6}
      rayleigh={1.8}
      mieCoefficient={0.005}
      mieDirectionalG={0.8}
    />
  );
}
