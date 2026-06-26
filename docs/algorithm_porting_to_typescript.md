# 空中农夫算法迁移说明：Python 到 TypeScript

本文档用于后续把 Python 验证系统重写为 TypeScript。核心原则是：所有优化算法都只操作“航带排列”，真正的容量约束、航程约束、返航分割和评价指标统一交给 `decode_order()` 与 `make_solution()` 处理。

当前推荐迁移的算法模式：

- 快速模式：`PathScanning`
- 标准模式：`GA`
- 高质量模式：`MemeticGA`
- 局部改进：`VNS`

Python 代码仍保留 `Greedy`、`SA`、`PSO`、`GA+SA` 作为历史对照。后续 TypeScript 系统不建议迁移 `SA` 和 `PSO`，避免增加维护成本。

## 1. 核心数据模型

Python 位置：`experiments/air_farmer_core.py`

```python
Point = tuple[float, float]
Rect = tuple[float, float, float, float]


@dataclass(frozen=True)
class Strip:
    id: int
    start: Point
    end: Point
    length: float
    demand: float
    area: float
    row_y: float


@dataclass
class Route:
    strip_ids: list[int]
    distance: float
    demand: float
    path: list[Point] = field(default_factory=list)
    service_segments: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class Solution:
    algorithm: str
    routes: list[Route]
    total_distance: float
    returns: int
    coverage: float
    runtime_sec: float
    violations: int
    objective: float
    order: list[int] = field(default_factory=list)


@dataclass(frozen=True)
class Scenario:
    field_size: Point
    depot: Point
    obstacles: list[Rect]
    swath_width: float
    seed_density: float
    capacity: float
    max_route_distance: float
    strips: list[Strip]
    seed: int = 42
```

TypeScript 建议接口：

```ts
export type Point = [number, number];
export type Rect = [number, number, number, number];

export interface Strip {
  id: number;
  start: Point;
  end: Point;
  length: number;
  demand: number;
  area: number;
  rowY: number;
}

export interface ServiceSegment {
  stripId: number;
  entry: Point;
  exit: Point;
  orientation: 0 | 1;
}

export interface Route {
  stripIds: number[];
  distance: number;
  demand: number;
  path: Point[];
  serviceSegments: ServiceSegment[];
}

export interface Solution {
  algorithm: string;
  routes: Route[];
  totalDistance: number;
  returns: number;
  coverage: number;
  runtimeSec: number;
  violations: number;
  objective: number;
  order: number[];
}

export interface Scenario {
  fieldSize: Point;
  depot: Point;
  obstacles: Rect[];
  swathWidth: number;
  seedDensity: number;
  capacity: number;
  maxRouteDistance: number;
  strips: Strip[];
  seed: number;
}
```

迁移注意点：

- Python 的 `tuple[float, float]` 在 TypeScript 中直接用 `[number, number]`。
- Python 的 `strip_by_id()` 在 TypeScript 中建议缓存成 `Map<number, Strip>`，避免频繁线性查找。
- 所有算法输出都是 `number[]` 类型的航带 id 排列。
- 所有解都必须经过 `makeSolution()`，不能让算法直接拼路线，否则约束逻辑会分散。

## 2. 场景与障碍物切分

固定验证场景是一个矩形地块，障碍物暂用矩形表示。水平扫描生成航带，如果航带的 `y` 坐标穿过障碍物，就把该行的可服务区间切成多个子航带。

Python 代码：

```python
def distance(a: Point, b: Point) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def rect_contains_y(rect: Rect, y: float) -> bool:
    return rect[1] <= y <= rect[3]


def subtract_intervals(base: tuple[float, float], cuts: list[tuple[float, float]]) -> list[tuple[float, float]]:
    intervals = [base]
    for cut_start, cut_end in sorted(cuts):
        next_intervals: list[tuple[float, float]] = []
        for start, end in intervals:
            if cut_end <= start or cut_start >= end:
                next_intervals.append((start, end))
                continue
            if cut_start > start:
                next_intervals.append((start, cut_start))
            if cut_end < end:
                next_intervals.append((cut_end, end))
        intervals = next_intervals
    return [(start, end) for start, end in intervals if end - start >= 8.0]
```

逻辑说明：

- `rect_contains_y()` 判断某条水平航带是否与矩形障碍物在纵向相交。
- `subtract_intervals()` 从完整作业区间 `[0, width]` 中减去障碍物占用的 `x` 区间。
- 剩余区间长度小于 `8m` 时丢弃，避免生成过短且意义不大的航带。
- 后续真实系统可把电线杆建模为圆形缓冲区，把架空线建模为折线缓冲区，但输出仍然应是若干 `Strip`。

