/** 可复现随机数（mulberry32），替代 Python random.Random(seed) */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** [0,1) */
  random(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** [a,b) 实数 */
  uniform(a: number, b: number): number {
    return a + this.random() * (b - a);
  }

  /** [0,n) 整数 */
  randrange(n: number): number {
    return Math.floor(this.random() * n);
  }

  /** 从 [0,n) 无重复抽取 k 个索引 */
  sample(n: number, k: number): number[] {
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(this.random() * (n - i));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, k);
  }

  /** 原地洗牌（Fisher–Yates） */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  choice<T>(arr: T[]): T {
    return arr[this.randrange(arr.length)];
  }
}

/** 取使 key 最小的元素（类似 Python min(iterable, key=...)） */
export function minBy<T>(items: T[], key: (item: T) => number): T {
  let best = items[0];
  let bestScore = key(best);
  for (let i = 1; i < items.length; i++) {
    const s = key(items[i]);
    if (s < bestScore) {
      bestScore = s;
      best = items[i];
    }
  }
  return best;
}
