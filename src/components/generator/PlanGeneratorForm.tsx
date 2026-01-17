import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft } from "lucide-react";

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

interface PlanGeneratorFormProps {
  onGenerate: (data: FormData) => void;
}

const PlanGeneratorForm = ({ onGenerate }: PlanGeneratorFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    plotLength: "",
    plotWidth: "",
    floors: "1",
    bedrooms: 2,
    bathrooms: 2,
    kitchens: 1,
    livingRooms: 1,
    diningRooms: 1,
    garage: false,
    balcony: true,
    garden: false,
    style: "modern",
    budgetRange: "medium",
    vastuCompliant: false
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onGenerate(formData);
  };

  return (
    <div className="bg-card border border-border p-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div 
              className={`w-10 h-10 flex items-center justify-center font-bold ${
                s <= step 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div 
                className={`w-full h-1 mx-2 ${
                  s < step ? "bg-primary" : "bg-muted"
                }`}
                style={{ width: "80px" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Plot Details */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Plot Dimensions</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plotLength">Plot Length (ft)</Label>
              <Input
                id="plotLength"
                type="number"
                placeholder="e.g., 60"
                value={formData.plotLength}
                onChange={(e) => setFormData({ ...formData, plotLength: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotWidth">Plot Width (ft)</Label>
              <Input
                id="plotWidth"
                type="number"
                placeholder="e.g., 40"
                value={formData.plotWidth}
                onChange={(e) => setFormData({ ...formData, plotWidth: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floors">Number of Floors</Label>
            <Select 
              value={formData.floors} 
              onValueChange={(value) => setFormData({ ...formData, floors: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select floors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Single Floor (G)</SelectItem>
                <SelectItem value="2">Double Floor (G+1)</SelectItem>
                <SelectItem value="3">Triple Floor (G+2)</SelectItem>
                <SelectItem value="4">Four Floors (G+3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 2: Room Requirements */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Room Requirements</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Bedrooms: {formData.bedrooms}</Label>
              <Slider
                value={[formData.bedrooms]}
                onValueChange={(value) => setFormData({ ...formData, bedrooms: value[0] })}
                min={1}
                max={6}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <Label>Bathrooms: {formData.bathrooms}</Label>
              <Slider
                value={[formData.bathrooms]}
                onValueChange={(value) => setFormData({ ...formData, bathrooms: value[0] })}
                min={1}
                max={6}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <Label>Kitchens: {formData.kitchens}</Label>
              <Slider
                value={[formData.kitchens]}
                onValueChange={(value) => setFormData({ ...formData, kitchens: value[0] })}
                min={1}
                max={3}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <Label>Living Rooms: {formData.livingRooms}</Label>
              <Slider
                value={[formData.livingRooms]}
                onValueChange={(value) => setFormData({ ...formData, livingRooms: value[0] })}
                min={1}
                max={3}
                step={1}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="mb-4 block">Additional Spaces</Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="garage" 
                  checked={formData.garage}
                  onCheckedChange={(checked) => setFormData({ ...formData, garage: checked as boolean })}
                />
                <Label htmlFor="garage" className="cursor-pointer">Garage</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="balcony" 
                  checked={formData.balcony}
                  onCheckedChange={(checked) => setFormData({ ...formData, balcony: checked as boolean })}
                />
                <Label htmlFor="balcony" className="cursor-pointer">Balcony</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="garden" 
                  checked={formData.garden}
                  onCheckedChange={(checked) => setFormData({ ...formData, garden: checked as boolean })}
                />
                <Label htmlFor="garden" className="cursor-pointer">Garden Area</Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Design Preferences</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Design Style</Label>
              <Select 
                value={formData.style} 
                onValueChange={(value) => setFormData({ ...formData, style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="contemporary">Contemporary</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Budget Range</Label>
              <Select 
                value={formData.budgetRange} 
                onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Checkbox 
                id="vastu" 
                checked={formData.vastuCompliant}
                onCheckedChange={(checked) => setFormData({ ...formData, vastuCompliant: checked as boolean })}
              />
              <Label htmlFor="vastu" className="cursor-pointer">Vastu Compliant Design</Label>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-border">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={step === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {step < 3 ? (
          <Button variant="hero" onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button variant="glow" onClick={handleSubmit}>
            Generate Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlanGeneratorForm;
