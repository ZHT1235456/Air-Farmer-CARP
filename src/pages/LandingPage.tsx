import { useNavigate } from "react-router-dom";
import HeroSection from "../components/landing/HeroSection";
import FeatureSection from "../components/landing/FeatureSection";
import ModelingFlowSection from "../components/landing/ModelingFlowSection";
import FormulaSection from "../components/landing/FormulaSection";
import CapabilitySection from "../components/landing/CapabilitySection";
import "../components/landing/landing.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <HeroSection />
      <FeatureSection />
      <ModelingFlowSection />
      <FormulaSection />
      <CapabilitySection />

      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <h2 className="landing-footer__title">准备好规划你的播种航线了吗？</h2>
          <p className="landing-footer__sub">
            进入系统，从选择农田场景开始，体验从 CARP 建模到三维播种仿真的完整流程。
          </p>
          <button className="btn-primary" onClick={() => navigate("/scene")}>
            进入系统 <span className="arrow">→</span>
          </button>
          <p className="landing-footer__meta mono">
            空中农夫 · 基于 CARP 的无人机播种航线规划仿真系统 · NP 复杂性与近似算法课程作业
          </p>
        </div>
      </footer>
    </div>
  );
}
