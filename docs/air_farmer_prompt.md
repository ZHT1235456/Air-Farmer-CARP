# 《空中农夫》软件开发提示词

## 角色设定

你是一名资深 TypeScript、Three.js、React、Tauri 2 桌面应用开发工程师，同时熟悉组合优化、NP-hard 问题、CARP、近似算法、启发式算法和算法可视化。

请开发一个名为 **《空中农夫》** 的课程期末作业软件。本软件用于“NP复杂性与近似算法”课程展示，主题是：

> 基于带容量约束弧路径问题 CARP 的无人机播种航线规划仿真系统。

本项目不是普通静态展示网页，而是一个可交互、可仿真、可解释的课程展示型软件。系统需要体现从现实无人机播种任务到 CARP 建模，再到 NP-hard 问题求解与近似算法可视化的完整逻辑链条。

---

## 一、技术栈要求

- 使用 **TypeScript** 开发。
- 使用 **Vite + React + TypeScript** 作为前端工程基础。
- 使用 **Three.js** 完成农田、航带、障碍物、无人机、航线和播种过程的可视化。
- 后期需要能够使用 **Tauri 2** 打包为桌面应用，因此项目结构应避免强依赖浏览器端不可控服务。
- 首页需要使用 **KaTeX** 渲染数学公式。
- UI 风格建议采用现代化科技风，同时保留农业主题元素。
- 不要只做静态页面，至少需要实现：
  - 场景切换
  - 航带展示
  - 算法选择
  - 航线生成
  - 指标展示
  - 播种动画
  - 图标化控制按钮
  - 操作说明

建议依赖：

```bash
npm install three @react-three/fiber @react-three/drei katex react-katex
npm install -D vite typescript
```

若不使用 `@react-three/fiber`，也可以直接封装原生 Three.js 场景管理类，但需要保持模块清晰。

KaTeX 样式必须正确引入：

```ts
import "katex/dist/katex.min.css";
```

---

## 二、项目背景

本软件模拟无人机在农田中执行播种任务。农田会被预先划分为多条播种航带，无人机需要沿航带完成播种。由于无人机存在种箱容量、电池续航、返航补给、地块边界、障碍物绕行等约束，航线规划不能简单视为几何画线问题，而应抽象为 **带容量约束弧路径问题**：

\[
\text{Capacitated Arc Routing Problem, CARP}
\]

在 CARP 建模中：

| 无人机播种场景 | CARP 模型对象 |
|---|---|
| 起降点、补给点 | depot 节点 |
| 播种航带 | required edge，必服务边 |
| 航带长度 | 服务成本 |
| 航带所需种子量 | 边需求量 |
| 无人机种箱容量 | 路径容量约束 |
| 无人机电池续航 | 单趟航程或能耗约束 |
| 航带之间的空飞转移 | deadheading cost |
| 障碍物切断航带 | 将原航带拆分为多条必服务子航带 |
| 多次返航补给 | 多条从 depot 出发并返回 depot 的路线 |

由于 CARP 是 NP-hard 问题，本系统不追求精确最优解，而展示多种近似算法、启发式算法和元启发式算法在无人机播种场景中的求解效果。

系统需要支持以下算法模式：

- **快速模式**：Path Scanning
- **标准模式**：Genetic Algorithm，遗传算法
- **高质量模式**：MemeticGA
- **局部改进模式**：VNS，Variable Neighborhood Search，变邻域搜索
- **对比模式**：同时运行多个算法并展示指标对比

---

## 三、总体页面结构

软件包含以下页面：

1. 首页 Landing Page
2. 场景预览
3. 航线规划
4. 播种模拟
5. 操作说明

首页是独立导引页，不显示后续页面的顶部导航栏。

除首页外，其余页面共享顶部栏。

---

## 四、首页 Landing Page

### 4.1 首页定位

首页用于介绍项目背景，并用 KaTeX 公式展示无人机播种任务到 CARP 模型的抽象过程。

首页应说明：

