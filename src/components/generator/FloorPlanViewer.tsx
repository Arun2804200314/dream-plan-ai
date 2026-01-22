import { useState, lazy, Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RotateCcw, ZoomIn, ZoomOut, Save, Box, Grid2X2 } from "lucide-react";
import { FormData, GeneratedLayout } from "@/types/floorPlan";
import { generateBlueprintPDF } from "@/lib/generatePDF";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPlans } from "@/hooks/useSavedPlans";
import { toast } from "sonner";
import RoomSVGProfessional from "./RoomSVGProfessional";
import AreaSchedule from "./AreaSchedule";
import PlanLegend from "./PlanLegend";
import DimensionStrings from "./DimensionStrings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FloorPlan3DViewer = lazy(() => import("./FloorPlan3DViewer"));

interface FloorPlanViewerProps {
  planData: FormData;
  layout: GeneratedLayout;
  onReset: () => void;
}

const FloorPlanViewer = ({ planData, layout, onReset }: FloorPlanViewerProps) => {
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [planName, setPlanName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const { user } = useAuth();
  const { savePlan } = useSavedPlans();

  const plotWidth = parseInt(planData.plotWidth) || 40;
  const plotLength = parseInt(planData.plotLength) || 60;
  const floors = parseInt(planData.floors) || 1;
  
  // Professional scale for cleaner rendering
  const maxViewerWidth = 550;
  const maxViewerHeight = 400;
  const scaleX = maxViewerWidth / plotLength;
  const scaleY = maxViewerHeight / plotWidth;
  const scale = Math.min(scaleX, scaleY) * 0.85;
  
  // Wall thickness: exterior 9", interior 6" (scaled proportionally)
  const wallThickness = Math.max(2, scale * 0.75);

  // Filter rooms by floor
  const floorRooms = useMemo(() => 
    layout.rooms.filter(room => room.floor === selectedFloor),
    [layout.rooms, selectedFloor]
  );

  const handleExportPDF = () => {
    generateBlueprintPDF(planData, layout);
    toast.success('Blueprint PDF downloaded!');
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    await savePlan(planName, planData, layout);
    setSaveDialogOpen(false);
    setPlanName('');
  };

  const svgWidth = plotLength * scale * zoom;
  const svgHeight = plotWidth * scale * zoom;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant={view === '2d' ? 'default' : 'outline'} size="sm" onClick={() => setView('2d')}>
            <Grid2X2 className="w-4 h-4 mr-1" /> 2D
          </Button>
          <Button variant={view === '3d' ? 'default' : 'outline'} size="sm" onClick={() => setView('3d')}>
            <Box className="w-4 h-4 mr-1" /> 3D
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          {view === '2d' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[50px] text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              {floors > 1 && (
                <>
                  <div className="w-px h-6 bg-border mx-2" />
                  {Array.from({ length: floors }, (_, i) => i + 1).map((floor) => (
                    <Button
                      key={floor}
                      variant={selectedFloor === floor ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFloor(floor)}
                    >
                      F{floor}
                    </Button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> New
          </Button>
          {user && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Plan</DialogTitle>
                </DialogHeader>
                <Input 
                  placeholder="Enter plan name" 
                  value={planName} 
                  onChange={(e) => setPlanName(e.target.value)} 
                />
                <Button onClick={handleSave}>Save Plan</Button>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="hero" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Viewer */}
      {view === '3d' ? (
        <Suspense fallback={
          <div className="h-[500px] flex items-center justify-center bg-gradient-to-b from-muted/20 to-muted/40">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading 3D View...</p>
            </div>
          </div>
        }>
          <FloorPlan3DViewer 
            layout={layout} 
            plotWidth={plotWidth} 
            plotLength={plotLength} 
            floors={floors} 
          />
        </Suspense>
      ) : (
        <div className="p-6 bg-neutral-100 overflow-auto">
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
            {/* Left: Legend */}
            <div className="w-full lg:w-48 flex-shrink-0">
              <PlanLegend />
            </div>
            
            {/* Center: Floor Plan */}
            <div className="relative">
              {/* Title Block */}
              <div className="bg-white border-2 border-neutral-900 p-3 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                      Floor Plan - Level {selectedFloor}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono mt-1">
                      Plot: {plotLength}' × {plotWidth}' | Scale: 1" = 10'
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
                        <polygon points="10,2 14,18 10,14 6,18" fill="none" stroke="#1a1a1a" strokeWidth="1" />
                        <text x="10" y="10" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1a1a1a">N</text>
                      </svg>
                      <span>North</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Drawing Area */}
              <div className="bg-white border-2 border-neutral-900 p-10">
                <svg 
                  width={svgWidth + 60} 
                  height={svgHeight + 60}
                  className="block"
                  style={{ overflow: 'visible' }}
                >
                  {/* Offset for dimensions */}
                  <g transform="translate(40, 40)">
                    {/* Dimension strings outside the plan */}
                    <DimensionStrings
                      plotLength={plotLength}
                      plotWidth={plotWidth}
                      scale={scale}
                      zoom={zoom}
                      svgWidth={svgWidth}
                      svgHeight={svgHeight}
                    />
                    
                    {/* Plot boundary */}
                    <rect 
                      x={0} 
                      y={0} 
                      width={svgWidth} 
                      height={svgHeight} 
                      fill="#ffffff"
                      stroke="#1a1a1a" 
                      strokeWidth={2}
                    />
                    
                    {/* Rooms - professional monochrome */}
                    {floorRooms.map((room) => (
                      <RoomSVGProfessional
                        key={room.id}
                        room={room}
                        scale={scale}
                        zoom={zoom}
                        wallThickness={wallThickness}
                        allRooms={floorRooms}
                      />
                    ))}
                  </g>
                </svg>
              </div>
              
              {/* Footer note */}
              <div className="mt-3 text-center">
                <p className="text-[10px] text-neutral-500 font-mono">
                  Drawing for conceptual purposes only. Consult licensed architect for construction.
                </p>
              </div>
            </div>
            
            {/* Right: Area Schedule */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <AreaSchedule 
                rooms={floorRooms}
                totalArea={layout.totalArea}
                efficiency={layout.efficiency}
              />
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex flex-wrap gap-6 justify-between items-center">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total Area:</span>
              <strong className="text-foreground font-mono">{layout.totalArea} sq.ft</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Efficiency:</span>
              <strong className="text-foreground font-mono">{(layout.efficiency * 100).toFixed(1)}%</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rooms:</span>
              <strong className="text-foreground font-mono">{layout.rooms.length}</strong>
            </div>
          </div>
          
          {layout.suggestions && layout.suggestions.length > 0 && (
            <div className="text-xs text-muted-foreground max-w-md">
              💡 {layout.suggestions[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanViewer;
