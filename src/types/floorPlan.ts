export type RoomType = 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'garage' | 'balcony' | 'garden' | 'hallway' | 'staircase' | 'pooja' | 'study';

export type DoorPosition = 'top' | 'bottom' | 'left' | 'right';
export type WindowPosition = 'top' | 'bottom' | 'left' | 'right';

export interface Door {
  position: DoorPosition;
  offset: number; // percentage from start of wall (0-100)
  width: number; // door width in feet
  isMain?: boolean;
}

export interface Window {
  position: WindowPosition;
  offset: number; // percentage from start of wall
  width: number; // window width in feet
}

export interface Furniture {
  type: 'bed' | 'sofa' | 'dining-table' | 'kitchen-counter' | 'toilet' | 'shower' | 'sink' | 'wardrobe' | 'desk' | 'car' | 'plants' | 'tv';
  x: number; // relative position in room (0-100)
  y: number;
  rotation?: number; // degrees
}

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  color: string;
  doors?: Door[];
  windows?: Window[];
  furniture?: Furniture[];
}

export interface GeneratedLayout {
  rooms: Room[];
  totalArea: number;
  efficiency: number;
  suggestions: string[];
  wallThickness?: number;
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

// Room color palette with better architectural colors
export const ROOM_COLORS: Record<RoomType, string> = {
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

// Minimum room sizes (in sq ft) for validation
export const MIN_ROOM_SIZES: Record<RoomType, number> = {
  bedroom: 100,
  bathroom: 35,
  kitchen: 60,
  living: 150,
  dining: 80,
  garage: 180,
  balcony: 30,
  garden: 50,
  hallway: 20,
  staircase: 25,
  pooja: 20,
  study: 80,
};
