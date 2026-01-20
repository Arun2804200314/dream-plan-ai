import { Suspense, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { Room, GeneratedLayout, RoomType } from '@/types/floorPlan';
import * as THREE from 'three';

const WALL_HEIGHT = 3; // meters
const WALL_THICKNESS = 0.12; // meters (thinner walls)
const SCALE = 0.3048; // feet to meters

// Room materials based on type
const getRoomMaterial = (type: RoomType) => {
  const colors: Record<RoomType, { floor: string; wall: string }> = {
    bedroom: { floor: '#d4c4e0', wall: '#f8f5fa' },
    bathroom: { floor: '#b8d4e3', wall: '#f0f8fc' },
    kitchen: { floor: '#e8d4a8', wall: '#fcf8f0' },
    living: { floor: '#c8e0c8', wall: '#f5fcf5' },
    dining: { floor: '#e0d0b8', wall: '#fcf8f0' },
    garage: { floor: '#a0a0a0', wall: '#e8e8e8' },
    balcony: { floor: '#c8d8a8', wall: '#f0f8e8' },
    garden: { floor: '#90c890', wall: '#e0f8e0' },
    hallway: { floor: '#d8d8d8', wall: '#f8f8f8' },
    staircase: { floor: '#b0b0b0', wall: '#f0f0f0' },
    pooja: { floor: '#e8d090', wall: '#fcf8e0' },
    study: { floor: '#b8c8e0', wall: '#f0f5fc' },
    utility: { floor: '#c0d0e0', wall: '#f2f6fb' },
    store: { floor: '#d9cbb8', wall: '#fbf7f2' },
    wardrobe: { floor: '#d9cfe6', wall: '#f8f6fc' },
  };
  return colors[type] || { floor: '#d0d0d0', wall: '#f5f5f5' };
};

// Check if a wall is shared with another room
const checkAdjacentWall = (room: Room, side: 'top' | 'bottom' | 'left' | 'right', allRooms: Room[]): boolean => {
  const tolerance = 1;

  for (const other of allRooms) {
    if (other.id === room.id || other.floor !== room.floor) continue;

    switch (side) {
      case 'top':
        if (Math.abs((other.y + other.height) - room.y) < tolerance) {
          const overlapStart = Math.max(room.x, other.x);
          const overlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
      case 'bottom':
        if (Math.abs(other.y - (room.y + room.height)) < tolerance) {
          const overlapStart = Math.max(room.x, other.x);
          const overlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
      case 'left':
        if (Math.abs((other.x + other.width) - room.x) < tolerance) {
          const overlapStart = Math.max(room.y, other.y);
          const overlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
      case 'right':
        if (Math.abs(other.x - (room.x + room.width)) < tolerance) {
          const overlapStart = Math.max(room.y, other.y);
          const overlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
    }
  }
  return false;
};

// Find the adjacent room sharing a wall segment (same floor). Returns the first match.
const findAdjacentRoom = (
  room: Room,
  side: 'top' | 'bottom' | 'left' | 'right',
  allRooms: Room[]
): Room | null => {
  const tolerance = 1;

  for (const other of allRooms) {
    if (other.id === room.id || other.floor !== room.floor) continue;

    switch (side) {
      case 'top':
        if (Math.abs((other.y + other.height) - room.y) < tolerance) {
          const overlapStart = Math.max(room.x, other.x);
          const overlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (overlapEnd - overlapStart > tolerance) return other;
        }
        break;
      case 'bottom':
        if (Math.abs(other.y - (room.y + room.height)) < tolerance) {
          const overlapStart = Math.max(room.x, other.x);
          const overlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (overlapEnd - overlapStart > tolerance) return other;
        }
        break;
      case 'left':
        if (Math.abs((other.x + other.width) - room.x) < tolerance) {
          const overlapStart = Math.max(room.y, other.y);
          const overlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (overlapEnd - overlapStart > tolerance) return other;
        }
        break;
      case 'right':
        if (Math.abs(other.x - (room.x + room.width)) < tolerance) {
          const overlapStart = Math.max(room.y, other.y);
          const overlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (overlapEnd - overlapStart > tolerance) return other;
        }
        break;
    }
  }

  return null;
};

// For shared walls, render the wall only once to avoid z-fighting.
const isPrimarySharedWall = (room: Room, side: 'top' | 'bottom' | 'left' | 'right', allRooms: Room[]) => {
  const adjacent = findAdjacentRoom(room, side, allRooms);
  if (!adjacent) return true;
  return room.id < adjacent.id;
};

interface WallSegmentProps {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}

function WallSegment({ position, size, color, rotation = [0, 0, 0] }: WallSegmentProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

interface WallWithOpeningsProps {
  start: [number, number];
  end: [number, number];
  height: number;
  thickness: number;
  color: string;
  doors: { offset: number; width: number }[];
  windows: { offset: number; width: number }[];
  isInterior: boolean;
}

function WallWithOpenings({ start, end, height, thickness, color, doors, windows, isInterior }: WallWithOpeningsProps) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  const doorHeight = 2.2;
  const windowHeight = 1.0;
  const windowBottom = 1.0;
  const wallThick = isInterior ? thickness * 0.7 : thickness;
  
  // Collect all openings
  type Opening = { start: number; end: number; type: 'door' | 'window' };
  const openings: Opening[] = [];
  
  doors.forEach(d => {
    const doorW = d.width * SCALE;
    const doorStart = (d.offset / 100) * length;
    openings.push({ start: doorStart, end: doorStart + doorW, type: 'door' });
  });
  
  windows.forEach(w => {
    const winW = w.width * SCALE;
    const winStart = (w.offset / 100) * length - winW / 2;
    openings.push({ start: winStart, end: winStart + winW, type: 'window' });
  });
  
  // Sort openings by position
  openings.sort((a, b) => a.start - b.start);
  
  const segments: JSX.Element[] = [];
  let currentPos = 0;
  
  openings.forEach((opening, i) => {
    // Wall before opening
    if (opening.start > currentPos + 0.05) {
      const segLen = opening.start - currentPos;
      segments.push(
        <WallSegment
          key={`wall-${i}-before`}
          position={[-(length / 2) + currentPos + segLen / 2, height / 2, 0]}
          size={[segLen, height, wallThick]}
          color={color}
        />
      );
    }
    
    const openingWidth = opening.end - opening.start;
    
    if (opening.type === 'door') {
      // Wall above door
      const aboveHeight = height - doorHeight;
      if (aboveHeight > 0.1) {
        segments.push(
          <WallSegment
            key={`door-above-${i}`}
            position={[-(length / 2) + opening.start + openingWidth / 2, height - aboveHeight / 2, 0]}
            size={[openingWidth, aboveHeight, wallThick]}
            color={color}
          />
        );
      }
      // Door frame
      segments.push(
        <mesh key={`door-frame-${i}`} position={[-(length / 2) + opening.start + openingWidth / 2, doorHeight / 2, 0]}>
          <boxGeometry args={[openingWidth + 0.04, doorHeight + 0.02, wallThick + 0.02]} />
          <meshStandardMaterial color="#6b4423" />
        </mesh>
      );
      // Door panel (slightly open)
      segments.push(
        <mesh 
          key={`door-panel-${i}`} 
          position={[-(length / 2) + opening.start + openingWidth * 0.8, doorHeight / 2, wallThick * 0.4]}
          rotation={[0, -0.4, 0]}
        >
          <boxGeometry args={[openingWidth * 0.95, doorHeight - 0.1, 0.04]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      );
    } else {
      // Wall below window
      segments.push(
        <WallSegment
          key={`win-below-${i}`}
          position={[-(length / 2) + opening.start + openingWidth / 2, windowBottom / 2, 0]}
          size={[openingWidth, windowBottom, wallThick]}
          color={color}
        />
      );
      // Wall above window
      const aboveHeight = height - windowBottom - windowHeight;
      if (aboveHeight > 0.1) {
        segments.push(
          <WallSegment
            key={`win-above-${i}`}
            position={[-(length / 2) + opening.start + openingWidth / 2, windowBottom + windowHeight + aboveHeight / 2, 0]}
            size={[openingWidth, aboveHeight, wallThick]}
            color={color}
          />
        );
      }
      // Window glass
      segments.push(
        <mesh key={`window-glass-${i}`} position={[-(length / 2) + opening.start + openingWidth / 2, windowBottom + windowHeight / 2, 0]}>
          <boxGeometry args={[openingWidth - 0.05, windowHeight - 0.05, 0.02]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} />
        </mesh>
      );
      // Window frame
      segments.push(
        <mesh key={`window-frame-${i}`} position={[-(length / 2) + opening.start + openingWidth / 2, windowBottom + windowHeight / 2, 0]}>
          <boxGeometry args={[openingWidth, windowHeight, wallThick * 0.5]} />
          <meshStandardMaterial color="#f5f5f5" wireframe />
        </mesh>
      );
    }
    
    currentPos = opening.end;
  });
  
  // Remaining wall after last opening
  if (currentPos < length - 0.05) {
    const segLen = length - currentPos;
    segments.push(
      <WallSegment
        key="wall-end"
        position={[-(length / 2) + currentPos + segLen / 2, height / 2, 0]}
        size={[segLen, height, wallThick]}
        color={color}
      />
    );
  }
  
  // If no openings, render full wall
  if (openings.length === 0) {
    return (
      <mesh position={[midX, height / 2, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, wallThick]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  
  return (
    <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
      {segments}
    </group>
  );
}

interface Room3DProps {
  room: Room;
  plotWidth: number;
  plotLength: number;
  floorHeight: number;
  allRooms: Room[];
}

function Room3D({ room, plotWidth, plotLength, floorHeight, allRooms }: Room3DProps) {
  const materials = getRoomMaterial(room.type);
  
  const x = (room.x - plotLength / 2) * SCALE;
  const z = (room.y - plotWidth / 2) * SCALE;
  const width = room.width * SCALE;
  const depth = room.height * SCALE;
  const baseY = (room.floor - 1) * floorHeight;
  
  // Check for interior walls
  const isInteriorTop = checkAdjacentWall(room, 'top', allRooms);
  const isInteriorBottom = checkAdjacentWall(room, 'bottom', allRooms);
  const isInteriorLeft = checkAdjacentWall(room, 'left', allRooms);
  const isInteriorRight = checkAdjacentWall(room, 'right', allRooms);
  
  // Get doors and windows for each wall
  const getDoorWindowsForWall = (position: 'top' | 'bottom' | 'left' | 'right') => {
    const doors = (room.doors || []).filter(d => d.position === position).map(d => ({ offset: d.offset, width: d.width }));
    const windows = (room.windows || []).filter(w => w.position === position).map(w => ({ offset: w.offset, width: w.width }));
    return { doors, windows };
  };
  
  const topWall = getDoorWindowsForWall('top');
  const bottomWall = getDoorWindowsForWall('bottom');
  const leftWall = getDoorWindowsForWall('left');
  const rightWall = getDoorWindowsForWall('right');

  // Determine which walls this room should render (to avoid duplicate shared walls)
  const renderTop = !isInteriorTop || isPrimarySharedWall(room, 'top', allRooms);
  const renderBottom = !isInteriorBottom || isPrimarySharedWall(room, 'bottom', allRooms);
  const renderLeft = !isInteriorLeft || isPrimarySharedWall(room, 'left', allRooms);
  const renderRight = !isInteriorRight || isPrimarySharedWall(room, 'right', allRooms);

  return (
    <group position={[x + width / 2, baseY, z + depth / 2]}>
      {/* Floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={materials.floor} />
      </mesh>

      {/* Floor border/skirting */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 0.02, depth - 0.02]} />
        <meshStandardMaterial color={materials.floor} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, floorHeight - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Front wall (negative Z / top in 2D) */}
      {renderTop && (
        <WallWithOpenings
          start={[-width / 2, -depth / 2]}
          end={[width / 2, -depth / 2]}
          height={floorHeight}
          thickness={WALL_THICKNESS}
          color={materials.wall}
          doors={topWall.doors}
          windows={isInteriorTop ? [] : topWall.windows}
          isInterior={isInteriorTop}
        />
      )}

      {/* Back wall (positive Z / bottom in 2D) */}
      {renderBottom && (
        <WallWithOpenings
          start={[-width / 2, depth / 2]}
          end={[width / 2, depth / 2]}
          height={floorHeight}
          thickness={WALL_THICKNESS}
          color={materials.wall}
          doors={bottomWall.doors}
          windows={isInteriorBottom ? [] : bottomWall.windows}
          isInterior={isInteriorBottom}
        />
      )}

      {/* Left wall (negative X) */}
      {renderLeft && (
        <WallWithOpenings
          start={[-width / 2, -depth / 2]}
          end={[-width / 2, depth / 2]}
          height={floorHeight}
          thickness={WALL_THICKNESS}
          color={materials.wall}
          doors={leftWall.doors}
          windows={isInteriorLeft ? [] : leftWall.windows}
          isInterior={isInteriorLeft}
        />
      )}

      {/* Right wall (positive X) */}
      {renderRight && (
        <WallWithOpenings
          start={[width / 2, -depth / 2]}
          end={[width / 2, depth / 2]}
          height={floorHeight}
          thickness={WALL_THICKNESS}
          color={materials.wall}
          doors={rightWall.doors}
          windows={isInteriorRight ? [] : rightWall.windows}
          isInterior={isInteriorRight}
        />
      )}
      <Text
        position={[0, floorHeight + 0.3, 0]}
        fontSize={0.4}
        color="#374151"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
      
      {/* Furniture */}
      <RoomFurniture type={room.type} width={width} depth={depth} />
    </group>
  );
}

function RoomFurniture({ type, width, depth }: { type: RoomType; width: number; depth: number }) {
  switch (type) {
    case 'bedroom':
      return (
        <group>
          {/* Bed frame */}
          <mesh position={[0, 0.15, depth * 0.1]} castShadow>
            <boxGeometry args={[width * 0.45, 0.3, depth * 0.55]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, 0.35, depth * 0.08]} castShadow>
            <boxGeometry args={[width * 0.42, 0.15, depth * 0.5]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>
          {/* Headboard */}
          <mesh position={[0, 0.55, depth * 0.32]}>
            <boxGeometry args={[width * 0.45, 0.6, 0.04]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Pillows */}
          <mesh position={[-width * 0.1, 0.48, depth * 0.22]}>
            <boxGeometry args={[0.35, 0.08, 0.25]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
          <mesh position={[width * 0.1, 0.48, depth * 0.22]}>
            <boxGeometry args={[0.35, 0.08, 0.25]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
          {/* Nightstand */}
          <mesh position={[-width * 0.35, 0.25, depth * 0.2]} castShadow>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
        </group>
      );
    case 'bathroom':
      return (
        <group>
          {/* Toilet */}
          <group position={[-width * 0.3, 0, -depth * 0.3]}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.4, 0.4, 0.55]} />
              <meshStandardMaterial color="#f8f8f8" />
            </mesh>
            <mesh position={[0, 0.45, -0.15]}>
              <boxGeometry args={[0.35, 0.5, 0.15]} />
              <meshStandardMaterial color="#f8f8f8" />
            </mesh>
          </group>
          {/* Sink */}
          <mesh position={[width * 0.25, 0.45, -depth * 0.35]}>
            <boxGeometry args={[0.5, 0.1, 0.4]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          {/* Shower tray */}
          <mesh position={[width * 0.25, 0.02, depth * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width * 0.4, depth * 0.4]} />
            <meshStandardMaterial color="#c8d8e8" />
          </mesh>
        </group>
      );
    case 'kitchen':
      return (
        <group>
          {/* Counter */}
          <mesh position={[0, 0.45, -depth * 0.38]} castShadow>
            <boxGeometry args={[width * 0.85, 0.9, 0.55]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Counter top */}
          <mesh position={[0, 0.91, -depth * 0.38]}>
            <boxGeometry args={[width * 0.87, 0.03, 0.58]} />
            <meshStandardMaterial color="#d8d8d8" />
          </mesh>
          {/* Stove */}
          <mesh position={[0, 0.93, -depth * 0.38]}>
            <boxGeometry args={[0.6, 0.02, 0.5]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      );
    case 'living':
      return (
        <group>
          {/* Sofa */}
          <mesh position={[0, 0.2, depth * 0.2]} castShadow>
            <boxGeometry args={[width * 0.55, 0.4, 0.7]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Sofa back */}
          <mesh position={[0, 0.5, depth * 0.32]}>
            <boxGeometry args={[width * 0.55, 0.55, 0.12]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Sofa arms */}
          <mesh position={[-width * 0.28, 0.35, depth * 0.2]}>
            <boxGeometry args={[0.08, 0.3, 0.7]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <mesh position={[width * 0.28, 0.35, depth * 0.2]}>
            <boxGeometry args={[0.08, 0.3, 0.7]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Coffee table */}
          <mesh position={[0, 0.25, -depth * 0.15]} castShadow>
            <boxGeometry args={[0.9, 0.04, 0.5]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          {/* Table legs */}
          {[[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx, 0.12, -depth * 0.15 + dz]}>
              <boxGeometry args={[0.03, 0.22, 0.03]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
          ))}
          {/* TV stand */}
          <mesh position={[0, 0.25, -depth * 0.4]} castShadow>
            <boxGeometry args={[width * 0.4, 0.5, 0.35]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
        </group>
      );
    case 'dining':
      return (
        <group>
          {/* Table */}
          <mesh position={[0, 0.38, 0]} castShadow>
            <boxGeometry args={[width * 0.45, 0.04, depth * 0.35]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          {/* Table legs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.18, 0.19, dz * depth * 0.14]}>
              <boxGeometry args={[0.04, 0.38, 0.04]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
          ))}
          {/* Chairs */}
          {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz], i) => (
            <group key={`chair-${i}`} position={[dx * width * 0.32, 0, dz * depth * 0.28]}>
              <mesh position={[0, 0.22, 0]} castShadow>
                <boxGeometry args={[0.35, 0.03, 0.35]} />
                <meshStandardMaterial color="#8b6914" />
              </mesh>
              <mesh position={[0, 0.45, dz === 0 ? 0.15 * (dx || 1) : 0.15 * dz]}>
                <boxGeometry args={[0.35, 0.45, 0.03]} />
                <meshStandardMaterial color="#8b6914" />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'garage':
      return (
        <group>
          {/* Car body */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[width * 0.45, 0.6, depth * 0.65]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {/* Car roof */}
          <mesh position={[0, 0.85, -depth * 0.05]}>
            <boxGeometry args={[width * 0.38, 0.35, depth * 0.35]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {/* Wheels */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.18, 0.15, dz * depth * 0.22]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          ))}
        </group>
      );
    case 'study':
      return (
        <group>
          {/* Desk */}
          <mesh position={[0, 0.38, -depth * 0.25]} castShadow>
            <boxGeometry args={[width * 0.5, 0.04, 0.5]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          {/* Desk legs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.22, 0.19, -depth * 0.25 + dz * 0.2]}>
              <boxGeometry args={[0.04, 0.38, 0.04]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
          ))}
          {/* Chair */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.4, 0.04, 0.4]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          {/* Monitor */}
          <mesh position={[0, 0.55, -depth * 0.35]}>
            <boxGeometry args={[0.5, 0.35, 0.03]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      );
    case 'hallway':
    case 'staircase':
      return (
        <group>
          {/* Stair steps indicator */}
          {type === 'staircase' && (
            <>
              {[0, 1, 2, 3, 4].map((step) => (
                <mesh key={step} position={[0, 0.15 + step * 0.15, -depth * 0.3 + step * 0.15]} castShadow>
                  <boxGeometry args={[width * 0.7, 0.12, 0.25]} />
                  <meshStandardMaterial color="#a0a0a0" />
                </mesh>
              ))}
            </>
          )}
        </group>
      );
    default:
      return null;
  }
}

function Ground({ plotWidth, plotLength }: { plotWidth: number; plotLength: number }) {
  const width = plotLength * SCALE;
  const depth = plotWidth * SCALE;
  
  return (
    <group>
      {/* Surrounding ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[width + 8, depth + 8]} />
        <meshStandardMaterial color="#7cb342" />
      </mesh>
      
      {/* Plot boundary / foundation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.3, depth + 0.3]} />
        <meshStandardMaterial color="#d4c4a8" />
      </mesh>
      
      {/* Plot edge outline */}
      <lineSegments position={[0, 0.02, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, depth)]} />
        <lineBasicMaterial color="#6b7280" linewidth={2} />
      </lineSegments>
    </group>
  );
}

interface BuildingProps {
  layout: GeneratedLayout;
  plotWidth: number;
  plotLength: number;
  floors: number;
}

function Building({ layout, plotWidth, plotLength, floors }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      <Ground plotWidth={plotWidth} plotLength={plotLength} />
      
      {/* All rooms */}
      {layout.rooms.map((room) => (
        <Room3D
          key={room.id}
          room={room}
          plotWidth={plotWidth}
          plotLength={plotLength}
          floorHeight={WALL_HEIGHT}
          allRooms={layout.rooms}
        />
      ))}
    </group>
  );
}

interface FloorPlan3DViewerProps {
  layout: GeneratedLayout;
  plotWidth: number;
  plotLength: number;
  floors: number;
}

const FloorPlan3DViewer = ({ layout, plotWidth, plotLength, floors }: FloorPlan3DViewerProps) => {
  const cameraDistance = Math.max(plotWidth, plotLength) * SCALE * 1.5;
  
  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-sky-200 to-sky-400 rounded-lg overflow-hidden relative">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={[cameraDistance, cameraDistance * 0.8, cameraDistance]} 
            fov={45} 
          />
          <OrbitControls 
            enablePan 
            enableZoom 
            enableRotate
            minDistance={cameraDistance * 0.3}
            maxDistance={cameraDistance * 3}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, floors * WALL_HEIGHT / 2, 0]}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[15, 25, 15]} 
            intensity={1.0} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={80}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
          />
          <directionalLight position={[-10, 15, -10]} intensity={0.3} />
          <hemisphereLight args={['#87ceeb', '#7cb342', 0.4]} />
          
          <Building 
            layout={layout} 
            plotWidth={plotWidth} 
            plotLength={plotLength}
            floors={floors}
          />
        </Suspense>
      </Canvas>
      
      <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-muted-foreground">
        Drag to rotate • Scroll to zoom • Shift+Drag to pan
      </div>
    </div>
  );
};

export default FloorPlan3DViewer;
