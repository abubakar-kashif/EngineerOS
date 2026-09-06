import { useEffect, useState } from "react";

import HeroSection from "../components/home/HeroSection";
import HowItWorks from "../components/home/HowItWorks";
import FeaturedExperiments from "../components/home/FeaturedExperiments";
import SimulationPreview from "../components/home/SimulationPreview";
import AIMentorPreview from "../components/home/AIMentorPreview";
import StatsProof from "../components/home/StatsProof";
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
        if (!cancelled) setExperiments([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-page home-page--landing">
      <HeroSection />
      <HowItWorks />
      <FeaturedExperiments experiments={experiments} isLoading={isLoading} />
      <SimulationPreview />
      <AIMentorPreview />
      <StatsProof />
      <FinalCTA />
      <HomeFooter />
    </div>
  );
}

export default HomePage;