- 智慧农业和低空无人机技术的发展背景。
- 无人机播种在农业自动化中的实际意义。
- 真实播种任务需要考虑地块边界、障碍物、种箱容量、电池续航和返航补给。
- 为什么该问题更适合抽象为 CARP，而不是简单的 TSP。
- CARP 是 NP-hard 问题，因此需要近似算法、启发式算法和元启发式算法。
- 本系统如何通过三维仿真展示航线规划和播种过程。

首页需要采用落地页风格，不要设计成普通说明文档页面。

页面底部必须放置主按钮：

> 进入系统

点击后进入后续功能页面。

---

### 4.2 首页视觉结构

首页建议包含以下区块：

1. Hero 区域
   - 项目标题：《空中农夫》
   - 副标题：基于 CARP 的无人机播种航线规划仿真系统
   - 简短介绍：现实农业播种任务中的航线优化、容量约束和仿真展示
   - 主按钮：“进入系统”

2. 项目背景区
   - 智慧农业
   - 无人机播种
   - 低空作业
   - 农田障碍物
   - 返航补给

3. 建模逻辑区
   - 现实问题
   - 航带划分
   - 图模型抽象
   - CARP 建模
   - NP-hard
   - 近似算法

4. KaTeX 公式区
   - CARP 目标函数
   - 必服务边约束
   - 种箱容量约束
   - 电池航程约束
   - 相对成本或近似比指标

5. 系统能力展示区
   - 农田场景预览
   - 航带生成
   - 航线规划
   - 播种仿真
   - 算法指标对比

6. 底部进入按钮
   - “进入系统”

---

### 4.3 KaTeX 公式区

首页必须使用 KaTeX 展示数学公式。建议实现一个 `FormulaSection` 组件，集中展示公式。

若使用 React，优先使用 `react-katex`：

```tsx
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
```

公式卡片结构建议：

```ts
interface FormulaItem {
  id: string;
  title: string;
  latex: string;
  explanation: string;
  mapping: string;
}
```

公式区要求：

- 采用卡片式布局。
- 每个公式卡片包含：
  - 公式标题
  - KaTeX 渲染的数学公式
  - 中文解释
  - 与无人机播种场景的对应关系
- 宽屏下采用两列网格。
- 窄屏下采用单列布局。
- 公式渲染失败时显示纯文本 fallback。
- 不要把公式堆叠成论文排版，应融入落地页视觉设计。
- 公式应服务于“现实问题 → CARP 建模 → NP-hard → 近似算法”的叙事逻辑。

建议包含以下公式。

#### 公式 1：CARP 目标函数

```latex
\min \sum_{r \in R} C(r)
```

解释：

系统希望在完成所有播种航带服务的前提下，使无人机总飞行成本最小。其中 \(R\) 表示无人机的多趟播种路线集合，\(C(r)\) 表示第 \(r\) 趟路线的飞行成本，包括服务航带成本和空飞转移成本。

#### 公式 2：必服务边约束

```latex
\forall e \in E_R,\quad e \text{ must be served exactly once}
```

解释：

每一条播种航带都对应 CARP 中的必服务边 \(E_R\)，系统需要保证所有航带都被覆盖。

#### 公式 3：种箱容量约束

```latex
\sum_{e \in r} q_e \le Q,\quad \forall r \in R
```

解释：

每趟飞行路线中所有航带的种子需求量之和不能超过无人机种箱容量 \(Q\)。其中 \(q_e\) 表示航带 \(e\) 的播种需求量。

#### 公式 4：电池航程约束

```latex
D(r) \le B,\quad \forall r \in R
```

解释：

每趟路线的飞行距离 \(D(r)\) 不能超过无人机的电池航程预算 \(B\)。如果超过该限制，无人机必须返回补给点重新补种或换电。

#### 公式 5：算法相对成本指标

```latex
\rho = \frac{C_{\text{alg}}}{C_{\text{best}}}
```

解释：

系统使用相对成本指标评价不同算法的求解质量。其中 \(C_{\text{alg}}\) 表示当前算法得到的路线成本，\(C_{\text{best}}\) 表示当前场景下已知的最好结果或对比基准。

---

## 五、公共顶部栏

除首页外，其余页面共享一个顶部栏。

顶部栏内容：

