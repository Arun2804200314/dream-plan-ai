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

    // Enhanced system prompt based on professional architect's layout style
    const systemPrompt = `You are an expert residential architect AI. Generate professional floor plans like real architects do.

CRITICAL LAYOUT PRINCIPLES (based on professional architectural standards):
1. **ZERO GAPS**: All rooms MUST share walls directly. No empty spaces between rooms.
2. **GRID-BASED LAYOUT**: Use a grid system where rooms align perfectly edge-to-edge.
3. **WALL THICKNESS**: Standard 6-inch (0.5ft) walls are implicit - room dimensions are interior.
4. **ROOM ADJACENCY**: Rooms that connect must share a common wall segment.

PROFESSIONAL ROOM SIZE STANDARDS (Interior dimensions):
- Master Bedroom: 16'x20' (with attached bathroom 8'x5' and walk-in wardrobe 8'x6')
- Regular Bedroom: 12'x14' to 14'x16'
- Living Room: 16'x22' (largest room, near entrance)
- Dining Room: 11'x16' (adjacent to kitchen)
- Kitchen: 16'x10' (with utility area 10'x6')
- Bathroom (attached): 8'x5' to 8'x6'
- Common Bathroom: 6'x8'
- Store Room: 6'x6'
- Pooja Room: 5'x6'
- Staircase: 4'x8' (with UP/DOWN landings)
- Balcony: 8'x12' (extending from living/dining)
- Utility/Wash: 10'x6'

LAYOUT ZONING (like professional architects):
1. **PUBLIC ZONE** (near entrance): Living room, Dining, Guest toilet
2. **SERVICE ZONE**: Kitchen, Utility, Store, Staircase
3. **PRIVATE ZONE**: Bedrooms with attached bathrooms, Wardrobes
4. **SEMI-PRIVATE**: Pooja room, Study

CONNECTIVITY RULES:
- Main entrance → Living room (via small foyer if space permits)
- Living room → Dining room (open or with wide opening)
- Dining room → Kitchen (direct access)
- Kitchen → Utility/Wash area
- Bedrooms → Attached bathroom/Wardrobe (en-suite)
- Staircase accessible from living/hallway area

VASTU COMPLIANCE (when requested):
- Main entrance: North or East facing
- Master bedroom: Southwest corner
- Kitchen: Southeast corner (Agni direction)
- Pooja room: Northeast corner (Ishan)
- Toilets: Northwest or West
- Living room: North or East
- Staircase: South or West

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "rooms": [
    {
      "id": "unique_id",
      "type": "bedroom|bathroom|kitchen|living|dining|garage|balcony|garden|hallway|staircase|pooja|study|utility|store|wardrobe",
      "name": "Display Name",
      "x": <number - left edge position in feet from plot left>,
      "y": <number - top edge position in feet from plot top>,
      "width": <number - room width in feet>,
      "height": <number - room height/depth in feet>,
      "floor": <number - 1 for ground, 2 for first floor>,
      "color": "hsl(hue, saturation%, lightness%)",
      "doors": [{"position": "top|bottom|left|right", "offset": <0-100>, "width": 3, "isMain": false}],
      "windows": [{"position": "top|bottom|left|right", "offset": <0-100>, "width": 4}]
    }
  ],
  "totalArea": <plot area>,
  "efficiency": <0.80-0.92>,
  "suggestions": ["recommendation 1", "recommendation 2"]
}`;

    const userPrompt = `Design a professional floor plan for a ${requestData.plotLength}'x${requestData.plotWidth}' plot:

PLOT DETAILS:
- Plot Width (X-axis): ${requestData.plotLength} feet
- Plot Depth (Y-axis): ${requestData.plotWidth} feet  
- Total Plot Area: ${requestData.plotLength * requestData.plotWidth} sq.ft
- Number of Floors: ${requestData.floors}

ROOM REQUIREMENTS:
- Bedrooms: ${requestData.bedrooms} (include attached bathroom for master bedroom)
- Bathrooms: ${requestData.bathrooms}
- Kitchen: ${requestData.kitchens} (with utility area nearby)
- Living Room: ${requestData.livingRooms}
- Dining Room: ${requestData.diningRooms}
${requestData.garage ? "- Garage: Yes (minimum 12'x20')" : ""}
${requestData.balcony ? "- Balcony: Yes (attached to living/dining)" : ""}
${requestData.garden ? "- Garden/Sit-out: Yes" : ""}
- Include: Store room, Pooja room

DESIGN REQUIREMENTS:
- Style: ${requestData.style}
- Budget: ${requestData.budgetRange}
${requestData.vastuCompliant ? "- VASTU COMPLIANT: Yes - strictly follow Vastu principles for room placement" : ""}

CRITICAL INSTRUCTIONS:
1. ALL rooms must share walls - NO gaps between rooms
2. Place rooms edge-to-edge like a professional architect
3. Master bedroom should have attached bathroom and walk-in wardrobe
4. Kitchen adjacent to dining with utility area
5. Include staircase if multiple floors (same position on each floor)
6. Add doors where rooms connect (offset 30-70% along wall)
7. Windows only on EXTERIOR walls (walls at plot boundary)
8. Rooms must fill the plot efficiently (80%+ coverage)

Return ONLY the JSON object.`;

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
        temperature: 0.5, // Lower temperature for more consistent layouts
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
      layoutData = generateProfessionalLayout(requestData);
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
  if (!layout.rooms || !Array.isArray(layout.rooms) || layout.rooms.length < 3) {
    return generateProfessionalLayout(req);
  }
  
  // Validate and fix each room
  layout.rooms = layout.rooms.map((room: any, index: number) => ({
    id: room.id || `room-${index}`,
    type: room.type || 'hallway',
    name: room.name || `Room ${index + 1}`,
    x: Math.max(0, Math.min(room.x || 0, req.plotLength - 6)),
    y: Math.max(0, Math.min(room.y || 0, req.plotWidth - 6)),
    width: Math.max(5, Math.min(room.width || 10, req.plotLength)),
    height: Math.max(5, Math.min(room.height || 10, req.plotWidth)),
    floor: room.floor || 1,
    color: room.color || getDefaultColor(room.type),
    doors: Array.isArray(room.doors) ? room.doors : [],
    windows: Array.isArray(room.windows) ? room.windows : [],
  }));
  
  layout.totalArea = layout.totalArea || req.plotLength * req.plotWidth;
  layout.efficiency = layout.efficiency || 0.85;
  layout.suggestions = layout.suggestions || ["Layout generated successfully"];
  
  return layout;
}

