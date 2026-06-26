import { describe, expect, it } from "vitest";
import type { Obstacle, Point2D } from "../types/domain";
import { cbfSteer } from "./avoidance";

const lineObstacle: Obstacle = {
  id: "L-test",
  type: "line",
  label: "line",
  buffer: 2.2,
  points: [
    { x: -20, y: 0 },
    { x: 20, y: 0 },
  ],
};

describe("cbfSteer", () => {
  it("slides tangentially near a head-on line obstacle", () => {
    const dir = cbfSteer({ x: 0, y: -5 }, { x: 0, y: 8 }, [lineObstacle], {
      sideBias: 1,
    });

    expect(dir.x).toBeGreaterThan(0.7);
    expect(Math.abs(dir.y)).toBeLessThan(0.25);
  });

  it("keeps a stable side while following a line obstacle", () => {
    let p: Point2D = { x: 0, y: -5 };
    let previousDir: Point2D | null = null;
    const directions: Point2D[] = [];

    for (let i = 0; i < 8; i++) {
      const dir = cbfSteer(p, { x: 0, y: 8 }, [lineObstacle], {
        previousDir,
        sideBias: 1,
      });
      directions.push(dir);
      previousDir = dir;
      p = { x: p.x + dir.x * 0.6, y: p.y + dir.y * 0.6 };
    }

    expect(directions.every((dir) => dir.x > 0.35)).toBe(true);
    expect(p.y).toBeLessThan(-4.4);
  });
});