- 左侧：软件名称“空中农夫”
- 中间：导航菜单
  - 场景预览
  - 航线规划
  - 播种模拟
  - 操作说明
- 右侧：当前场景名称、当前算法模式或系统状态

顶部栏要求：

- 当前页面需要高亮。
- 导航切换不能破坏已经生成的场景和算法结果。
- 顶部栏应保持紧凑，避免遮挡 Three.js 画面。
- 在桌面端窗口较小时应保持可用。

---

## 六、场景预览模块

### 6.1 模块目标

场景预览模块显示农田的俯视图，用于查看内置农田场景、播种航带、障碍物和补给点。

该页面强调“农田结构”和“航带划分”，不需要播放无人机动画。

---

### 6.2 内置场景

系统需要内置多个农田场景：

1. 正方形农田
2. 矩形农田
3. 梯形农田
4. 不规则多边形农田
5. 多片农田组合
6. 含障碍物农田
7. 含线状障碍物或杆状障碍物的农田

场景中应包含：

- 农田边界
- 起降点 / 补给点
- 播种航带
- 障碍物或禁飞区
- 航带编号
- 场景统计信息

---

### 6.3 航带生成规则

航带生成需要满足：

- 规则农田可以生成平行航带。
- 梯形或不规则农田应根据边界裁剪航带。
- 多片农田组合中，不同农田的航带方向可以不同。
- 多片农田之间的航带不必平行，可以相互垂直。
- 障碍物会切断航带，被切断后的子航带仍然是必服务航带。
- 航带端点应可用于后续构建图模型和距离矩阵。

---

### 6.4 场景预览视觉要求

- 使用俯视相机。
- 农田用半透明地面区域表示。
- 航带用细长线段或窄矩形表示。
- 障碍物用红色或警示色区域表示。
- 起降点用明显图标或立体标记表示。
- 当前选中的航带需要高亮。
- 航带编号应清晰但不能过度干扰画面。
- 多片农田应能体现不同航带方向。

---

### 6.5 场景预览交互要求

用户可以：

- 切换不同内置场景。
- 查看农田面积。
- 查看航带数量。
- 查看障碍物数量。
- 查看预计播种面积。
- 点击航带查看该航带信息：
  - 航带编号
  - 所属农田
  - 长度
  - 需求种子量
  - 起点坐标
  - 终点坐标
  - 是否被障碍物切分

---

## 七、航线规划模块

### 7.1 模块目标

航线规划模块用于选择算法并生成无人机播种航线。

该页面需要明确展示“输入参数 → 算法求解 → 结果评价”的过程。

---

### 7.2 用户可配置参数

用户可以选择当前农田场景，并配置无人机参数：

- 飞行速度
- 种箱容量
- 最大航程或电池预算
- 播种幅宽
- 单位长度种子消耗量

用户可以选择算法模式：

- 快速模式：Path Scanning
- 标准模式：Genetic Algorithm
- 高质量模式：MemeticGA
- 局部改进：VNS
- 对比模式：同时运行多个算法并展示指标对比

---

### 7.3 算法输入

算法模块统一接收以下输入：

```ts
interface PlanInput {
  scenario: Scenario;
  strips: Strip[];
  depot: Point2D;
  droneParams: DroneParams;
  distanceMatrix: number[][];
  algorithmOptions: AlgorithmOptions;
}
```

其中：

- `strips`：航带集合
- `depot`：补给点
- `droneParams.seedCapacity`：种箱容量
- `droneParams.batteryDistance`：最大航程
- `distanceMatrix`：航带端点和补给点之间的转移距离矩阵
- `algorithmOptions`：算法参数

---

### 7.4 算法输出

算法模块统一输出：

```ts
interface PlanResult {
  algorithm: AlgorithmMode;
  routes: Route[];
  totalDistance: number;
  returnCount: number;
  coverageRate: number;
  runtimeMs: number;
  feasible: boolean;
  violations: ConstraintViolation[];
  routeSegments: RouteSegment[];
}
```

输出含义：

