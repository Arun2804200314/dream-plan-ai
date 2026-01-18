import { useState, lazy, Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RotateCcw, ZoomIn, ZoomOut, Save, Box, Grid2X2, Compass } from "lucide-react";
import { FormData, GeneratedLayout, ROOM_COLORS } from "@/types/floorPlan";
import { generateBlueprintPDF } from "@/lib/generatePDF";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPlans } from "@/hooks/useSavedPlans";
import { toast } from "sonner";
import RoomSVG from "./RoomSVG";
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
  
  const maxViewerWidth = 700;
  const maxViewerHeight = 500;
  const scaleX = maxViewerWidth / plotLength;
  const scaleY = maxViewerHeight / plotWidth;
  const scale = Math.min(scaleX, scaleY) * 0.8;
  
  const wallThickness = 3;

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
        <div className="p-8 bg-background/50 overflow-auto">
          <div className="flex justify-center">
            <div className="relative">
              {/* Blueprint title */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-foreground uppercase tracking-wider">
                  Floor Plan - Level {selectedFloor}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Plot: {plotLength}' × {plotWidth}' | Scale: 1" = 10'
                </p>
              </div>
              
              {/* SVG Floor Plan */}
              <div className="relative bg-background border-2 border-foreground shadow-lg">
                {/* Compass */}
                <div className="absolute -top-12 -right-12 w-16 h-16 flex items-center justify-center">
                  <Compass className="w-10 h-10 text-muted-foreground" />
                  <span className="absolute -top-2 text-xs font-bold text-foreground">N</span>
                </div>
                
                {/* Dimension label - top */}
                <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-foreground" />
                    <span className="text-sm font-mono text-foreground">{plotLength} ft</span>
                    <div className="h-px w-8 bg-foreground" />
                  </div>
                </div>
                
                {/* Dimension label - left */}
                <div 
                  className="absolute -left-12 top-0 bottom-0 flex items-center justify-center"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-px h-8 bg-foreground" />
                    <span className="text-sm font-mono text-foreground">{plotWidth} ft</span>
                    <div className="w-px h-8 bg-foreground" />
                  </div>
                </div>
                
                <svg 
                  width={svgWidth} 
                  height={svgHeight}
                  className="block"
                  style={{ transition: "all 0.3s ease" }}
                >
                  {/* Background grid */}
                  <defs>
                    <pattern 
                      id="smallGrid" 
                      width={5 * zoom} 
                      height={5 * zoom} 
                      patternUnits="userSpaceOnUse"
                    >
                      <path 
                        d={`M ${5 * zoom} 0 L 0 0 0 ${5 * zoom}`} 
                        fill="none" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth="0.25"
                        opacity="0.3"
                      />
                    </pattern>
                    <pattern 
                      id="grid" 
                      width={scale * zoom} 
                      height={scale * zoom} 
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width={scale * zoom} height={scale * zoom} fill="url(#smallGrid)" />
                      <path 
                        d={`M ${scale * zoom} 0 L 0 0 0 ${scale * zoom}`} 
                        fill="none" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth="0.5"
                        opacity="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Plot boundary */}
                  <rect 
                    x={1} 
                    y={1} 
                    width={svgWidth - 2} 
                    height={svgHeight - 2} 
                    fill="none" 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    strokeDasharray="10,5"
                  />
                  
                  {/* Rooms */}
                  {floorRooms.map((room) => (
                    <RoomSVG
                      key={room.id}
                      room={room}
                      scale={scale}
                      zoom={zoom}
                      wallThickness={wallThickness}
                    />
                  ))}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {Object.entries(ROOM_COLORS).slice(0, 8).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 border border-foreground/30" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{type}</span>
                  </div>
                ))}
              </div>
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