## 3. 统一路线解码器

这是最重要的迁移部分。算法本身只决定航带顺序，`decode_order()` 负责把一个排列切分成多趟路线，并检查容量和航程。

### 3.1 排列修复

Python 代码：

```python
def repair_order(order: Iterable[int], scenario: Scenario) -> list[int]:
    expected = all_strip_ids(scenario)
    expected_set = set(expected)
    seen: set[int] = set()
    repaired: list[int] = []
    for item in order:
        strip_id = int(item)
        if strip_id in expected_set and strip_id not in seen:
            repaired.append(strip_id)
            seen.add(strip_id)
    repaired.extend(strip_id for strip_id in expected if strip_id not in seen)
    return repaired
```

逻辑说明：

- 删除非法 id。
- 删除重复 id。
- 把缺失航带按场景默认顺序补到末尾。
- 这一步保证遗传算法交叉、变异后仍能形成完整服务排列。

### 3.2 单趟路线最短方向选择

每条航带都可以正向或反向服务。`best_route_geometry()` 使用两状态动态规划，为一趟路线中的每条航带选择更短的进入端和退出端。

Python 代码：

```python
def oriented_points(strip: Strip, orientation: int) -> tuple[Point, Point]:
    if orientation == 0:
        return strip.start, strip.end
    return strip.end, strip.start


def best_route_geometry(strip_ids: list[int], scenario: Scenario) -> tuple[float, list[Point], list[dict[str, Any]]]:
    if not strip_ids:
        return 0.0, [scenario.depot], []

    strips = strip_by_id(scenario)
    depot = scenario.depot
    n = len(strip_ids)

    dp = np.full((n, 2), np.inf)
    parent = np.full((n, 2), -1, dtype=int)

    first = strips[strip_ids[0]]
    for orientation in (0, 1):
        entry, exit_point = oriented_points(first, orientation)
        dp[0, orientation] = distance(depot, entry) + first.length

    for idx in range(1, n):
        current = strips[strip_ids[idx]]
        for orientation in (0, 1):
            entry, _ = oriented_points(current, orientation)
            best_prev_cost = np.inf
            best_prev_orientation = -1
            for prev_orientation in (0, 1):
                prev_strip = strips[strip_ids[idx - 1]]
                _, prev_exit = oriented_points(prev_strip, prev_orientation)
                cost = dp[idx - 1, prev_orientation] + distance(prev_exit, entry) + current.length
                if cost < best_prev_cost:
                    best_prev_cost = cost
                    best_prev_orientation = prev_orientation
            dp[idx, orientation] = best_prev_cost
            parent[idx, orientation] = best_prev_orientation

    final_costs: list[float] = []
    last_strip = strips[strip_ids[-1]]
    for orientation in (0, 1):
        _, exit_point = oriented_points(last_strip, orientation)
        final_costs.append(float(dp[n - 1, orientation] + distance(exit_point, depot)))
    last_orientation = int(np.argmin(final_costs))
    total_distance = final_costs[last_orientation]

    orientations = [0] * n
    orientations[-1] = last_orientation
    for idx in range(n - 1, 0, -1):
        orientations[idx - 1] = int(parent[idx, orientations[idx]])

    path: list[Point] = [depot]
    service_segments: list[dict[str, Any]] = []
    for strip_id, orientation in zip(strip_ids, orientations):
        strip = strips[strip_id]
        entry, exit_point = oriented_points(strip, orientation)
        path.append(entry)
        path.append(exit_point)
        service_segments.append(
            {
                "strip_id": strip_id,
                "entry": [entry[0], entry[1]],
                "exit": [exit_point[0], exit_point[1]],
                "orientation": orientation,
            }
        )
    path.append(depot)
    return total_distance, path, service_segments
```

TypeScript 重写提示：

- 不需要 `numpy`，用 `number[][]` 即可。
- `dp[i][0]` 表示第 `i` 条航带正向服务后的最小距离。
- `dp[i][1]` 表示第 `i` 条航带反向服务后的最小距离。
- `parent[i][orientation]` 记录上一条航带的方向，用于回溯完整路径。

### 3.3 路线切分与目标函数

Python 代码：