- `routes`：多趟路线，每趟路线从 depot 出发并返回 depot。
- `totalDistance`：总飞行距离。
- `returnCount`：返航次数。
- `coverageRate`：覆盖率。
- `runtimeMs`：算法运行时间。
- `feasible`：是否满足容量和航程约束。
- `violations`：约束违反信息。
- `routeSegments`：用于 Three.js 渲染的路线线段。

---

### 7.5 算法模式说明

#### Path Scanning

Path Scanning 用于快速构造可行解。

要求：

- 逐步选择下一条可服务航带。
- 考虑当前剩余种箱容量和剩余航程。
- 当无法继续服务时返回 depot。
- 保证每条航带尽量被服务一次。
- 若单条航带自身需求或长度超过约束，应输出不可行原因。

#### Genetic Algorithm

遗传算法用于标准优化。

要求：

- 染色体表示为航带访问顺序。
- 使用路线分割器根据容量和航程约束插入返航。
- 实现初始化、适应度计算、选择、交叉、变异和修复。
- 适应度应综合考虑总航程、返航次数和约束违反惩罚。
- 不允许只用随机路线假装算法结果。

#### MemeticGA

MemeticGA 用于高质量求解。

要求：

- 以 GA 为基础。
- 对优秀个体执行局部搜索。
- 局部搜索可以使用 swap、insertion、inversion 等邻域操作。
- 需要展示其相对 GA 的改进效果。

#### VNS

VNS 用于局部改进已有解。

要求：

- 支持至少三种邻域：
  - swap
  - insertion
  - inversion
- 可以额外支持：
  - relocate
  - exchange
- 每次找到更优解后更新当前路线。
- 显示改进前后的总航程变化。

---

### 7.6 航线规划结果展示

结果展示要求：

- 在农田图上绘制规划航线。
- 不同趟路线使用不同视觉样式。
- 显示无人机每次返航补给的位置和顺序。
- 显示总航程、返航次数、覆盖率、运行时间、约束违反次数。
- 支持算法结果切换。
- 支持一键进入播种模拟。
- 对比模式下需要展示算法指标对比表。

指标建议：

| 指标 | 含义 |
|---|---|
| totalDistance | 总飞行距离 |
| returnCount | 返航次数 |
| coverageRate | 播种覆盖率 |
| runtimeMs | 算法运行时间 |
| feasible | 是否可行 |
| violationCount | 约束违反数量 |
| compositeCost | 综合成本 |

---

## 八、播种模拟模块

### 8.1 模块目标

播种模拟模块是系统最具展示性的页面，用 Three.js 展示无人机按照规划航线执行播种任务。

该页面需要体现：

- 无人机飞行过程
- 航带播种过程
- 已播种区域变化
- 返航补给行为
- 电池和种箱状态变化
- 任务进度变化

---

### 8.2 三维场景元素

播种模拟页面应包含：

- 农田地块
- 播种航带
- 起降点 / 补给点
- 障碍物
- 无人机模型
- 已播种区域
- 未播种区域
- 航线路径
- 返航路径
- 当前正在服务的航带高亮
- 已完成航带标记

无人机模型可以是简化模型，不要求高度精细，但应能明显识别为无人机。

---

### 8.3 动画流程

动画需要按照以下流程执行：

1. 无人机从 depot 起飞。
2. 无人机沿规划路线飞向第一条航带。
3. 进入航带后开始播种。
4. 被播种的航带逐渐变色，或出现播种粒子效果。
5. 当前趟路线完成后返回 depot。
6. 返航后更新种箱和电池状态。
7. 系统进入短暂补给状态。
8. 继续执行下一趟路线。
9. 所有航带完成后显示任务完成面板。

任务状态包括：

```ts
type SimulationStatus =
  | "idle"
  | "running"
  | "paused"
  | "seeding"
  | "returning"
  | "refilling"
  | "completed";
```

---

### 8.4 仪表盘要求

播种模拟页需要有丰富的仪表盘，但不能遮挡主画面。

仪表盘至少显示：

- 当前算法
- 当前路线编号
- 当前航带编号
- 飞行速度
- 当前电池百分比
- 当前种箱余量
- 已飞行距离
- 已播种面积
- 覆盖率
- 返航次数
- 预计剩余时间
- 任务状态

