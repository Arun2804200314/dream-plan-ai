import { useRef } from "react";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import GeneratorSection from "@/components/sections/GeneratorSection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  const generatorRef = useRef<HTMLDivElement>(null);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection onGetStarted={scrollToGenerator} />
        <FeaturesSection />
        <HowItWorksSection />
        <GeneratorSection scrollRef={generatorRef} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
