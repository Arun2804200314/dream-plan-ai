import { useState } from "react";
import PlanGeneratorForm from "@/components/generator/PlanGeneratorForm";
import FloorPlanViewer from "@/components/generator/FloorPlanViewer";
import { FormData, GeneratedLayout, ROOM_COLORS, RoomType } from "@/types/floorPlan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratorSectionProps {
  scrollRef: React.RefObject<HTMLDivElement>;
}

interface GenerationRequestBody {
  plotLength: number;
  plotWidth: number;
  floors: number;
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

const roomNames: Record<RoomType, string> = {
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  living: "Living Room",
  dining: "Dining Room",
  garage: "Garage",
  balcony: "Balcony",
  garden: "Garden",
  hallway: "Hallway",
  staircase: "Staircase",
  pooja: "Pooja Room",
  study: "Study",
  utility: "Utility",
  store: "Store",
  wardrobe: "Wardrobe",
};

const getRequestedRoomTypes = (request: GenerationRequestBody, floor: number): RoomType[] => {
  const base: RoomType[] = [
    ...Array.from({ length: Math.max(1, request.livingRooms) }, () => "living" as const),
    ...Array.from({ length: Math.max(1, request.kitchens) }, () => "kitchen" as const),
    ...Array.from({ length: Math.max(1, request.diningRooms) }, () => "dining" as const),
    ...Array.from({ length: Math.max(1, request.bedrooms) }, () => "bedroom" as const),
    ...Array.from({ length: Math.max(1, request.bathrooms) }, () => "bathroom" as const),
  ];

  if (floor === 1) {
    if (request.garage) base.push("garage");
    if (request.balcony) base.push("balcony");
    if (request.garden) base.push("garden");
  }

  return base;
};

const generateOfflineFallbackLayout = (request: GenerationRequestBody): GeneratedLayout => {
  const rooms: GeneratedLayout["rooms"] = [];

  for (let floor = 1; floor <= request.floors; floor++) {
    const requestedTypes = getRequestedRoomTypes(request, floor);
    const cellCount = Math.max(4, requestedTypes.length);
    const cols = Math.ceil(Math.sqrt(cellCount));
    const rows = Math.ceil(cellCount / cols);
    const cellWidth = request.plotLength / cols;
    const cellHeight = request.plotWidth / rows;

    const typeCounts = new Map<RoomType, number>();

    for (let index = 0; index < rows * cols; index++) {
      const roomType = requestedTypes[index] ?? "hallway";
      const count = (typeCounts.get(roomType) ?? 0) + 1;
      typeCounts.set(roomType, count);

      const col = index % cols;
      const row = Math.floor(index / cols);
      const isLastCol = col === cols - 1;
      const isLastRow = row === rows - 1;

      const x = col * cellWidth;
      const y = row * cellHeight;
      const width = isLastCol ? request.plotLength - x : cellWidth;
      const height = isLastRow ? request.plotWidth - y : cellHeight;

      rooms.push({
        id: `offline-${floor}-${roomType}-${count}`,
        type: roomType,
        name: `${roomNames[roomType]} ${count}`,
        x,
        y,
        width,
        height,
        floor,
        color: ROOM_COLORS[roomType],
        doors: [],
        windows: [],
      });
    }
  }

  return {
    rooms,
    totalArea: request.plotLength * request.plotWidth,
    efficiency: 1,
    wallThickness: 0.5,
    suggestions: [
      "Generated from local fallback because network request failed.",
      "Please retry generation when your network is stable for an AI-optimized plan.",
    ],
  };
};

const GeneratorSection = ({ scrollRef }: GeneratorSectionProps) => {
  const [generatedPlan, setGeneratedPlan] = useState<{ formData: FormData; layout: GeneratedLayout } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const buildRequestBody = (data: FormData): GenerationRequestBody => ({
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
  });

  const invokeGenerateFloorPlan = async (requestBody: GenerationRequestBody) => {
    const { data: result, error } = await supabase.functions.invoke("generate-floor-plan", {
      body: requestBody,
    });

    if (!error) {
      return result as GeneratedLayout;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isFetchIssue = errorMessage.includes("Failed to fetch") || errorMessage.includes("Failed to send a request");

    if (!isFetchIssue) {
      throw error;
    }

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-floor-plan`;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const fallbackResponse = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const fallbackData = await fallbackResponse.json();

    if (!fallbackResponse.ok) {
      throw new Error(fallbackData?.error || "Failed to generate plan");
    }

    return fallbackData as GeneratedLayout;
  };

  const handleGenerate = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const requestBody = buildRequestBody(data);

      let layout: GeneratedLayout | null = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          layout = await invokeGenerateFloorPlan(requestBody);
          break;
        } catch (error) {
          lastError = error;
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
        }
      }

      if (!layout) {
        const message = lastError instanceof Error ? lastError.message : String(lastError);
        const isFetchIssue = message.includes("Failed to fetch") || message.includes("Failed to send a request");

        if (isFetchIssue) {
          layout = generateOfflineFallbackLayout(requestBody);
          toast.warning("Network issue detected. Showing local fallback plan.");
        } else {
          throw lastError instanceof Error ? lastError : new Error("Failed to generate plan");
        }
      }

      setGeneratedPlan({ formData: data, layout });
      toast.success("Floor plan generated!");
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate plan");
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
