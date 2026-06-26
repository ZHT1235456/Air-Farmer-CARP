import type { ReactNode } from "react";
import { useMemo } from "react";
import type { Scenario } from "../../types/domain";
import { computeSceneBounds } from "../coords";
import StripRenderer from "../StripRenderer";
import ObstacleRenderer from "../ObstacleRenderer";
import DepotMarker from "../DepotMarker";
import SkyDome from "./SkyDome";
import Lighting from "./Lighting";
import GroundPlane from "./GroundPlane";
import FieldGround from "./FieldGround";
import Bund from "./Bund";
import EnvDressing from "./EnvDressing";
import GrassWave from "./GrassWave";

/**
 * 可复用写实农田世界（不含 Canvas）。
 * 场景预览直接使用；播种模拟页可通过 children 叠加无人机 / 粒子等。
 */
export default function RealisticWorld({
  scenario,
  children,
  seededIds,
  stripInteractive = true,
}: {
  scenario: Scenario;
  children?: ReactNode;
  seededIds?: Set<string>;
  stripInteractive?: boolean;
}) {
  const bounds = useMemo(() => computeSceneBounds(scenario), [scenario]);
  const strips = useMemo(
    () => scenario.fields.flatMap((f) => f.strips),
    [scenario]
  );

  return (
    <>
      <SkyDome />
      <Lighting center={bounds.center} size={bounds.size} />

      <GroundPlane bounds={bounds} />
      {scenario.fields.map((f) => (
        <FieldGround key={f.id} field={f} />
      ))}
      {scenario.fields.map((f) => (
        <Bund key={`bund-${f.id}`} field={f} />
      ))}

      <StripRenderer strips={strips} seededIds={seededIds} interactive={stripInteractive} />
      <ObstacleRenderer obstacles={scenario.obstacles} />
      <DepotMarker depot={scenario.depot} />
      <EnvDressing bounds={bounds} depot={scenario.depot} />
      <GrassWave bounds={bounds} />

      {children}
    </>
  );
}
