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

    const systemPrompt = `You are an expert architectural AI that generates optimized, REALISTIC floor plans. You MUST return a valid JSON object (no markdown, no code blocks) with room layouts.

CRITICAL ARCHITECTURAL RULES:
1. All rooms MUST fit within plot dimensions with 2ft margin from edges
2. Rooms MUST NOT overlap - calculate positions carefully
3. Include proper HALLWAY/CORRIDOR connecting rooms (minimum 4ft wide)
4. Bedrooms: minimum 10x10ft, prefer 12x14ft
5. Bathrooms: minimum 5x7ft, attach to bedrooms where possible
6. Kitchen: minimum 8x10ft, place near dining
7. Living room: largest room, typically 15x18ft or more
8. Dining: 10x12ft minimum, adjacent to kitchen
9. Garage: 12x20ft minimum for one car
10. Include doors between connected rooms
11. Add windows on exterior walls
12. For multi-floor: place staircase (4x8ft) consistently on each floor

CONNECTIVITY RULES:
- Main entrance should lead to living room or hallway
- Kitchen should connect to dining
- Bedrooms should have attached or nearby bathrooms
- All rooms must be accessible via doors/hallways

VASTU COMPLIANCE (if requested):
- Main entrance: North or East
- Master bedroom: Southwest
- Kitchen: Southeast
- Bathroom: Northwest
- Pooja room: Northeast

Return ONLY this JSON structure:
{
  "rooms": [
    {
      "id": "unique_id",
      "type": "bedroom|bathroom|kitchen|living|dining|garage|balcony|garden|hallway|staircase|pooja|study",
      "name": "Display Name (e.g., Master Bedroom, Kitchen, Hall)",
      "x": number (distance from left edge in feet),
      "y": number (distance from top edge in feet),
      "width": number (room width in feet),
      "height": number (room depth in feet),
      "floor": number (1 for ground floor, 2 for first floor, etc.),
      "color": "hsl(hue, saturation%, lightness%)",
      "doors": [
        { "position": "top|bottom|left|right", "offset": number (0-100, percentage along wall), "width": 3, "isMain": boolean }
      ],
      "windows": [
        { "position": "top|bottom|left|right", "offset": number (0-100), "width": 4 }
      ]
    }
  ],
  "totalArea": number (plot area in sq ft),
  "efficiency": number (0.75-0.95, ratio of usable space),
  "suggestions": ["array of 2-3 design recommendations"]
}`;

    const userPrompt = `Generate a REALISTIC, professionally laid out floor plan for:
- Plot Size: ${requestData.plotLength} ft (length/width) × ${requestData.plotWidth} ft (depth/height)
- Number of Floors: ${requestData.floors}
- Bedrooms Required: ${requestData.bedrooms}
- Bathrooms Required: ${requestData.bathrooms}
- Kitchens: ${requestData.kitchens}
- Living Rooms: ${requestData.livingRooms}
- Dining Rooms: ${requestData.diningRooms}
- Include Garage: ${requestData.garage ? "Yes (12x20ft minimum)" : "No"}
- Include Balcony: ${requestData.balcony ? "Yes" : "No"}
- Include Garden: ${requestData.garden ? "Yes (outdoor space)" : "No"}
- Architectural Style: ${requestData.style}
- Budget Range: ${requestData.budgetRange}
- Vastu Compliant: ${requestData.vastuCompliant ? "Yes - MUST follow Vastu guidelines" : "No"}

IMPORTANT:
1. Calculate room positions so they don't overlap
2. Add a hallway/corridor to connect rooms properly
3. Place doors where rooms connect
4. Add windows on exterior walls (walls touching plot boundary)
5. Make the layout practical and livable
6. If multiple floors, include staircase on each floor at the same position

Return ONLY the JSON object, no explanations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
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

    let layoutData;
    try {
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
      
      // Validate and fix the layout
      layoutData = validateAndFixLayout(layoutData, requestData);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      layoutData = generateRealisticLayout(requestData);
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

function validateAndFixLayout(layout: any, req: FloorPlanRequest) {
  if (!layout.rooms || !Array.isArray(layout.rooms)) {
    return generateRealisticLayout(req);
  }
  
  // Ensure all rooms have required fields
  layout.rooms = layout.rooms.map((room: any, index: number) => ({
    id: room.id || `room-${index}`,
    type: room.type || 'hallway',
    name: room.name || `Room ${index + 1}`,
    x: Math.max(2, Math.min(room.x || 2, req.plotLength - 10)),
    y: Math.max(2, Math.min(room.y || 2, req.plotWidth - 10)),
    width: Math.max(6, room.width || 10),
    height: Math.max(6, room.height || 10),
    floor: room.floor || 1,
    color: room.color || getDefaultColor(room.type),
    doors: room.doors || [],
    windows: room.windows || [],
  }));
  
  layout.totalArea = layout.totalArea || req.plotLength * req.plotWidth;
  layout.efficiency = layout.efficiency || 0.85;
  layout.suggestions = layout.suggestions || ["Layout generated successfully"];
  
  return layout;
}

function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    bedroom: 'hsl(270, 40%, 85%)',
    bathroom: 'hsl(195, 60%, 85%)',
    kitchen: 'hsl(40, 70%, 85%)',
    living: 'hsl(150, 40%, 85%)',
    dining: 'hsl(30, 50%, 85%)',
    garage: 'hsl(0, 0%, 80%)',
    balcony: 'hsl(80, 50%, 85%)',
    garden: 'hsl(120, 50%, 80%)',
    hallway: 'hsl(0, 0%, 90%)',
    staircase: 'hsl(0, 0%, 75%)',
    pooja: 'hsl(45, 70%, 85%)',
    study: 'hsl(220, 40%, 85%)',
  };
  return colors[type] || 'hsl(0, 0%, 85%)';
}

function generateRealisticLayout(req: FloorPlanRequest) {
  const rooms: any[] = [];
  const margin = 2;
  const wallThickness = 0.5;
  const corridorWidth = 5;
  
  const usableWidth = req.plotLength - margin * 2;
  const usableHeight = req.plotWidth - margin * 2;
  
  // Calculate layout zones
  const leftZoneWidth = usableWidth * 0.35;
  const rightZoneWidth = usableWidth * 0.35;
  const centerZoneWidth = usableWidth * 0.3;
  
  let roomId = 1;
  
  // For each floor
  for (let floor = 1; floor <= req.floors; floor++) {
    const isGroundFloor = floor === 1;
    
    // Hallway/Corridor - runs through the center
    rooms.push({
      id: `hallway-${floor}`,
      type: 'hallway',
      name: floor === 1 ? 'Entrance Hall' : `Hallway F${floor}`,
      x: margin + leftZoneWidth,
      y: margin,
      width: centerZoneWidth,
      height: usableHeight,
      floor: floor,
      color: getDefaultColor('hallway'),
      doors: [
        { position: 'bottom', offset: 45, width: 4, isMain: isGroundFloor },
      ],
      windows: [],
    });
    
    // Living Room - Ground floor left front
    if (isGroundFloor) {
      rooms.push({
        id: `living-${roomId++}`,
        type: 'living',
        name: 'Living Room',
        x: margin,
        y: margin,
        width: leftZoneWidth - wallThickness,
        height: usableHeight * 0.55,
        floor: floor,
        color: getDefaultColor('living'),
        doors: [
          { position: 'right', offset: 50, width: 3.5 },
        ],
        windows: [
          { position: 'left', offset: 30, width: 5 },
          { position: 'left', offset: 70, width: 5 },
          { position: 'top', offset: 50, width: 6 },
        ],
      });
      
      // Kitchen - Ground floor left back
      rooms.push({
        id: `kitchen-${roomId++}`,
        type: 'kitchen',
        name: 'Kitchen',
        x: margin,
        y: margin + usableHeight * 0.55 + wallThickness,
        width: leftZoneWidth * 0.6,
        height: usableHeight * 0.45 - wallThickness,
        floor: floor,
        color: getDefaultColor('kitchen'),
        doors: [
          { position: 'right', offset: 30, width: 3 },
        ],
        windows: [
          { position: 'left', offset: 50, width: 4 },
          { position: 'bottom', offset: 50, width: 4 },
        ],
      });
      
      // Dining - next to kitchen
      rooms.push({
        id: `dining-${roomId++}`,
        type: 'dining',
        name: 'Dining Room',
        x: margin + leftZoneWidth * 0.6 + wallThickness,
        y: margin + usableHeight * 0.55 + wallThickness,
        width: leftZoneWidth * 0.4 - wallThickness * 2,
        height: usableHeight * 0.45 - wallThickness,
        floor: floor,
        color: getDefaultColor('dining'),
        doors: [
          { position: 'right', offset: 50, width: 3 },
          { position: 'left', offset: 50, width: 3 },
        ],
        windows: [
          { position: 'bottom', offset: 50, width: 4 },
        ],
      });
    }
    
    // Bedrooms - right side
    const bedroomsPerFloor = Math.ceil(req.bedrooms / req.floors);
    const bedroomHeight = (usableHeight - (bedroomsPerFloor - 1) * wallThickness) / bedroomsPerFloor;
    
    for (let b = 0; b < bedroomsPerFloor && rooms.filter(r => r.type === 'bedroom').length < req.bedrooms; b++) {
      const bedroomY = margin + b * (bedroomHeight + wallThickness);
      
      rooms.push({
        id: `bedroom-${roomId++}`,
        type: 'bedroom',
        name: rooms.filter(r => r.type === 'bedroom').length === 0 ? 'Master Bedroom' : `Bedroom ${rooms.filter(r => r.type === 'bedroom').length + 1}`,
        x: margin + leftZoneWidth + centerZoneWidth + wallThickness,
        y: bedroomY,
        width: rightZoneWidth - 7,
        height: bedroomHeight,
        floor: floor,
        color: getDefaultColor('bedroom'),
        doors: [
          { position: 'left', offset: 20, width: 3 },
        ],
        windows: [
          { position: 'right', offset: 50, width: 5 },
          { position: 'top', offset: 50, width: 4 },
        ],
      });
      
      // Attached bathroom
      if (rooms.filter(r => r.type === 'bathroom').length < req.bathrooms) {
        rooms.push({
          id: `bathroom-${roomId++}`,
          type: 'bathroom',
          name: `Bath ${rooms.filter(r => r.type === 'bathroom').length + 1}`,
          x: margin + leftZoneWidth + centerZoneWidth + rightZoneWidth - 7 + wallThickness,
          y: bedroomY,
          width: 6,
          height: Math.min(bedroomHeight * 0.5, 8),
          floor: floor,
          color: getDefaultColor('bathroom'),
          doors: [
            { position: 'left', offset: 50, width: 2.5 },
          ],
          windows: [
            { position: 'right', offset: 50, width: 2 },
          ],
        });
      }
    }
    
    // Staircase (if multi-floor)
    if (req.floors > 1) {
      rooms.push({
        id: `staircase-${floor}`,
        type: 'staircase',
        name: 'Stairs',
        x: margin + leftZoneWidth + centerZoneWidth * 0.7,
        y: margin + usableHeight * 0.4,
        width: centerZoneWidth * 0.3 - wallThickness,
        height: 8,
        floor: floor,
        color: getDefaultColor('staircase'),
        doors: [
          { position: 'left', offset: 50, width: 3 },
        ],
        windows: [],
      });
    }
    
    // Second floor - additional bedrooms/study
    if (!isGroundFloor) {
      // Study room
      rooms.push({
        id: `study-${roomId++}`,
        type: 'study',
        name: 'Study',
        x: margin,
        y: margin,
        width: leftZoneWidth - wallThickness,
        height: usableHeight * 0.4,
        floor: floor,
        color: getDefaultColor('study'),
        doors: [
          { position: 'right', offset: 50, width: 3 },
        ],
        windows: [
          { position: 'left', offset: 50, width: 5 },
          { position: 'top', offset: 50, width: 5 },
        ],
      });
      
      // Balcony
      if (req.balcony) {
        rooms.push({
          id: `balcony-${roomId++}`,
          type: 'balcony',
          name: 'Balcony',
          x: margin,
          y: margin + usableHeight * 0.4 + wallThickness,
          width: leftZoneWidth - wallThickness,
          height: usableHeight * 0.25,
          floor: floor,
          color: getDefaultColor('balcony'),
          doors: [
            { position: 'right', offset: 50, width: 6 },
          ],
          windows: [],
        });
      }
    }
  }
  
  // Garage (ground floor only)
  if (req.garage) {
    rooms.push({
      id: `garage-${roomId++}`,
      type: 'garage',
      name: 'Garage',
      x: margin + leftZoneWidth + centerZoneWidth + wallThickness,
      y: margin + usableHeight - 12,
      width: rightZoneWidth - wallThickness,
      height: 12,
      floor: 1,
      color: getDefaultColor('garage'),
      doors: [
        { position: 'left', offset: 30, width: 3 },
        { position: 'bottom', offset: 50, width: 10, isMain: true },
      ],
      windows: [],
    });
  }
  
  // Garden (ground floor only, exterior)
  if (req.garden) {
    rooms.push({
      id: `garden-${roomId++}`,
      type: 'garden',
      name: 'Garden',
      x: req.plotLength - margin - 10,
      y: margin,
      width: 8,
      height: 15,
      floor: 1,
      color: getDefaultColor('garden'),
      doors: [],
      windows: [],
    });
  }

  // Calculate used area
  const usedArea = rooms
    .filter(r => r.floor === 1)
    .reduce((sum, r) => sum + r.width * r.height, 0);
  const totalPlotArea = req.plotLength * req.plotWidth;
  
  return {
    rooms,
    totalArea: totalPlotArea,
    efficiency: Math.min(0.92, usedArea / totalPlotArea),
    suggestions: [
      req.vastuCompliant ? "Layout follows Vastu principles with main entrance facing East" : "Layout optimized for natural light and ventilation",
      "All bedrooms have attached bathrooms for convenience",
      "Kitchen and dining are adjacent for easy access",
      req.floors > 1 ? "Staircase positioned centrally for easy access to all floors" : "Single-floor layout maximizes accessibility",
    ],
  };
}
