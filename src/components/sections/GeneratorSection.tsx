import { useState } from "react";
import PlanGeneratorForm from "@/components/generator/PlanGeneratorForm";
import FloorPlanViewer from "@/components/generator/FloorPlanViewer";
import { FormData, GeneratedLayout } from "@/types/floorPlan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratorSectionProps {
  scrollRef: React.RefObject<HTMLDivElement>;
}

const GeneratorSection = ({ scrollRef }: GeneratorSectionProps) => {
  const [generatedPlan, setGeneratedPlan] = useState<{ formData: FormData; layout: GeneratedLayout } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-floor-plan', {
        body: {
          plotLength: parseInt(data.plotLength) || 60,
          plotWidth: parseInt(data.plotWidth) || 40,
          floors: parseInt(data.floors) || 1,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          kitchens: data.kitchens,
          livingRooms: data.livingRooms,
          diningRooms: data.diningRooms,
          garage: data.garage,
          balcony: data.balcony,
          garden: data.garden,
          style: data.style,
          budgetRange: data.budgetRange,
          vastuCompliant: data.vastuCompliant,
        }
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      
      setGeneratedPlan({ formData: data, layout: result as GeneratedLayout });
      toast.success('Floor plan generated!');
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="generator" ref={scrollRef} className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Generate Your Building Plan</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Enter your requirements and let AI create optimized floor plans</p>
        </div>
        <div className="max-w-4xl mx-auto">
          {isGenerating ? (
            <div className="bg-card border border-border p-16 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 mb-6">
                {[0, 2, 4, 6].map((inset, i) => (
                  <div key={i} className="absolute border-4 border-primary animate-pulse" style={{ inset: `${inset * 4}px`, animationDelay: `${i * 0.2}s`, opacity: 0.2 + i * 0.2 }} />
                ))}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI is Generating Your Plan</h3>
              <p className="text-muted-foreground">Analyzing requirements and optimizing layout...</p>
            </div>
          ) : generatedPlan ? (
            <FloorPlanViewer planData={generatedPlan.formData} layout={generatedPlan.layout} onReset={() => setGeneratedPlan(null)} />
          ) : (
            <PlanGeneratorForm onGenerate={handleGenerate} />
          )}
        </div>
      </div>
    </section>
  );
};

export default GeneratorSection;