任务状态中文显示建议：

| 状态 | 中文显示 |
|---|---|
| idle | 待开始 |
| running | 飞行中 |
| paused | 已暂停 |
| seeding | 播种中 |
| returning | 返航中 |
| refilling | 补给中 |
| completed | 已完成 |

---

### 8.5 控制按钮设计

播种模拟模块的控制按钮应采用图标化设计，不以大段文字按钮为主。

所有图标按钮需要提供：

- tooltip
- aria-label
- hover 状态
- disabled 状态
- active 状态

控制区应设计成类似视频播放器或无人机地面站的控制台，而不是普通表单按钮组。

---

### 8.6 主播放控制按钮

将“开始 / 暂停 / 继续”合并为一个主按钮，根据 `simulationState` 自动切换图标和行为。

状态包括：

```ts
type SimulationPlaybackState = "idle" | "running" | "paused" | "completed";
```

主按钮行为：

| 当前状态 | 显示图标 | 点击行为 |
|---|---:|---|
| idle | ▶ | 开始模拟 |
| running | ⏸ | 暂停模拟 |
| paused | ▶ | 继续模拟 |
| completed | ↻ | 重置并重新开始 |

推荐实现：

```ts
function getPrimaryControlIcon(state: SimulationPlaybackState) {
  if (state === "running") return "⏸";
  if (state === "completed") return "↻";
  return "▶";
}

function getPrimaryControlLabel(state: SimulationPlaybackState) {
  if (state === "idle") return "开始模拟";
  if (state === "running") return "暂停模拟";
  if (state === "paused") return "继续模拟";
  if (state === "completed") return "重新开始";
}
```

注意：

- 不要把“开始”“暂停”“继续”做成三个独立按钮。
- 主按钮应比辅助按钮更醒目。
- 主按钮可以放在控制台左侧或居中位置。

---

### 8.7 辅助控制按钮

辅助按钮包括：

| 控件 | 图标 | 说明 |
|---|---:|---|
| 主控制 | ▶ / ⏸ / ↻ | 开始、暂停、继续、重新开始 |
| 减速 | ⏪ | 降低模拟速度 |
| 加速 | ⏩ | 提高模拟速度 |
| 重置 | ↻ | 回到任务初始状态 |
| 平移模式 | ✥ / ✋ | 切换拖拽行为：旋转或平移 |
| 返回规划 | ← | 回到航线规划页 |

不需要“切换视角”按钮。由于系统中只有一架无人机，固定三维观察视角配合轨道控制已经足够表达任务过程。

---

### 8.8 相机交互：旋转 / 平移

播种模拟页不需要多视角切换，而应提供相机交互模式切换。

默认状态为 **旋转模式**：

- 用户拖拽画面时，相机围绕农田场景旋转。
- 鼠标滚轮用于缩放。
- 该模式适合观察无人机、航线、障碍物和播种状态。

用户启用 **平移模式** 后：

- 控制区中的平移按钮进入激活状态。
- 用户拖拽画面时不再旋转相机，而是平移观察区域。
- 再次点击平移按钮后退出平移模式，恢复旋转模式。
- 平移模式只影响鼠标拖拽行为，不影响无人机动画播放。
- 缩放行为始终由鼠标滚轮控制。

状态结构建议：

```ts
interface SimulationControlState {
  simulationState: "idle" | "running" | "paused" | "completed";
  speedMultiplier: number;
  interactionMode: "rotate" | "pan";
}
```

平移按钮 tooltip 根据状态变化：

| interactionMode | tooltip |
|---|---|
| rotate | 启用平移 |
| pan | 恢复旋转 |

如果使用 OrbitControls，可以这样切换：

```ts
if (interactionMode === "rotate") {
  controls.enableRotate = true;
  controls.enablePan = false;
}

if (interactionMode === "pan") {
  controls.enableRotate = false;
  controls.enablePan = true;
}
```

---

## 九、操作说明模块

操作说明模块介绍软件使用方式和算法含义。

内容包括：

### 9.1 软件使用流程