```python
def route_demand(strip_ids: list[int], scenario: Scenario) -> float:
    strips = strip_by_id(scenario)
    return float(sum(strips[strip_id].demand for strip_id in strip_ids))


def build_route(strip_ids: list[int], scenario: Scenario) -> Route:
    route_distance, path, service_segments = best_route_geometry(strip_ids, scenario)
    return Route(
        strip_ids=list(strip_ids),
        distance=float(route_distance),
        demand=route_demand(strip_ids, scenario),
        path=path,
        service_segments=service_segments,
    )


def decode_order(order: Iterable[int], scenario: Scenario) -> tuple[list[Route], int, list[int]]:
    repaired_order = repair_order(order, scenario)
    routes: list[Route] = []
    violations = 0
    current: list[int] = []

    for strip_id in repaired_order:
        candidate = current + [strip_id]
        candidate_demand = route_demand(candidate, scenario)
        candidate_distance, _, _ = best_route_geometry(candidate, scenario)
        if (
            current
            and (
                candidate_demand > scenario.capacity + 1e-9
                or candidate_distance > scenario.max_route_distance + 1e-9
            )
        ):
            routes.append(build_route(current, scenario))
            current = [strip_id]
            single_demand = route_demand(current, scenario)
            single_distance, _, _ = best_route_geometry(current, scenario)
            if (
                single_demand > scenario.capacity + 1e-9
                or single_distance > scenario.max_route_distance + 1e-9
            ):
                violations += 1
        else:
            current = candidate

    if current:
        routes.append(build_route(current, scenario))

    for route in routes:
        if route.demand > scenario.capacity + 1e-9:
            violations += 1
        if route.distance > scenario.max_route_distance + 1e-9:
            violations += 1

    return routes, violations, repaired_order


def objective_value(total_distance: float, returns: int, violations: int, missing_count: int = 0) -> float:
    return total_distance + 30.0 * returns + 5000.0 * violations + 5000.0 * missing_count


def evaluate_order(order: Iterable[int], scenario: Scenario) -> float:
    return make_solution("candidate", order, scenario).objective
```

逻辑说明：

- 逐个尝试把下一条航带加入当前路线。
- 如果加入后超过种箱容量或单趟航程，就结束当前路线并从该航带新开一趟。
- `returns = routes.length - 1`，因为第一趟从补给点出发不算返航补给次数。
- 目标函数当前为：

```text
objective = totalDistance + 30 * returns + 5000 * violations + 5000 * missing
```

这个目标函数必须在 TypeScript 中保持一致，否则前后端结果无法对齐。

## 4. 基础构造顺序

这些函数主要用于算法初始化和对照，不一定作为用户可选模式暴露。

```python
def scanline_order(scenario: Scenario) -> list[int]:
    return [strip.id for strip in sorted(scenario.strips, key=lambda s: (s.row_y, s.start[0]))]


def nearest_neighbor_order(scenario: Scenario) -> list[int]:
    remaining = set(all_strip_ids(scenario))
    strips = strip_by_id(scenario)
    current = scenario.depot
    order: list[int] = []
    while remaining:
        best_id = min(
            remaining,
            key=lambda strip_id: min(distance(current, strips[strip_id].start), distance(current, strips[strip_id].end)),
        )
        strip = strips[best_id]
        if distance(current, strip.start) <= distance(current, strip.end):
            current = strip.end
        else:
            current = strip.start
        order.append(best_id)
        remaining.remove(best_id)
    return order
```

逻辑说明：

- `scanline_order()`：按 `y` 行号和 `x` 起点排序，模拟规则农田的逐行作业。
- `nearest_neighbor_order()`：从补给点开始，每次选择离当前位置最近的航带端点。

## 5. 快速模式：PathScanning

PathScanning 是面向 CARP 的构造启发式。它不是只生成一个贪心解，而是使用多条规则生成多个候选排列，再选目标函数最小的方案。

Python 代码：

