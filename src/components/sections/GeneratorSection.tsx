import { useState } from "react";
import PlanGeneratorForm from "@/components/generator/PlanGeneratorForm";
import FloorPlanViewer from "@/components/generator/FloorPlanViewer";

interface GeneratorSectionProps {
  scrollRef: React.RefObject<HTMLDivElement>;
}

interface FormData {
  plotLength: string;
  plotWidth: string;
  floors: string;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  livingRooms: number;
  diningRooms: number;
  garage: boolean;
  balcony: boolean;
  garden: boolean;
  style: string;
  budgetRange: string;
  vastuCompliant: boolean;
}

const GeneratorSection = ({ scrollRef }: GeneratorSectionProps) => {
  const [generatedPlan, setGeneratedPlan] = useState<FormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (data: FormData) => {
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGeneratedPlan(data);
    setIsGenerating(false);
  };

  const handleReset = () => {
    setGeneratedPlan(null);
  };

  return (
    <section id="generator" ref={scrollRef} className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Generate Your Building Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your requirements below and let our AI create optimized floor plans for you
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {isGenerating ? (
            <div className="bg-card border border-border p-16 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 animate-pulse" />
                <div className="absolute inset-2 border-4 border-primary/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
                <div className="absolute inset-4 border-4 border-primary/60 animate-pulse" style={{ animationDelay: "0.4s" }} />
                <div className="absolute inset-6 border-4 border-primary animate-pulse" style={{ animationDelay: "0.6s" }} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Generating Your Plan</h3>
              <p className="text-muted-foreground">AI is analyzing requirements and optimizing layout...</p>
            </div>
          ) : generatedPlan ? (
            <FloorPlanViewer planData={generatedPlan} onReset={handleReset} />
          ) : (
            <PlanGeneratorForm onGenerate={handleGenerate} />
          )}
        </div>
      </div>
    </section>
  );
};

export default GeneratorSection;
