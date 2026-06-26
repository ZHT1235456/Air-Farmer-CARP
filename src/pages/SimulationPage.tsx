import ModulePlaceholder from "../components/layout/ModulePlaceholder";

export default function SimulationPage() {
  return (
    <ModulePlaceholder
      eyebrow="Seeding Simulation"
      title="播种模拟"
      goal="用 Three.js 展示无人机按规划航线执行播种：飞行、播种、返航补给与资源状态变化。"
      points={[
        "三维场景：农田、航带、补给点、障碍物、无人机模型、已/未播种区域、航线路径",
        "动画流程：起飞 → 飞向航带 → 播种变色 → 返航 → 补给 → 下一趟 → 完成面板",
        "仪表盘：电池、种箱、当前路线/航带、已飞距离、覆盖率、返航次数、任务状态",
        "地面站式图标控制台：主播放键、加减速、重置、旋转/平移交互模式切换",
      ]}
    />
  );
}