1. 进入系统
2. 选择农田场景
3. 查看航带划分
4. 配置无人机参数
5. 选择算法
6. 生成航线
7. 查看指标
8. 进入播种模拟
9. 播放、暂停或重置模拟
10. 查看任务完成结果

### 9.2 页面说明

需要说明以下页面：

- 首页
- 场景预览
- 航线规划
- 播种模拟
- 操作说明

### 9.3 算法说明

需要解释：

- CARP 建模思想
- Path Scanning
- Genetic Algorithm
- MemeticGA
- VNS

### 9.4 指标说明

需要解释：

- 总航程
- 返航次数
- 覆盖率
- 运行时间
- 约束违反次数
- 综合成本

---

## 十、TypeScript 数据结构建议

请至少设计以下接口。

```ts
export interface Point2D {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  type: "point" | "line" | "polygon";
  position?: Point2D;
  points?: Point2D[];
  radius?: number;
  buffer?: number;
  label: string;
}

export interface Strip {
  id: string;
  fieldId: string;
  start: Point2D;
  end: Point2D;
  length: number;
  demand: number;
  cost: number;
  coveredArea: number;
  direction: number;
  blockedByObstacle: boolean;
}

export interface Field {
  id: string;
  name: string;
  polygon: Point2D[];
  stripDirection: number;
  strips: Strip[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  fields: Field[];
  obstacles: Obstacle[];
  depot: Point2D;
  defaultDroneParams: DroneParams;
}

export interface DroneParams {
  speed: number;
  seedCapacity: number;
  batteryDistance: number;
  seedRate: number;
  seedWidth: number;
}

export interface Route {
  id: string;
  strips: Strip[];
  pathPoints: Point2D[];
  distance: number;
  demand: number;
  feasible: boolean;
}

export interface ConstraintViolation {
  type: "capacity" | "battery" | "coverage" | "obstacle";
  message: string;
  routeId?: string;
  stripId?: string;
}

export interface RouteSegment {
  id: string;
  routeId: string;
  from: Point2D;
  to: Point2D;
  type: "service" | "transfer" | "return";
  stripId?: string;
}

export interface PlanResult {
  algorithm: AlgorithmMode;
  routes: Route[];
  totalDistance: number;
  returnCount: number;
  coverageRate: number;
  runtimeMs: number;
  feasible: boolean;
  violations: ConstraintViolation[];
  routeSegments: RouteSegment[];
}

export type AlgorithmMode =
  | "pathScanning"
  | "genetic"
  | "memetic"
  | "vns"
  | "compare";
```

---

## 十一、项目目录结构建议

建议使用以下目录结构：

```txt
src/
  app/
    App.tsx
    routes.tsx
  pages/
    LandingPage.tsx
    ScenePreviewPage.tsx
    RoutePlanningPage.tsx
    SimulationPage.tsx
    GuidePage.tsx
  components/
    layout/
      TopBar.tsx
    landing/
      HeroSection.tsx
      FormulaSection.tsx
      FeatureSection.tsx
    simulation/
      SimulationDashboard.tsx
      SimulationControls.tsx
      StatusPanel.tsx
    planning/
      AlgorithmSelector.tsx
      DroneParamPanel.tsx
      PlanResultPanel.tsx
      AlgorithmCompareTable.tsx
  three/
    SceneCanvas.tsx
    FieldRenderer.tsx
    StripRenderer.tsx
    ObstacleRenderer.tsx
    DroneRenderer.tsx
    RouteRenderer.tsx
    SeedingEffect.tsx
    controls.ts
  scenarios/
    builtInScenarios.ts
    scenarioFactory.ts
  geometry/
    distance.ts
    polygon.ts
    stripGenerator.ts
    obstacleSplitter.ts
    matrix.ts
  algorithms/
    types.ts
    pathScanning.ts
    genetic.ts
    memetic.ts
    vns.ts
    routeSplitter.ts
    evaluator.ts
  simulation/
    simulationEngine.ts
    simulationState.ts
    interpolation.ts
  types/
    domain.ts
  utils/
    format.ts
    random.ts
    math.ts
  styles/
    global.css
```

---