```python
def strip_depot_distance(strip: Strip, scenario: Scenario) -> float:
    center = ((strip.start[0] + strip.end[0]) / 2.0, (strip.start[1] + strip.end[1]) / 2.0)
    return distance(center, scenario.depot)


def path_scanning_rule_order(
    scenario: Scenario,
    rule: str,
    rng: random.Random,
) -> list[int]:
    remaining = set(all_strip_ids(scenario))
    strips = strip_by_id(scenario)
    order: list[int] = []

    while remaining:
        current: list[int] = []
        while remaining:
            base_distance = best_route_geometry(current, scenario)[0] if current else 0.0
            base_demand = route_demand(current, scenario)
            feasible: list[dict[str, float | int]] = []
            for strip_id in remaining:
                candidate = current + [strip_id]
                candidate_demand = route_demand(candidate, scenario)
                candidate_distance, _, _ = best_route_geometry(candidate, scenario)
                if (
                    candidate_demand <= scenario.capacity + 1e-9
                    and candidate_distance <= scenario.max_route_distance + 1e-9
                ):
                    strip = strips[strip_id]
                    feasible.append(
                        {
                            "strip_id": strip_id,
                            "increment": candidate_distance - base_distance,
                            "depot_distance": strip_depot_distance(strip, scenario),
                            "demand": strip.demand,
                            "length": strip.length,
                            "remaining_capacity": scenario.capacity - base_demand,
                        }
                    )
            if not feasible:
                break

            if rule == "nearest":
                chosen = min(feasible, key=lambda item: (item["increment"], -item["demand"], item["strip_id"]))
            elif rule == "farthest_depot":
                chosen = min(feasible, key=lambda item: (item["increment"] - 0.25 * item["depot_distance"], item["strip_id"]))
            elif rule == "nearest_depot":
                chosen = min(feasible, key=lambda item: (item["increment"] + 0.20 * item["depot_distance"], item["strip_id"]))
            elif rule == "demand_density":
                chosen = min(feasible, key=lambda item: (item["increment"] / max(item["demand"], 1e-9), item["strip_id"]))
            elif rule == "capacity_fill":
                chosen = min(
                    feasible,
                    key=lambda item: (
                        abs(item["remaining_capacity"] - item["demand"]) / max(item["remaining_capacity"], 1e-9),
                        item["increment"],
                    ),
                )
            else:
                chosen = min(feasible, key=lambda item: (item["increment"] + rng.uniform(-12.0, 12.0), item["strip_id"]))

            strip_id = int(chosen["strip_id"])
            current.append(strip_id)
            remaining.remove(strip_id)

        if not current:
            strip_id = min(remaining)
            current.append(strip_id)
            remaining.remove(strip_id)
        order.extend(current)

    return repair_order(order, scenario)


def path_scanning_candidate_orders(scenario: Scenario, seed: int = 42) -> list[list[int]]:
    rng = random.Random(seed)
    rules = [
        "nearest",
        "farthest_depot",
        "nearest_depot",
        "demand_density",
        "capacity_fill",
        "randomized",
    ]
    candidates = [
        greedy_order(scenario),
        nearest_neighbor_order(scenario),
        scanline_order(scenario),
        list(reversed(scanline_order(scenario))),
    ]
    for rule in rules:
        candidates.append(path_scanning_rule_order(scenario, rule, rng))
    for _ in range(6):
        candidates.append(path_scanning_rule_order(scenario, "randomized", rng))
    unique: list[list[int]] = []
    seen: set[tuple[int, ...]] = set()
    for candidate in candidates:
        repaired = repair_order(candidate, scenario)
        key = tuple(repaired)
        if key not in seen:
            unique.append(repaired)
            seen.add(key)
    return unique


def solve_path_scanning(
    scenario: Scenario,
    seed: int = 42,
    algorithm_name: str = "PathScanning",
) -> tuple[Solution, list[dict[str, Any]], list[int]]:
    start = time.perf_counter()
    candidates = path_scanning_candidate_orders(scenario, seed)
    best_order = candidates[0]
    best_score = math.inf
    convergence: list[dict[str, Any]] = []
    for idx, order in enumerate(candidates):
        solution = make_solution(algorithm_name, order, scenario)
        if solution.objective < best_score:
            best_score = solution.objective
            best_order = list(order)
        best_solution = make_solution(algorithm_name, best_order, scenario)
        convergence.append(
            {
                "algorithm": algorithm_name,
                "iteration": idx,
                "objective": best_solution.objective,
                "total_distance": best_solution.total_distance,
            }
        )
    runtime = time.perf_counter() - start
    solution = make_solution(algorithm_name, best_order, scenario, runtime)
    return solution, convergence, best_order
```

规则解释：

- `nearest`：优先增量距离最小。
- `farthest_depot`：偏向优先处理远离补给点的航带，降低后期孤立远端航带带来的返航成本。
- `nearest_depot`：偏向靠近补给点的航带，适合作为另一种构造对照。
- `demand_density`：单位需求带来的距离增量越小越优。
- `capacity_fill`：尽量填满当前趟的剩余种箱容量。
- `randomized`：在增量距离上加入扰动，产生多样候选。

TypeScript 迁移注意点：

- `random.Random(seed)` 需要替换为可复现随机数，例如 `seedrandom` 或自写 LCG。
- Python 的 `min(feasible, key=...)` 在 TypeScript 中可写一个 `minBy()` 工具函数。
- `Set<number>` 的遍历顺序在 JS 中是插入顺序；如果需要完全复现实验，建议对候选 id 排序后再遍历。

## 6. 标准模式：GA

