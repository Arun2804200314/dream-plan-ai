import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FloorPlanRequest {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: FloorPlanRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating floor plan with requirements:", requestData);

    const systemPrompt = `You are an expert architectural AI that generates optimized floor plans. You must return a valid JSON object (no markdown, no code blocks) with room layouts based on user requirements.

IMPORTANT RULES:
1. All rooms must fit within the plot dimensions
2. Rooms must not overlap
3. Leave 2 units margin from plot edges
4. Ensure logical room connectivity (bedrooms near bathrooms, kitchen near dining)
5. If Vastu compliant, place kitchen in SE, master bedroom in SW, entrance in N/E
6. Optimize for natural light and ventilation
7. Consider the style preference for room proportions

Return ONLY a JSON object with this exact structure:
{
  "rooms": [
    {
      "id": "unique_id",
      "type": "bedroom|bathroom|kitchen|living|dining|garage|balcony|garden|hallway",
      "name": "Display Name",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "floor": number,
      "color": "hsl(hue, sat%, light%)"
    }
  ],
  "totalArea": number,
  "efficiency": number,
  "suggestions": ["string array of design recommendations"]
}`;

    const userPrompt = `Generate an optimized floor plan for:
- Plot: ${requestData.plotLength} ft x ${requestData.plotWidth} ft
- Floors: ${requestData.floors}
- Bedrooms: ${requestData.bedrooms}
- Bathrooms: ${requestData.bathrooms}
- Kitchens: ${requestData.kitchens}
- Living Rooms: ${requestData.livingRooms}
- Dining Rooms: ${requestData.diningRooms}
- Garage: ${requestData.garage ? "Yes" : "No"}
- Balcony: ${requestData.balcony ? "Yes" : "No"}
- Garden: ${requestData.garden ? "Yes" : "No"}
- Style: ${requestData.style}
- Budget: ${requestData.budgetRange}
- Vastu Compliant: ${requestData.vastuCompliant ? "Yes" : "No"}

Create an efficient, well-connected layout. Return ONLY the JSON object, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("Empty AI response");
      throw new Error("Empty response from AI");
    }

    console.log("Raw AI response:", content);

    // Parse the JSON from the response, handling potential markdown code blocks
    let layoutData;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      layoutData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback layout
      layoutData = generateFallbackLayout(requestData);
    }

    console.log("Generated layout:", layoutData);

    return new Response(
      JSON.stringify(layoutData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating floor plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackLayout(req: FloorPlanRequest) {
  const rooms = [];
  const plotWidth = req.plotWidth;
  const plotLength = req.plotLength;
  const margin = 2;
  
  let currentX = margin;
  let currentY = margin;
  const usableWidth = plotLength - margin * 2;
  const usableHeight = plotWidth - margin * 2;
  
  // Calculate room dimensions
  const roomWidth = usableWidth / 3;
  const roomHeight = usableHeight / 2;
  
  // Living Room (larger)
  rooms.push({
    id: "living-1",
    type: "living",
    name: "Living Room",
    x: currentX,
    y: currentY,
    width: roomWidth * 1.5,
    height: roomHeight,
    floor: 1,
    color: "hsl(215, 20%, 65%)"
  });
  
  // Kitchen
  rooms.push({
    id: "kitchen-1",
    type: "kitchen",
    name: "Kitchen",
    x: currentX + roomWidth * 1.5 + 1,
    y: currentY,
    width: roomWidth * 0.8,
    height: roomHeight * 0.6,
    floor: 1,
    color: "hsl(35, 60%, 55%)"
  });
  
  // Dining
  rooms.push({
    id: "dining-1",
    type: "dining",
    name: "Dining",
    x: currentX + roomWidth * 1.5 + 1,
    y: currentY + roomHeight * 0.6 + 1,
    width: roomWidth * 0.8,
    height: roomHeight * 0.4 - 1,
    floor: 1,
    color: "hsl(150, 30%, 50%)"
  });
  
  // Bedrooms
  for (let i = 0; i < Math.min(req.bedrooms, 3); i++) {
    rooms.push({
      id: `bedroom-${i + 1}`,
      type: "bedroom",
      name: `Bedroom ${i + 1}`,
      x: currentX + (roomWidth + 1) * i,
      y: currentY + roomHeight + 2,
      width: roomWidth - 1,
      height: roomHeight - 2,
      floor: 1,
      color: "hsl(260, 30%, 60%)"
    });
  }
  
  // Bathrooms
  for (let i = 0; i < Math.min(req.bathrooms, 2); i++) {
    rooms.push({
      id: `bathroom-${i + 1}`,
      type: "bathroom",
      name: `Bath ${i + 1}`,
      x: plotLength - margin - 5 - (i * 6),
      y: margin,
      width: 5,
      height: 5,
      floor: 1,
      color: "hsl(195, 50%, 55%)"
    });
  }
  
  // Garage
  if (req.garage) {
    rooms.push({
      id: "garage-1",
      type: "garage",
      name: "Garage",
      x: plotLength - margin - 10,
      y: plotWidth - margin - 8,
      width: 10,
      height: 8,
      floor: 1,
      color: "hsl(0, 0%, 50%)"
    });
  }
  
  return {
    rooms,
    totalArea: plotLength * plotWidth,
    efficiency: 0.85,
    suggestions: [
      "Consider adding more natural light through larger windows",
      "Ensure proper ventilation in all rooms",
      "Kitchen placement optimizes workflow between cooking and dining"
    ]
  };
}