## 十二、几何计算要求

几何计算应独立封装，不要散落在 React 组件中。

至少实现：

- 点距离
- 线段长度
- 多边形边界
- 航带生成
- 航带裁剪
- 障碍物切分
- 距离矩阵计算
- 点到线段距离
- 判断航带是否与障碍物缓冲区相交

航带生成和障碍物切分可以采用教学型简化实现，但输出数据必须能被算法和 Three.js 复用。

---

## 十三、开发实现要求

1. 代码必须模块化。
2. 页面组件、算法逻辑、几何计算和 Three.js 渲染需要分离。
3. 算法实现可以是教学型简化版本，但必须能输出可运行结果。
4. Path Scanning 必须能生成可行路线。
5. GA 至少实现初始化、适应度、选择、交叉、变异、修复。
6. MemeticGA 可以实现为 GA + 轻量 VNS。
7. VNS 至少实现 swap、insertion、inversion 三种邻域。
8. 不允许只用随机路线假装算法结果。
9. 若算法结果不可行，应展示原因。
10. 所有页面都应有合理的空状态、加载状态和错误状态。
11. 软件需要适合课程答辩展示，因此界面应清楚表达“现实问题 — CARP 建模 — NP-hard — 近似算法 — 三维仿真”的逻辑链条。

---

## 十四、不可行情况处理

系统需要识别并展示以下不可行情况：

- 单条航带需求超过种箱容量。
- 单条航带服务长度超过电池预算。
- 某些航带被障碍物完全阻断，无法服务。
- 算法结果未覆盖全部航带。
- 路线分割后仍存在超容量路线。
- 路线分割后仍存在超航程路线。

展示格式建议：

```ts
{
  type: "capacity",
  message: "航带 S-12 的种子需求量超过无人机种箱容量",
  stripId: "S-12"
}
```

---

## 十五、验收标准

完成后软件应满足：

1. 能从首页进入系统。
2. 首页包含 KaTeX 公式展示区。
3. 首页能解释无人机播种与 CARP、NP-hard、近似算法之间的关系。
4. 能切换多个内置农田场景。
5. 能看到农田、障碍物、补给点和播种航带。
6. 能点击航带查看基本信息。
7. 能选择算法并生成航线。
8. 能展示总航程、返航次数、覆盖率、运行时间等指标。
9. 能在三维场景中播放无人机播种动画。
10. 播种模拟页有仪表盘。
11. 播种模拟页的开始、暂停、继续由一个图标按钮统一控制。
12. 播种模拟页支持加速、减速、重置、返回规划。
13. 播种模拟页不需要切换视角按钮。
14. 播种模拟页支持旋转 / 平移交互模式切换。
15. 能显示电池、种箱、当前路线、当前航带和任务进度。
16. 能显示任务完成状态。
17. 算法不可行时能展示原因。
18. 代码结构清晰，便于后续使用 Tauri 2 打包为桌面应用。

---

## 十六、开发优先级建议

建议按以下顺序开发：

1. 初始化 Vite + React + TypeScript 项目。
2. 搭建页面路由和公共布局。
3. 完成首页 Landing Page 和 KaTeX 公式区。
4. 定义 TypeScript 领域模型。
5. 实现内置农田场景。
6. 实现航带生成和障碍物切分。
7. 实现场景预览页。
8. 实现 Path Scanning。
9. 实现航线规划页和结果展示。
10. 实现播种模拟引擎。
11. 实现 Three.js 播种动画。
12. 实现图标化控制台。
13. 实现 GA、MemeticGA、VNS。
14. 实现算法对比。
15. 完成操作说明页。
16. 优化 UI、动画和答辩展示效果。

---

## 十七、最终目标

最终软件应像一个面向课程答辩的桌面仿真系统，而不是普通网页 demo。

它需要同时具备：

- 现实农业应用背景
- 数学建模表达
- NP-hard 问题说明
- 近似算法与启发式算法展示
- Three.js 三维仿真
- 可交互控制台
- 可解释指标面板
- 清晰的软件工程结构

请按照上述要求生成代码，并保证每个模块可以逐步运行和调试。