GA 使用排列编码。每个个体是完整航带 id 排列，交叉和变异之后通过 `repair_order()` 修复。

Python 代码：

```python
def order_crossover(parent_a: list[int], parent_b: list[int], rng: random.Random) -> list[int]:
    n = len(parent_a)
    left, right = sorted(rng.sample(range(n), 2))
    child: list[int | None] = [None] * n
    child[left : right + 1] = parent_a[left : right + 1]
    fill_values = [item for item in parent_b if item not in child]
    fill_index = 0
    for idx in list(range(right + 1, n)) + list(range(0, right + 1)):
        if child[idx] is None:
            child[idx] = fill_values[fill_index]
            fill_index += 1
    return [int(item) for item in child if item is not None]


def mutate_order(order: list[int], rng: random.Random, mutation_rate: float = 0.25) -> list[int]:
    mutated = list(order)
    if rng.random() >= mutation_rate or len(mutated) < 2:
        return mutated
    move = rng.choice(["swap", "inversion", "insertion"])
    i, j = sorted(rng.sample(range(len(mutated)), 2))
    if move == "swap":
        mutated[i], mutated[j] = mutated[j], mutated[i]
    elif move == "inversion":
        mutated[i : j + 1] = reversed(mutated[i : j + 1])
    else:
        value = mutated.pop(j)
        mutated.insert(i, value)
    return mutated


def tournament_select(population: list[list[int]], scores: list[float], rng: random.Random, k: int = 3) -> list[int]:
    candidates = rng.sample(range(len(population)), k)
    best_index = min(candidates, key=lambda idx: scores[idx])
    return list(population[best_index])


def initial_population(scenario: Scenario, size: int, rng: random.Random) -> list[list[int]]:
    base_orders = [
        greedy_order(scenario),
        nearest_neighbor_order(scenario),
        scanline_order(scenario),
        list(reversed(scanline_order(scenario))),
    ]
    population = [repair_order(order, scenario) for order in base_orders]
    ids = all_strip_ids(scenario)
    while len(population) < size:
        candidate = list(ids)
        rng.shuffle(candidate)
        population.append(candidate)
    return population[:size]


def solve_ga(
    scenario: Scenario,
    seed: int = 42,
    population_size: int = 64,
    generations: int = 160,
    mutation_rate: float = 0.30,
    algorithm_name: str = "GA",
) -> tuple[Solution, list[dict[str, Any]], list[int]]:
    rng = random.Random(seed)
    start = time.perf_counter()
    population = initial_population(scenario, population_size, rng)
    elite_count = max(2, population_size // 16)
    convergence: list[dict[str, Any]] = []

    best_order = population[0]
    best_score = math.inf

    for generation in range(generations):
        scores = [evaluate_order(order, scenario) for order in population]
        ranked = sorted(range(len(population)), key=lambda idx: scores[idx])
        if scores[ranked[0]] < best_score:
            best_score = float(scores[ranked[0]])
            best_order = list(population[ranked[0]])
        best_solution = make_solution(algorithm_name, best_order, scenario)
        convergence.append(
            {
                "algorithm": algorithm_name,
                "iteration": generation,
                "objective": best_solution.objective,
                "total_distance": best_solution.total_distance,
            }
        )

        next_population = [list(population[idx]) for idx in ranked[:elite_count]]
        while len(next_population) < population_size:
            parent_a = tournament_select(population, scores, rng)
            parent_b = tournament_select(population, scores, rng)
            if rng.random() < 0.85:
                child = order_crossover(parent_a, parent_b, rng)
            else:
                child = list(parent_a)
            child = mutate_order(child, rng, mutation_rate)
            next_population.append(repair_order(child, scenario))
        population = next_population

    runtime = time.perf_counter() - start
    solution = make_solution(algorithm_name, best_order, scenario, runtime)
    return solution, convergence, best_order
```

逻辑说明：

- 编码：`[stripId1, stripId2, ...]`。
- 适应度：`evaluate_order(order, scenario)`，数值越小越好。
- 选择：锦标赛选择，默认每次抽 3 个个体。
- 交叉：OX 交叉，保留父代 A 的一个连续片段，再按父代 B 顺序填充缺口。
- 变异：`swap`、`inversion`、`insertion` 三选一。
- 精英保留：每代保留前 `max(2, population_size // 16)` 个个体。

TypeScript 迁移注意点：

- `rng.sample(range(n), 2)` 需要写成 `sampleIndices(n, 2, rng)`。
- `child[left : right + 1]` 迁移为 `child.slice(left, right + 1)` 或手动赋值。
- OX 交叉中判断 `item not in child` 时，TypeScript 可使用 `Set<number>` 提升效率。

