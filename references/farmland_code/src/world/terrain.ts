import { createNoise2D } from 'simplex-noise';

/** 可复现的 PRNG,用于给 simplex 噪声播种。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TerrainOptions {
  furrowSpacing: number; // 垄沟间距 (m)
  furrowAmplitude: number; // 垄脊高度 (m)
  rollAmplitude: number; // 大尺度地形起伏 (m)
  rollScale: number; // 起伏噪声频率
  clodAmplitude: number; // 细碎土块粗糙度 (m)
  clodScale: number; // 土块噪声频率
  furrowAngleDeg: number; // 垄沟方向 (与航带对齐)
  seed: number;
}

export const DEFAULT_TERRAIN: TerrainOptions = {
  furrowSpacing: 1.5,
  furrowAmplitude: 0.11,
  rollAmplitude: 0.55,
  rollScale: 0.016,
  clodAmplitude: 0.035,
  clodScale: 0.55,
  furrowAngleDeg: 0,
  seed: 20260625,
};

/**
 * 农田高度场。被 Farmland(地面位移)、Strips(航带贴合)、
 * Depot / Obstacles(物体落地)共用,保证所有对象贴合同一地形。
 */
export class Terrain {
  readonly opts: TerrainOptions;
  private noiseRoll: (x: number, y: number) => number;
  private noiseClod: (x: number, y: number) => number;
  private noiseWobble: (x: number, y: number) => number;
  private noisePatch: (x: number, y: number) => number;
  private cosA: number;
  private sinA: number;

  constructor(opts: Partial<TerrainOptions> = {}) {
    this.opts = { ...DEFAULT_TERRAIN, ...opts };
    this.noiseRoll = createNoise2D(mulberry32(this.opts.seed));
    this.noiseClod = createNoise2D(mulberry32(this.opts.seed + 101));
    this.noiseWobble = createNoise2D(mulberry32(this.opts.seed + 202));
    this.noisePatch = createNoise2D(mulberry32(this.opts.seed + 303));
    const a = (this.opts.furrowAngleDeg * Math.PI) / 180;
    this.cosA = Math.cos(a);
    this.sinA = Math.sin(a);
  }

  /** 垄沟相位值,范围约 [-1, 1];-1 为沟底,+1 为垄顶。 */
  furrowPhase(x: number, z: number): number {
    const across = -this.sinA * x + this.cosA * z;
    const wobble = this.noiseWobble(x * 0.03, z * 0.03) * 0.22;
    return Math.cos((across / this.opts.furrowSpacing + wobble) * Math.PI * 2);
  }

  /** 世界坐标 (x, z) 处的地面高度。 */
  height(x: number, z: number): number {
    const o = this.opts;
    const ridges = this.furrowPhase(x, z) * 0.5 * o.furrowAmplitude;
    const roll = this.noiseRoll(x * o.rollScale, z * o.rollScale) * o.rollAmplitude;
    const clod = this.noiseClod(x * o.clodScale, z * o.clodScale) * o.clodAmplitude;
    return ridges + roll + clod;
  }

  /** 大尺度湿度斑块 [0,1],用于土壤颜色变化。 */
  moisturePatch(x: number, z: number): number {
    return this.noisePatch(x * 0.012, z * 0.012) * 0.5 + 0.5;
  }
}
