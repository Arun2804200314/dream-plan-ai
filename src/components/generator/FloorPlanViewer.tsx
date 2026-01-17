import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface FloorPlanViewerProps {
  planData: {
    plotLength: string;
    plotWidth: string;
    bedrooms: number;
    bathrooms: number;
    kitchens: number;
    livingRooms: number;
    garage: boolean;
    balcony: boolean;
  };
  onReset: () => void;
}

const FloorPlanViewer = ({ planData, onReset }: FloorPlanViewerProps) => {
  const [zoom, setZoom] = useState(1);

  const plotWidth = parseInt(planData.plotWidth) || 40;
  const plotLength = parseInt(planData.plotLength) || 60;
  
  // Calculate scale factor to fit the plan in the viewer
  const maxViewerWidth = 600;
  const maxViewerHeight = 400;
  const scaleX = maxViewerWidth / plotLength;
  const scaleY = maxViewerHeight / plotWidth;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  // Generate room layout based on requirements
  const generateRooms = () => {
    const rooms = [];
    let currentX = 2;
    let currentY = 2;
    const roomWidth = (plotLength - 4) / 3;
    const roomHeight = (plotWidth - 4) / 2;

    // Living Room (larger space)
    rooms.push({
      id: "living",
      name: "Living Room",
      x: currentX,
      y: currentY,
      width: roomWidth * 1.5,
      height: roomHeight,
      color: "hsl(var(--chart-1))"
    });

    // Kitchen
    rooms.push({
      id: "kitchen",
      name: "Kitchen",
      x: currentX + roomWidth * 1.5 + 1,
      y: currentY,
      width: roomWidth * 0.75,
      height: roomHeight * 0.6,
      color: "hsl(var(--chart-2))"
    });

    // Dining
    rooms.push({
      id: "dining",
      name: "Dining",
      x: currentX + roomWidth * 1.5 + 1,
      y: currentY + roomHeight * 0.6 + 1,
      width: roomWidth * 0.75,
      height: roomHeight * 0.4 - 1,
      color: "hsl(var(--chart-3))"
    });

    // Bedrooms
    for (let i = 0; i < Math.min(planData.bedrooms, 3); i++) {
      rooms.push({
        id: `bedroom-${i}`,
        name: `Bedroom ${i + 1}`,
        x: currentX + (roomWidth + 1) * i,
        y: currentY + roomHeight + 2,
        width: roomWidth - 1,
        height: roomHeight - 2,
        color: "hsl(var(--chart-4))"
      });
    }

    // Bathrooms (smaller boxes inside or near bedrooms)
    for (let i = 0; i < Math.min(planData.bathrooms, 2); i++) {
      rooms.push({
        id: `bath-${i}`,
        name: `WC`,
        x: plotLength - 6 - (i * 5),
        y: 2,
        width: 4,
        height: 4,
        color: "hsl(var(--chart-5))"
      });
    }

    // Garage if selected
    if (planData.garage) {
      rooms.push({
        id: "garage",
        name: "Garage",
        x: plotLength - 10,
        y: plotWidth - 8,
        width: 8,
        height: 6,
        color: "hsl(var(--muted))"
      });
    }

    return rooms;
  };

  const rooms = generateRooms();

  return (
    <div className="bg-card border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            New Plan
          </Button>
          <Button variant="hero" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Plan Viewer */}
      <div className="p-8 bg-background/50 overflow-auto">
        <div 
          className="mx-auto bg-background border-2 border-foreground relative"
          style={{
            width: plotLength * scale * zoom,
            height: plotWidth * scale * zoom,
            transition: "all 0.3s ease"
          }}
        >
          {/* Grid Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width={10 * zoom} height={10 * zoom} patternUnits="userSpaceOnUse">
                <path 
                  d={`M ${10 * zoom} 0 L 0 0 0 ${10 * zoom}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Rooms */}
          {rooms.map((room) => (
            <div
              key={room.id}
              className="absolute border-2 border-foreground flex items-center justify-center transition-all duration-300 hover:opacity-80"
              style={{
                left: room.x * scale * zoom,
                top: room.y * scale * zoom,
                width: room.width * scale * zoom,
                height: room.height * scale * zoom,
                backgroundColor: room.color,
              }}
            >
              <span 
                className="text-foreground font-medium text-center px-1"
                style={{ fontSize: Math.max(8, 12 * zoom) }}
              >
                {room.name}
              </span>
            </div>
          ))}

          {/* Dimensions */}
          <div 
            className="absolute -top-8 left-0 right-0 flex items-center justify-center"
          >
            <span className="text-sm text-muted-foreground">
              {plotLength} ft
            </span>
          </div>
          <div 
            className="absolute -left-10 top-0 bottom-0 flex items-center justify-center"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            <span className="text-sm text-muted-foreground">
              {plotWidth} ft
            </span>
          </div>

          {/* North Arrow */}
          <div className="absolute top-2 right-2 flex flex-col items-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-foreground" />
            <span className="text-xs font-bold text-foreground mt-1">N</span>
          </div>
        </div>
      </div>

      {/* Room Legend */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-wrap gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 border border-foreground"
                style={{ backgroundColor: room.color }}
              />
              <span className="text-sm text-muted-foreground">{room.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanViewer;