## 7. 局部改进：VNS

VNS 在多个邻域之间切换，只接受目标函数更低的候选。它既可以作为独立算法，也可以嵌入 `MemeticGA`。

Python 代码：

```python
def route_ranges(routes: list[Route]) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    offset = 0
    for route in routes:
        start = offset
        offset += len(route.strip_ids)
        ranges.append((start, offset))
    return ranges


def route_aware_neighbor(order: list[int], scenario: Scenario, rng: random.Random, move: str) -> list[int]:
    routes, _, repaired_order = decode_order(order, scenario)
    ranges = [item for item in route_ranges(routes) if item[1] > item[0]]
    if len(repaired_order) < 2 or not ranges:
        return list(repaired_order)
    candidate = list(repaired_order)

    if move == "route_relocate" and len(ranges) >= 2:
        source_range = rng.choice(ranges)
        target_range = rng.choice(ranges)
        source_index = rng.randrange(source_range[0], source_range[1])
        target_index = rng.randrange(target_range[0], target_range[1] + 1)
        value = candidate.pop(source_index)
        if target_index > source_index:
            target_index -= 1
        candidate.insert(max(0, min(target_index, len(candidate))), value)
        return candidate

    if move == "route_exchange" and len(ranges) >= 2:
        left_range, right_range = rng.sample(ranges, 2)
        left_index = rng.randrange(left_range[0], left_range[1])
        right_index = rng.randrange(right_range[0], right_range[1])
        candidate[left_index], candidate[right_index] = candidate[right_index], candidate[left_index]
        return candidate

    return neighbor_order(candidate, rng)


def neighborhood_order(order: list[int], scenario: Scenario, rng: random.Random, neighborhood: str) -> list[int]:
    candidate = list(order)
    if len(candidate) < 2:
        return candidate
    if neighborhood == "swap":
        i, j = sorted(rng.sample(range(len(candidate)), 2))
        candidate[i], candidate[j] = candidate[j], candidate[i]
    elif neighborhood == "insertion":
        i, j = rng.sample(range(len(candidate)), 2)
        value = candidate.pop(i)
        candidate.insert(j, value)
    elif neighborhood == "inversion":
        i, j = sorted(rng.sample(range(len(candidate)), 2))
        candidate[i : j + 1] = reversed(candidate[i : j + 1])
    else:
        candidate = route_aware_neighbor(candidate, scenario, rng, neighborhood)
    return repair_order(candidate, scenario)


def local_search_order(
    order: list[int],
    scenario: Scenario,
    rng: random.Random,
    max_checks: int = 80,
    neighborhoods: tuple[str, ...] = ("swap", "insertion", "inversion", "route_relocate", "route_exchange"),
) -> list[int]:
    best_order = repair_order(order, scenario)
    best_score = evaluate_order(best_order, scenario)
    checks = 0
    improved = True
    while improved and checks < max_checks:
        improved = False
        for neighborhood in neighborhoods:
            if checks >= max_checks:
                break
            for _ in range(4):
                if checks >= max_checks:
                    break
                candidate = neighborhood_order(best_order, scenario, rng, neighborhood)
                score = evaluate_order(candidate, scenario)
                checks += 1
                if score < best_score - 1e-9:
                    best_order = candidate
                    best_score = score
                    improved = True
                    break
            if improved:
                break
    return best_order


def solve_vns(
    scenario: Scenario,
    initial_order: list[int] | None = None,
    seed: int = 42,
    max_iterations: int = 80,
    no_improve_limit: int = 18,
    trials_per_neighborhood: int = 5,
    algorithm_name: str = "VNS",
) -> tuple[Solution, list[dict[str, Any]], list[int]]:
    rng = random.Random(seed)
    start = time.perf_counter()
    if initial_order is None:
        candidates = path_scanning_candidate_orders(scenario, seed) + [greedy_order(scenario), nearest_neighbor_order(scenario)]
        current_order = min(candidates, key=lambda item: evaluate_order(item, scenario))
    else:
        current_order = repair_order(initial_order, scenario)
    current_score = evaluate_order(current_order, scenario)
    best_order = list(current_order)
    best_score = current_score
    neighborhoods = ("swap", "insertion", "inversion", "route_relocate", "route_exchange")
    no_improve = 0
    convergence: list[dict[str, Any]] = []

    for iteration in range(max_iterations):
        improved = False
        for neighborhood in neighborhoods:
            local_best_order = best_order
            local_best_score = best_score
            for _ in range(trials_per_neighborhood):
                candidate = neighborhood_order(best_order, scenario, rng, neighborhood)
                candidate = local_search_order(candidate, scenario, rng, max_checks=8, neighborhoods=(neighborhood,))
                score = evaluate_order(candidate, scenario)
                if score < local_best_score - 1e-9:
                    local_best_order = candidate
                    local_best_score = score
            if local_best_score < best_score - 1e-9:
                best_order = list(local_best_order)
                best_score = local_best_score
                improved = True
                break

        no_improve = 0 if improved else no_improve + 1
        best_solution = make_solution(algorithm_name, best_order, scenario)
        convergence.append(
            {
                "algorithm": algorithm_name,
                "iteration": iteration,
                "objective": best_solution.objective,
                "total_distance": best_solution.total_distance,
            }
        )
        if no_improve >= no_improve_limit:
            break

    runtime = time.perf_counter() - start
    solution = make_solution(algorithm_name, best_order, scenario, runtime)
    return solution, convergence, best_order
```

