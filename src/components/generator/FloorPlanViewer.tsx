import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RotateCcw, ZoomIn, ZoomOut, Maximize2, Save, Box, Grid2X2 } from "lucide-react";
import { FormData, GeneratedLayout } from "@/types/floorPlan";
import { generateBlueprintPDF } from "@/lib/generatePDF";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPlans } from "@/hooks/useSavedPlans";
import { toast } from "sonner";
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
  const { user } = useAuth();
  const { savePlan } = useSavedPlans();

  const plotWidth = parseInt(planData.plotWidth) || 40;
  const plotLength = parseInt(planData.plotLength) || 60;
  
  const maxViewerWidth = 600;
  const maxViewerHeight = 400;
  const scaleX = maxViewerWidth / plotLength;
  const scaleY = maxViewerHeight / plotWidth;
  const scale = Math.min(scaleX, scaleY) * 0.85;

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

  return (
    <div className="bg-card border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant={view === '2d' ? 'default' : 'outline'} size="sm" onClick={() => setView('2d')}>
            <Grid2X2 className="w-4 h-4 mr-1" /> 2D
          </Button>
          <Button variant={view === '3d' ? 'default' : 'outline'} size="sm" onClick={() => setView('3d')}>
            <Box className="w-4 h-4 mr-1" /> 3D
          </Button>
          {view === '2d' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
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
                <Button variant="outline" size="sm"><Save className="w-4 h-4 mr-2" /> Save</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Save Plan</DialogTitle></DialogHeader>
                <Input placeholder="Plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} />
                <Button onClick={handleSave}>Save Plan</Button>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="hero" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {/* Viewer */}
      {view === '3d' ? (
        <Suspense fallback={<div className="h-[500px] flex items-center justify-center">Loading 3D...</div>}>
          <FloorPlan3DViewer layout={layout} plotWidth={plotWidth} plotLength={plotLength} floors={parseInt(planData.floors) || 1} />
        </Suspense>
      ) : (
        <div className="p-8 bg-background/50 overflow-auto">
          <div className="mx-auto bg-background border-2 border-foreground relative" style={{ width: plotLength * scale * zoom, height: plotWidth * scale * zoom, transition: "all 0.3s ease" }}>
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="grid" width={10 * zoom} height={10 * zoom} patternUnits="userSpaceOnUse"><path d={`M ${10 * zoom} 0 L 0 0 0 ${10 * zoom}`} fill="none" stroke="currentColor" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {layout.rooms.map((room) => (
              <div key={room.id} className="absolute border-2 border-foreground flex items-center justify-center" style={{ left: room.x * scale * zoom, top: room.y * scale * zoom, width: room.width * scale * zoom, height: room.height * scale * zoom, backgroundColor: room.color }}>
                <span className="text-foreground font-medium text-center px-1" style={{ fontSize: Math.max(8, 12 * zoom) }}>{room.name}</span>
              </div>
            ))}
            <div className="absolute -top-8 left-0 right-0 flex items-center justify-center"><span className="text-sm text-muted-foreground">{plotLength} ft</span></div>
            <div className="absolute -left-10 top-0 bottom-0 flex items-center justify-center" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}><span className="text-sm text-muted-foreground">{plotWidth} ft</span></div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 border-t border-border flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground">Efficiency: <strong className="text-foreground">{(layout.efficiency * 100).toFixed(0)}%</strong></span>
        <span className="text-muted-foreground">Total Area: <strong className="text-foreground">{layout.totalArea} sq.ft</strong></span>
      </div>
    </div>
  );
};

export default FloorPlanViewer;
