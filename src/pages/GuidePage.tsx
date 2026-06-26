import ModulePlaceholder from "../components/layout/ModulePlaceholder";

export default function GuidePage() {
  return (
    <ModulePlaceholder
      eyebrow="User Guide"
      title="操作说明"
      goal="介绍软件使用流程、各页面功能、算法含义与评价指标，帮助答辩展示理解整体逻辑链条。"
      points={[
        "软件使用流程：进入系统 → 选场景 → 看航带 → 配参数 → 选算法 → 生成航线 → 仿真",
        "页面说明：首页 / 场景预览 / 航线规划 / 播种模拟 / 操作说明",
        "算法说明：CARP 建模思想、Path Scanning、GA、MemeticGA、VNS",
        "指标说明：总航程、返航次数、覆盖率、运行时间、约束违反次数、综合成本",
      ]}
    />
  );
}