邻域解释：

- `swap`：交换两个航带。
- `insertion`：取出一个航带，插入到另一个位置。
- `inversion`：反转一段连续航带。
- `route_relocate`：根据当前 `decode_order()` 的路线边界，把某条航带移动到另一趟路线附近。
- `route_exchange`：交换两趟路线中的航带。

TypeScript 迁移注意点：

- `route_aware_neighbor()` 依赖当前解码后的路线边界，所以需要调用 `decodeOrder()`。
- `local_search_order()` 是轻量局部搜索，不穷举所有邻域，只做有限次数随机检查。
- `solve_vns()` 的停止条件是连续 `noImproveLimit` 轮无改进。

## 8. 高质量模式：MemeticGA

MemeticGA = GA + 高质量初始种群 + 局部搜索。它比普通 GA 更稳定，但运行时间更长。

Python 代码：

```python
def solve_memetic_ga(
    scenario: Scenario,
    seed: int = 42,
    seed_orders: list[list[int]] | None = None,
    population_size: int = 42,
    generations: int = 80,
    mutation_rate: float = 0.32,
    local_search_rate: float = 0.14,
    algorithm_name: str = "MemeticGA",
) -> tuple[Solution, list[dict[str, Any]], list[int]]:
    rng = random.Random(seed)
    start = time.perf_counter()
    population = initial_population(scenario, population_size, rng)
    high_quality_orders = list(seed_orders or []) + path_scanning_candidate_orders(scenario, seed)
    for idx, order in enumerate(high_quality_orders):
        if idx >= population_size:
            break
        population[idx] = repair_order(order, scenario)

    elite_count = max(2, population_size // 12)
    best_order = population[0]
    best_score = math.inf
    convergence: list[dict[str, Any]] = []

    for generation in range(generations):
        scores = [evaluate_order(order, scenario) for order in population]
        ranked = sorted(range(len(population)), key=lambda idx: scores[idx])
        if scores[ranked[0]] < best_score:
            best_score = float(scores[ranked[0]])
            best_order = list(population[ranked[0]])

        best_solution = make_solution(algorithm_name, best_order, scenario)
        convergence.append(
            {
                "algorithm": algorithm_name,
                "iteration": generation,
                "objective": best_solution.objective,
                "total_distance": best_solution.total_distance,
            }
        )

        next_population = [list(population[idx]) for idx in ranked[:elite_count]]
        for elite_idx in range(min(2, len(next_population))):
            next_population[elite_idx] = local_search_order(next_population[elite_idx], scenario, rng, max_checks=16)

        while len(next_population) < population_size:
            parent_a = tournament_select(population, scores, rng)
            parent_b = tournament_select(population, scores, rng)
            child = order_crossover(parent_a, parent_b, rng) if rng.random() < 0.88 else list(parent_a)
            child = mutate_order(child, rng, mutation_rate)
            if rng.random() < local_search_rate:
                child = local_search_order(child, scenario, rng, max_checks=12)
            next_population.append(repair_order(child, scenario))
        population = next_population

    final_scores = [evaluate_order(order, scenario) for order in population]
    final_best_idx = int(np.argmin(final_scores))
    if final_scores[final_best_idx] < best_score:
        best_order = list(population[final_best_idx])

    runtime = time.perf_counter() - start
    solution = make_solution(algorithm_name, best_order, scenario, runtime)
    return solution, convergence, best_order
```

逻辑说明：

