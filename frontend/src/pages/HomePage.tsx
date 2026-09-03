import { useEffect, useState } from "react";

import HeroSection from "../components/home/HeroSection";
import FeaturedExperiments from "../components/home/FeaturedExperiments";
import LearningWorkflow from "../components/home/LearningWorkflow";
import AIMentorPreview from "../components/home/AIMentorPreview";
import SimulationPreview from "../components/home/SimulationPreview";
import WhyEngineerOS from "../components/home/WhyEngineerOS";
import HowItWorks from "../components/home/HowItWorks";
import FinalCTA from "../components/home/FinalCTA";
import HomeFooter from "../components/home/HomeFooter";

import { getExperiments } from "../services/experimentService";
import type { Experiment } from "../types/experiment";

function HomePage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getExperiments();
        if (cancelled) return;
        setExperiments(response.items);
      } catch {
        // Backend unavailable — an empty featured section is honest; no
        // bundled fallback data.
        if (!cancelled) setExperiments([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="home-page">
      <HeroSection />
      <WhyEngineerOS />
      <LearningWorkflow />
      <FeaturedExperiments experiments={experiments} isLoading={isLoading} />
      <SimulationPreview />
      <AIMentorPreview />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <FinalCTA />
      <HomeFooter />
    </div>
  );
}

export default HomePage;
