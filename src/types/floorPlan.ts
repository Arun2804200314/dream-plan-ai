export interface Room {
  id: string;
  type: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'garage' | 'balcony' | 'garden' | 'hallway';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  color: string;
}

export interface GeneratedLayout {
  rooms: Room[];
  totalArea: number;
  efficiency: number;
  suggestions: string[];
}

export interface FormData {
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

export interface SavedPlan {
  id: string;
  user_id: string;
  name: string;
  plot_length: number;
  plot_width: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  living_rooms: number;
  dining_rooms: number;
  garage: boolean;
  balcony: boolean;
  garden: boolean;
  style: string;
  budget_range: string;
  vastu_compliant: boolean;
  generated_layout: GeneratedLayout | null;
  created_at: string;
  updated_at: string;
}