- 初始种群包含普通 GA 的初始个体。
- 再把 `PathScanning`、GA、VNS 等高质量种子放入种群前部。
- 每代先保留精英。
- 对前两个精英执行轻量 `local_search_order(max_checks=16)`。
- 对部分子代按 `local_search_rate` 执行轻量局部搜索。
- 最终再检查最后一代种群，防止最后一代生成了更优个体但还没更新 `best_order`。

TypeScript 迁移注意点：

- MemeticGA 依赖 GA 和 VNS 的公共工具函数，应放在同一个算法核心模块或共享工具模块中。
- `localSearchRate` 不宜过大，否则浏览器端交互会变慢。
- 建议前端提供“高质量模式”时显示进度或允许取消。

## 9. 推荐的 TypeScript 模块拆分

建议按下面结构重写：

```text
src/algorithms/
  types.ts              # Point, Strip, Route, Scenario, Solution
  random.ts             # seedable RNG, sample, shuffle
  geometry.ts           # distance, obstacle/interval utilities
  scenario.ts           # createScenario, createBenchmarkScenario
  decoder.ts            # repairOrder, bestRouteGeometry, decodeOrder, makeSolution
  constructors.ts       # scanlineOrder, nearestNeighborOrder, greedyOrder
  pathScanning.ts       # solvePathScanning
  ga.ts                 # solveGA, orderCrossover, mutateOrder
  vns.ts                # solveVNS, localSearchOrder
  memeticGA.ts          # solveMemeticGA
  runner.ts             # runRecommendedAlgorithms
```

推荐的统一返回类型：

```ts
export interface AlgorithmResult {
  solution: Solution;
  convergence: ConvergencePoint[];
  bestOrder: number[];
}

export interface ConvergencePoint {
  algorithm: string;
  iteration: number;
  objective: number;
  totalDistance: number;
}
```

推荐的算法入口：

```ts
export function runRecommendedAlgorithms(scenario: Scenario): AlgorithmResult[] {
  const path = solvePathScanning(scenario, { seed: scenario.seed + 11 });
  const ga = solveGA(scenario, { seed: scenario.seed + 1 });

  const vnsSeed = minBy(
    [path.bestOrder, ga.bestOrder],
    (order) => evaluateOrder(order, scenario),
  );
  const vns = solveVNS(scenario, {
    initialOrder: vnsSeed,
    seed: scenario.seed + 5,
  });

  const memetic = solveMemeticGA(scenario, {
    seed: scenario.seed + 6,
    seedOrders: [ga.bestOrder, path.bestOrder, vns.bestOrder],
  });

  return [path, ga, vns, memetic];
}
```

## 10. 正确性检查清单

TypeScript 版本完成后，至少要实现这些断言：

```text
1. 每个算法的 coverage 必须等于 1.0。
2. 每个算法的 violations 必须等于 0。
3. 每条航带在每个 Solution 中恰好出现一次。
4. 每条 Route 满足 demand <= capacity。
5. 每条 Route 满足 distance <= maxRouteDistance。
6. 同一 seed 下输出应稳定。
7. PathScanning、GA、VNS、MemeticGA 的 objective 计算公式与 Python 一致。
```

Python 对应检查函数：

```python
def validate_solution(solution: Solution, scenario: Scenario) -> None:
    served = [strip_id for route in solution.routes for strip_id in route.strip_ids]
    expected = all_strip_ids(scenario)
    if sorted(served) != sorted(expected):
        raise AssertionError(f"{solution.algorithm}: strips are not served exactly once")
    if abs(solution.coverage - 1.0) > 1e-9:
        raise AssertionError(f"{solution.algorithm}: coverage is {solution.coverage}")
    if solution.violations != 0:
        raise AssertionError(f"{solution.algorithm}: violations={solution.violations}")
    for idx, route in enumerate(solution.routes, start=1):
        if route.demand > scenario.capacity + 1e-9:
            raise AssertionError(f"{solution.algorithm} route {idx}: demand exceeds capacity")
        if route.distance > scenario.max_route_distance + 1e-9:
            raise AssertionError(f"{solution.algorithm} route {idx}: distance exceeds budget")
```

## 11. 迁移优先级

建议按以下顺序实现 TypeScript：

1. `types.ts`、`geometry.ts`、`random.ts`
2. `scenario.ts`
3. `decoder.ts`
4. `pathScanning.ts`
5. `ga.ts`
6. `vns.ts`
7. `memeticGA.ts`
8. `runner.ts`
9. 单元测试和 Python 结果对齐测试

其中 `decoder.ts` 是质量核心。只要 `decodeOrder()`、`bestRouteGeometry()` 和 `objectiveValue()` 与 Python 一致，后续算法即使有轻微随机差异，也能保证约束和评价指标一致。