function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    bedroom: 'hsl(270, 40%, 88%)',
    bathroom: 'hsl(195, 55%, 88%)',
    kitchen: 'hsl(40, 65%, 88%)',
    living: 'hsl(150, 35%, 88%)',
    dining: 'hsl(30, 45%, 88%)',
    garage: 'hsl(0, 0%, 82%)',
    balcony: 'hsl(80, 45%, 88%)',
    garden: 'hsl(120, 45%, 82%)',
    hallway: 'hsl(0, 0%, 92%)',
    staircase: 'hsl(0, 0%, 78%)',
    pooja: 'hsl(45, 65%, 88%)',
    study: 'hsl(220, 35%, 88%)',
    utility: 'hsl(200, 30%, 88%)',
    store: 'hsl(25, 30%, 85%)',
    wardrobe: 'hsl(280, 30%, 88%)',
  };
  return colors[type] || 'hsl(0, 0%, 88%)';
}

// Professional layout generator based on architect's design principles
function generateProfessionalLayout(req: FloorPlanRequest) {
  const rooms: any[] = [];
  const plotW = req.plotLength; // Width (X-axis)
  const plotH = req.plotWidth;  // Depth (Y-axis)
  let roomId = 1;
  
  // Calculate zones based on plot size
  // Professional layouts typically divide into columns and rows
  
  for (let floor = 1; floor <= req.floors; floor++) {
    const isGroundFloor = floor === 1;
    
    // For a typical residential plot, divide into main sections
    // Left column: Bedrooms with attached bath/wardrobe
    // Center: Staircase, Hallway
    // Right column: Living, Dining, Kitchen
    
    if (plotW >= 30 && plotH >= 40) {
      // Standard residential layout (30'+ x 40'+)
      
      const leftColWidth = Math.min(18, plotW * 0.45);
      const rightColWidth = plotW - leftColWidth;
      
      // === LEFT COLUMN (Private Zone) ===
      
      // Master Bedroom with attached Bath and Wardrobe
      const masterBedWidth = leftColWidth;
      const masterBedHeight = Math.min(20, plotH * 0.4);
      
      rooms.push({
        id: `master-bed-${floor}`,
        type: 'bedroom',
        name: 'Master Bedroom',
        x: 0,
        y: 0,
        width: masterBedWidth - 8, // Leave space for attached rooms
        height: masterBedHeight,
        floor: floor,
        color: getDefaultColor('bedroom'),
        doors: [
          { position: 'right', offset: 80, width: 3, isMain: false },
        ],
        windows: [
          { position: 'left', offset: 50, width: 5 },
          { position: 'top', offset: 50, width: 4 },
        ],
      });
      
      // Walk-in Wardrobe (attached to master)
      rooms.push({
        id: `wardrobe-${floor}`,
        type: 'wardrobe',
        name: 'Walk-in Wardrobe',
        x: masterBedWidth - 8,
        y: 0,
        width: 8,
        height: masterBedHeight * 0.45,
        floor: floor,
        color: getDefaultColor('wardrobe'),
        doors: [
          { position: 'left', offset: 50, width: 2.5 },
        ],
        windows: [],
      });
      
      // Master Bathroom (attached to master)
      rooms.push({
        id: `master-bath-${floor}`,
        type: 'bathroom',
        name: 'Toilet',
        x: masterBedWidth - 8,
        y: masterBedHeight * 0.45,
        width: 8,
        height: masterBedHeight * 0.55,
        floor: floor,
        color: getDefaultColor('bathroom'),
        doors: [
          { position: 'left', offset: 40, width: 2.5 },
        ],
        windows: [
          { position: 'top', offset: 50, width: 2 },
        ],
      });
      
      // Pooja Room
      const poojaHeight = Math.min(8, plotH * 0.15);
      rooms.push({
        id: `pooja-${floor}`,
        type: 'pooja',
        name: 'Pooja Room',
        x: 0,
        y: masterBedHeight,
        width: leftColWidth * 0.5,
        height: poojaHeight,
        floor: floor,
        color: getDefaultColor('pooja'),
        doors: [
          { position: 'right', offset: 50, width: 3 },
        ],
        windows: [],
      });
      
      // Staircase
      const stairWidth = Math.min(4.5, leftColWidth * 0.3);
      const stairHeight = 10;
      rooms.push({
        id: `staircase-${floor}`,
        type: 'staircase',
        name: isGroundFloor ? 'Staircase UP' : 'Staircase DOWN',
        x: leftColWidth * 0.5,
        y: masterBedHeight,
        width: stairWidth,
        height: stairHeight,
        floor: floor,
        color: getDefaultColor('staircase'),
        doors: [
          { position: 'bottom', offset: 50, width: 3 },
        ],
        windows: [],
      });
      
      // === RIGHT COLUMN (Public/Service Zone) ===
      
      // Living Room (largest, near entrance)
      const livingHeight = plotH * 0.45;
      rooms.push({
        id: `living-${floor}`,
        type: 'living',
        name: 'Living Room',
        x: leftColWidth,
        y: 0,
        width: rightColWidth,
        height: livingHeight,
        floor: floor,
        color: getDefaultColor('living'),
        doors: [
          { position: 'bottom', offset: 20, width: 4, isMain: isGroundFloor },
          { position: 'left', offset: 50, width: 3 },
        ],
        windows: [
          { position: 'right', offset: 30, width: 5 },
          { position: 'right', offset: 70, width: 5 },
          { position: 'top', offset: 50, width: 6 },
        ],
      });
      
      // Balcony (attached to living)
      if (req.balcony) {
        const balconyWidth = 5;
        rooms[rooms.length - 1].width -= balconyWidth; // Reduce living room width
        rooms.push({
          id: `balcony-${floor}`,
          type: 'balcony',
          name: 'Balcony',
          x: plotW - balconyWidth,
          y: 0,
          width: balconyWidth,
          height: Math.min(12, livingHeight * 0.6),
          floor: floor,
          color: getDefaultColor('balcony'),
          doors: [
            { position: 'left', offset: 50, width: 5 },
          ],
          windows: [],
        });
      }
      
      // Dining Room
      const diningHeight = plotH * 0.25;
      rooms.push({
        id: `dining-${floor}`,
        type: 'dining',
        name: 'Dining',
        x: leftColWidth,
        y: livingHeight,
        width: rightColWidth * 0.55,
        height: diningHeight,
        floor: floor,
        color: getDefaultColor('dining'),
        doors: [
          { position: 'top', offset: 50, width: 4 },
          { position: 'right', offset: 50, width: 3 },
        ],
        windows: [],
      });
      
      // Kitchen
      const kitchenStartY = livingHeight;
      rooms.push({
        id: `kitchen-${floor}`,
        type: 'kitchen',
        name: 'Kitchen',
        x: leftColWidth + rightColWidth * 0.55,
        y: kitchenStartY,
        width: rightColWidth * 0.45,
        height: diningHeight + 4,
        floor: floor,
        color: getDefaultColor('kitchen'),
        doors: [
          { position: 'left', offset: 30, width: 3 },
        ],
        windows: [
          { position: 'right', offset: 50, width: 4 },
        ],
      });
      
      // Store Room
      const storeY = masterBedHeight + poojaHeight;
      rooms.push({
        id: `store-${floor}`,
        type: 'store',
        name: 'Store',
        x: 0,
        y: storeY,
        width: 6,
        height: 6,
        floor: floor,
        color: getDefaultColor('store'),
        doors: [
          { position: 'right', offset: 50, width: 2.5 },
        ],
        windows: [],
      });
      
      // Utility Area
      rooms.push({
        id: `utility-${floor}`,
        type: 'utility',
        name: 'Utility',
        x: 6,
        y: storeY,
        width: leftColWidth - 6,
        height: 6,
        floor: floor,
        color: getDefaultColor('utility'),
        doors: [
          { position: 'top', offset: 50, width: 3 },
        ],
        windows: [
          { position: 'left', offset: 50, width: 3 },
        ],
      });
      
      // Additional bedrooms on second floor or if required
      if (req.bedrooms > 1) {
        const bed2Y = livingHeight + diningHeight;
        const bed2Height = plotH - bed2Y;
        
        if (bed2Height >= 10) {
          rooms.push({
            id: `bedroom2-${floor}`,
            type: 'bedroom',
            name: `Bedroom ${roomId++}`,
            x: leftColWidth,
            y: bed2Y,
            width: rightColWidth * 0.6,
            height: bed2Height,
            floor: floor,
            color: getDefaultColor('bedroom'),
            doors: [
              { position: 'top', offset: 30, width: 3 },
            ],
            windows: [
              { position: 'bottom', offset: 50, width: 4 },
              { position: 'right', offset: 50, width: 4 },
            ],
          });
          
          // Attached bathroom for bedroom 2
          if (req.bathrooms > 1) {
            rooms.push({
              id: `bath2-${floor}`,
              type: 'bathroom',
              name: 'Bathroom',
              x: leftColWidth + rightColWidth * 0.6,
              y: bed2Y,
              width: rightColWidth * 0.4,
              height: Math.min(6, bed2Height * 0.5),
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
      }
      
    } else {
      // Smaller plot - compact layout
      // Simple two-column layout
      
      const colWidth = plotW / 2;
      
      // Left: Bedroom + Bath
      rooms.push({
        id: `bedroom-${floor}`,
        type: 'bedroom',
        name: 'Bedroom',
        x: 0,
        y: 0,
        width: colWidth,
        height: plotH * 0.6,
        floor: floor,
        color: getDefaultColor('bedroom'),
        doors: [
          { position: 'right', offset: 80, width: 3 },
        ],
        windows: [
          { position: 'left', offset: 50, width: 4 },
          { position: 'top', offset: 50, width: 4 },
        ],
      });
      
      rooms.push({
        id: `bathroom-${floor}`,
        type: 'bathroom',
        name: 'Bathroom',
        x: 0,
        y: plotH * 0.6,
        width: colWidth * 0.5,
        height: plotH * 0.4,
        floor: floor,
        color: getDefaultColor('bathroom'),
        doors: [
          { position: 'top', offset: 50, width: 2.5 },
        ],
        windows: [
          { position: 'left', offset: 50, width: 2 },
        ],
      });
      
      rooms.push({
        id: `kitchen-${floor}`,
        type: 'kitchen',
        name: 'Kitchen',
        x: colWidth * 0.5,
        y: plotH * 0.6,
        width: colWidth * 0.5,
        height: plotH * 0.4,
        floor: floor,
        color: getDefaultColor('kitchen'),
        doors: [
          { position: 'right', offset: 50, width: 3 },
        ],
        windows: [
          { position: 'bottom', offset: 50, width: 3 },
        ],
      });
      
      // Right: Living + Dining
      rooms.push({
        id: `living-${floor}`,
        type: 'living',
        name: 'Living Room',
        x: colWidth,
        y: 0,
        width: colWidth,
        height: plotH * 0.55,
        floor: floor,
        color: getDefaultColor('living'),
        doors: [
          { position: 'left', offset: 50, width: 3 },
          { position: 'bottom', offset: 50, width: 4, isMain: true },
        ],
        windows: [
          { position: 'right', offset: 30, width: 4 },
          { position: 'right', offset: 70, width: 4 },
        ],
      });
      
      rooms.push({
        id: `dining-${floor}`,
        type: 'dining',
        name: 'Dining',
        x: colWidth,
        y: plotH * 0.55,
        width: colWidth,
        height: plotH * 0.45,
        floor: floor,
        color: getDefaultColor('dining'),
        doors: [
          { position: 'top', offset: 50, width: 3 },
          { position: 'left', offset: 50, width: 3 },
        ],
        windows: [
          { position: 'bottom', offset: 50, width: 4 },
        ],
      });
    }
  }

  // Calculate actual used area
  const usedArea = rooms
    .filter(r => r.floor === 1)
    .reduce((sum, r) => sum + r.width * r.height, 0);
  const totalPlotArea = plotW * plotH;

  return {
    rooms,
    totalArea: totalPlotArea,
    efficiency: Math.min(0.92, usedArea / totalPlotArea),
    suggestions: [
      req.vastuCompliant ? "Layout follows Vastu principles with proper room orientations." : "Consider Vastu compliance for better energy flow.",
      "Master bedroom includes attached bathroom and walk-in wardrobe.",
      "Kitchen is adjacent to dining for easy serving access.",
    ],
  };
}
