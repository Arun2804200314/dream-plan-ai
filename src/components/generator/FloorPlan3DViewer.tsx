import { Suspense, useRef, useMemo, useState, createContext, useContext } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { Room, GeneratedLayout, RoomType } from '@/types/floorPlan';
import * as THREE from 'three';

const WALL_HEIGHT = 3; // meters
const WALL_THICKNESS = 0.12; // meters (thinner walls)
const SCALE = 0.3048; // feet to meters

// Debug context to pass debug mode down to wall components
const DebugContext = createContext<{ debugMode: boolean }>({ debugMode: false });

// Debug colors for wall types
const DEBUG_COLORS = {
  exterior: '#4ade80', // green - exterior walls
  shared: '#f97316',   // orange - shared interior walls  
  sharedOwned: '#3b82f6', // blue - shared wall owned by this room
};

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

// Wall segment represents a portion of a wall with its properties
interface WallSegmentInfo {
  start: number; // Position along the wall (0 to wallLength)
  end: number;
  isShared: boolean;
  adjacentRoomId?: string;
}

// Get all adjacent rooms for a wall and their overlap ranges
const getAdjacentSegments = (
  room: Room,
  side: 'top' | 'bottom' | 'left' | 'right',
  allRooms: Room[]
): WallSegmentInfo[] => {
  const tolerance = 0.5;
  const wallLength = side === 'top' || side === 'bottom' ? room.width : room.height;
  const segments: WallSegmentInfo[] = [];

  for (const other of allRooms) {
    if (other.id === room.id || other.floor !== room.floor) continue;

    let overlapStart = 0;
    let overlapEnd = 0;
    let isAdjacent = false;

    switch (side) {
      case 'top':
        if (Math.abs((other.y + other.height) - room.y) < tolerance) {
          const absOverlapStart = Math.max(room.x, other.x);
          const absOverlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (absOverlapEnd - absOverlapStart > tolerance) {
            overlapStart = absOverlapStart - room.x;
            overlapEnd = absOverlapEnd - room.x;
            isAdjacent = true;
          }
        }
        break;
      case 'bottom':
        if (Math.abs(other.y - (room.y + room.height)) < tolerance) {
          const absOverlapStart = Math.max(room.x, other.x);
          const absOverlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (absOverlapEnd - absOverlapStart > tolerance) {
            overlapStart = absOverlapStart - room.x;
            overlapEnd = absOverlapEnd - room.x;
            isAdjacent = true;
          }
        }
        break;
      case 'left':
        if (Math.abs((other.x + other.width) - room.x) < tolerance) {
          const absOverlapStart = Math.max(room.y, other.y);
          const absOverlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (absOverlapEnd - absOverlapStart > tolerance) {
            overlapStart = absOverlapStart - room.y;
            overlapEnd = absOverlapEnd - room.y;
            isAdjacent = true;
          }
        }
        break;
      case 'right':
        if (Math.abs(other.x - (room.x + room.width)) < tolerance) {
          const absOverlapStart = Math.max(room.y, other.y);
          const absOverlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (absOverlapEnd - absOverlapStart > tolerance) {
            overlapStart = absOverlapStart - room.y;
            overlapEnd = absOverlapEnd - room.y;
            isAdjacent = true;
          }
        }
        break;
    }

    if (isAdjacent) {
      segments.push({
        start: Math.max(0, overlapStart),
        end: Math.min(wallLength, overlapEnd),
        isShared: true,
        adjacentRoomId: other.id,
      });
    }
  }

  return segments;
};

// Build complete wall segments (shared and exterior) for a wall
const buildWallSegments = (
  room: Room,
  side: 'top' | 'bottom' | 'left' | 'right',
  allRooms: Room[]
): WallSegmentInfo[] => {
  const wallLength = side === 'top' || side === 'bottom' ? room.width : room.height;
  const adjacentSegments = getAdjacentSegments(room, side, allRooms);

  if (adjacentSegments.length === 0) {
    return [{ start: 0, end: wallLength, isShared: false }];
  }

  // Sort by start position
  adjacentSegments.sort((a, b) => a.start - b.start);

  const result: WallSegmentInfo[] = [];
  let currentPos = 0;

  for (const seg of adjacentSegments) {
    // Exterior segment before this shared segment
    if (seg.start > currentPos + 0.1) {
      result.push({ start: currentPos, end: seg.start, isShared: false });
    }
    // Shared segment
    result.push(seg);
    currentPos = Math.max(currentPos, seg.end);
  }

  // Exterior segment after last shared segment
  if (currentPos < wallLength - 0.1) {
    result.push({ start: currentPos, end: wallLength, isShared: false });
  }

  return result;
};

// Determine if this room should render a shared wall segment (to avoid z-fighting)
const shouldRenderSharedSegment = (roomId: string, adjacentRoomId: string): boolean => {
  return roomId < adjacentRoomId;
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
  debugColor?: string;
  debugLabel?: string;
}

function WallWithOpenings({ start, end, height, thickness, color, doors, windows, isInterior, debugColor, debugLabel }: WallWithOpeningsProps) {
  const { debugMode } = useContext(DebugContext);
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  const doorHeight = 2.2;
  const windowHeight = 1.0;
  const windowBottom = 1.0;
  const wallThick = isInterior ? thickness * 0.7 : thickness;
  
  // Use debug color if in debug mode
  const wallColor = debugMode && debugColor ? debugColor : color;
  
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
          color={wallColor}
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
            color={wallColor}
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
          color={wallColor}
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
            color={wallColor}
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
        color={wallColor}
      />
    );
  }
  
  // Debug label for shared walls
  const debugLabelElement = debugMode && debugLabel ? (
    <Text
      position={[0, height + 0.15, 0]}
      fontSize={0.15}
      color="#000000"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.01}
      outlineColor="#ffffff"
    >
      {debugLabel}
    </Text>
  ) : null;
  
  // If no openings, render full wall
  if (openings.length === 0) {
    return (
      <group>
        <mesh position={[midX, height / 2, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
          <boxGeometry args={[length, height, wallThick]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        {debugLabelElement && (
          <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
            {debugLabelElement}
          </group>
        )}
      </group>
    );
  }
  
  return (
    <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
      {segments}
      {debugLabelElement}
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

// Component to render a single wall segment
interface SegmentedWallProps {
  room: Room;
  side: 'top' | 'bottom' | 'left' | 'right';
  segment: WallSegmentInfo;
  wallLength: number;
  width: number;
  depth: number;
  floorHeight: number;
  color: string;
  doors: { offset: number; width: number }[];
  windows: { offset: number; width: number }[];
}

function SegmentedWall({ 
  room, 
  side, 
  segment, 
  wallLength, 
  width, 
  depth, 
  floorHeight, 
  color, 
  doors, 
  windows 
}: SegmentedWallProps) {
  const segmentLength = (segment.end - segment.start) * SCALE;
  const segmentOffset = segment.start * SCALE;
  
  // For shared segments, only render if this room "owns" it
  if (segment.isShared && segment.adjacentRoomId) {
    if (!shouldRenderSharedSegment(room.id, segment.adjacentRoomId)) {
      return null;
    }
  }
  
  // Determine debug color and label
  let debugColor: string | undefined;
  let debugLabel: string | undefined;
  
  if (segment.isShared) {
    debugColor = DEBUG_COLORS.sharedOwned;
    debugLabel = `${room.name.slice(0, 8)}→${segment.adjacentRoomId?.slice(0, 4) || '?'}`;
  } else {
    debugColor = DEBUG_COLORS.exterior;
  }
  
  // Filter doors/windows that fall within this segment
  const segmentDoors = doors.filter(d => {
    const doorPos = (d.offset / 100) * wallLength;
    return doorPos >= segment.start && doorPos <= segment.end;
  }).map(d => ({
    offset: ((d.offset / 100) * wallLength - segment.start) / (segment.end - segment.start) * 100,
    width: d.width,
  }));
  
  // Only include windows on exterior segments
  const segmentWindows = segment.isShared ? [] : windows.filter(w => {
    const winPos = (w.offset / 100) * wallLength;
    return winPos >= segment.start && winPos <= segment.end;
  }).map(w => ({
    offset: ((w.offset / 100) * wallLength - segment.start) / (segment.end - segment.start) * 100,
    width: w.width,
  }));
  
  // Calculate position based on side
  let start: [number, number];
  let end: [number, number];
  
  switch (side) {
    case 'top':
      start = [-width / 2 + segmentOffset, -depth / 2];
      end = [-width / 2 + segmentOffset + segmentLength, -depth / 2];
      break;
    case 'bottom':
      start = [-width / 2 + segmentOffset, depth / 2];
      end = [-width / 2 + segmentOffset + segmentLength, depth / 2];
      break;
    case 'left':
      start = [-width / 2, -depth / 2 + segmentOffset];
      end = [-width / 2, -depth / 2 + segmentOffset + segmentLength];
      break;
    case 'right':
      start = [width / 2, -depth / 2 + segmentOffset];
      end = [width / 2, -depth / 2 + segmentOffset + segmentLength];
      break;
  }
  
  return (
    <WallWithOpenings
      start={start}
      end={end}
      height={floorHeight}
      thickness={WALL_THICKNESS}
      color={color}
      doors={segmentDoors}
      windows={segmentWindows}
      isInterior={segment.isShared}
      debugColor={debugColor}
      debugLabel={debugLabel}
    />
  );
}

// Check if a room type should have railings instead of walls on exterior edges
const isRailingRoom = (type: RoomType): boolean => {
  return type === 'balcony' || type === 'garden';
};

// 3D Railing component for balconies and gardens
function Railing3D({ 
  start, 
  end, 
  height = 1.0 
}: { 
  start: [number, number]; 
  end: [number, number]; 
  height?: number;
}) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  const postCount = Math.max(2, Math.floor(length / 0.6) + 1);
  const balusterCount = Math.max(3, Math.floor(length / 0.1));
  
  return (
    <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
      {/* Posts */}
      {Array.from({ length: postCount }).map((_, i) => {
        const x = -length / 2 + (i * length / (postCount - 1));
        return (
          <mesh key={`post-${i}`} position={[x, height / 2, 0]} castShadow>
            <boxGeometry args={[0.05, height, 0.05]} />
            <meshStandardMaterial color="#3d3d3d" metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Top rail */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[length, 0.05, 0.06]} />
        <meshStandardMaterial color="#3d3d3d" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Middle rail */}
      <mesh position={[0, height * 0.5, 0]}>
        <boxGeometry args={[length, 0.03, 0.04]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Balusters */}
      {Array.from({ length: balusterCount }).map((_, i) => {
        const x = -length / 2 + 0.05 + (i * (length - 0.1) / (balusterCount - 1));
        return (
          <mesh key={`baluster-${i}`} position={[x, height * 0.5, 0]}>
            <boxGeometry args={[0.015, height * 0.9, 0.015]} />
            <meshStandardMaterial color="#5a5a5a" metalness={0.5} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function Room3D({ room, plotWidth, plotLength, floorHeight, allRooms }: Room3DProps) {
  const materials = getRoomMaterial(room.type);
  
  const x = (room.x - plotLength / 2) * SCALE;
  const z = (room.y - plotWidth / 2) * SCALE;
  const width = room.width * SCALE;
  const depth = room.height * SCALE;
  const baseY = (room.floor - 1) * floorHeight;
  
  const isRailing = isRailingRoom(room.type);
  
  // Build wall segments for each side
  const topSegments = buildWallSegments(room, 'top', allRooms);
  const bottomSegments = buildWallSegments(room, 'bottom', allRooms);
  const leftSegments = buildWallSegments(room, 'left', allRooms);
  const rightSegments = buildWallSegments(room, 'right', allRooms);
  
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

  // Helper to check if a side is exterior (not shared with another room)
  const isExteriorSide = (segments: WallSegmentInfo[]): boolean => {
    return segments.some(seg => !seg.isShared);
  };

  const topIsExterior = isExteriorSide(topSegments);
  const bottomIsExterior = isExteriorSide(bottomSegments);
  const leftIsExterior = isExteriorSide(leftSegments);
  const rightIsExterior = isExteriorSide(rightSegments);

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

      {/* Ceiling - skip for balcony/garden (open air) */}
      {!isRailing && (
        <mesh position={[0, floorHeight - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}

      {/* Top wall segments - use railings for exterior edges of balcony/garden */}
      {topSegments.map((seg, i) => {
        if (isRailing && !seg.isShared) {
          // Render railing instead of wall for exterior edge
          const segmentLength = (seg.end - seg.start) * SCALE;
          const segmentOffset = seg.start * SCALE;
          return (
            <Railing3D
              key={`top-railing-${i}`}
              start={[-width / 2 + segmentOffset, -depth / 2]}
              end={[-width / 2 + segmentOffset + segmentLength, -depth / 2]}
              height={1.0}
            />
          );
        }
        return (
          <SegmentedWall
            key={`top-${i}`}
            room={room}
            side="top"
            segment={seg}
            wallLength={room.width}
            width={width}
            depth={depth}
            floorHeight={floorHeight}
            color={materials.wall}
            doors={topWall.doors}
            windows={topWall.windows}
          />
        );
      })}

      {/* Bottom wall segments */}
      {bottomSegments.map((seg, i) => {
        if (isRailing && !seg.isShared) {
          const segmentLength = (seg.end - seg.start) * SCALE;
          const segmentOffset = seg.start * SCALE;
          return (
            <Railing3D
              key={`bottom-railing-${i}`}
              start={[-width / 2 + segmentOffset, depth / 2]}
              end={[-width / 2 + segmentOffset + segmentLength, depth / 2]}
              height={1.0}
            />
          );
        }
        return (
          <SegmentedWall
            key={`bottom-${i}`}
            room={room}
            side="bottom"
            segment={seg}
            wallLength={room.width}
            width={width}
            depth={depth}
            floorHeight={floorHeight}
            color={materials.wall}
            doors={bottomWall.doors}
            windows={bottomWall.windows}
          />
        );
      })}

      {/* Left wall segments */}
      {leftSegments.map((seg, i) => {
        if (isRailing && !seg.isShared) {
          const segmentLength = (seg.end - seg.start) * SCALE;
          const segmentOffset = seg.start * SCALE;
          return (
            <Railing3D
              key={`left-railing-${i}`}
              start={[-width / 2, -depth / 2 + segmentOffset]}
              end={[-width / 2, -depth / 2 + segmentOffset + segmentLength]}
              height={1.0}
            />
          );
        }
        return (
          <SegmentedWall
            key={`left-${i}`}
            room={room}
            side="left"
            segment={seg}
            wallLength={room.height}
            width={width}
            depth={depth}
            floorHeight={floorHeight}
            color={materials.wall}
            doors={leftWall.doors}
            windows={leftWall.windows}
          />
        );
      })}

      {/* Right wall segments */}
      {rightSegments.map((seg, i) => {
        if (isRailing && !seg.isShared) {
          const segmentLength = (seg.end - seg.start) * SCALE;
          const segmentOffset = seg.start * SCALE;
          return (
            <Railing3D
              key={`right-railing-${i}`}
              start={[width / 2, -depth / 2 + segmentOffset]}
              end={[width / 2, -depth / 2 + segmentOffset + segmentLength]}
              height={1.0}
            />
          );
        }
        return (
          <SegmentedWall
            key={`right-${i}`}
            room={room}
            side="right"
            segment={seg}
            wallLength={room.height}
            width={width}
            depth={depth}
            floorHeight={floorHeight}
            color={materials.wall}
            doors={rightWall.doors}
            windows={rightWall.windows}
          />
        );
      })}

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

// Realistic room-specific 3D elements
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
          {/* Lamp on nightstand */}
          <mesh position={[-width * 0.35, 0.55, depth * 0.2]}>
            <cylinderGeometry args={[0.05, 0.08, 0.15, 12]} />
            <meshStandardMaterial color="#d4a574" />
          </mesh>
          <mesh position={[-width * 0.35, 0.68, depth * 0.2]}>
            <coneGeometry args={[0.12, 0.15, 12]} />
            <meshStandardMaterial color="#fef9e7" />
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
            {/* Toilet seat */}
            <mesh position={[0, 0.42, 0.05]} rotation={[-0.1, 0, 0]}>
              <boxGeometry args={[0.38, 0.03, 0.35]} />
              <meshStandardMaterial color="#e0e0e0" />
            </mesh>
          </group>
          {/* Sink with vanity */}
          <group position={[width * 0.25, 0, -depth * 0.35]}>
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.6, 0.8, 0.45]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0, 0.82, 0]}>
              <boxGeometry args={[0.58, 0.04, 0.43]} />
              <meshStandardMaterial color="#d4d4d4" />
            </mesh>
            {/* Basin */}
            <mesh position={[0, 0.78, 0]}>
              <cylinderGeometry args={[0.18, 0.15, 0.12, 24]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Faucet */}
            <mesh position={[0, 0.9, -0.12]}>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Mirror */}
            <mesh position={[0, 1.4, -0.2]}>
              <boxGeometry args={[0.5, 0.6, 0.02]} />
              <meshStandardMaterial color="#b8d4e8" metalness={0.5} roughness={0.1} />
            </mesh>
          </group>
          {/* Shower enclosure */}
          <group position={[width * 0.25, 0, depth * 0.25]}>
            {/* Shower tray */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width * 0.4, depth * 0.4]} />
              <meshStandardMaterial color="#e8f0f8" />
            </mesh>
            {/* Glass panels */}
            <mesh position={[-width * 0.2, WALL_HEIGHT / 2, 0]}>
              <boxGeometry args={[0.02, WALL_HEIGHT * 0.7, depth * 0.38]} />
              <meshStandardMaterial color="#a8d0e8" transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, WALL_HEIGHT / 2, -depth * 0.2]}>
              <boxGeometry args={[width * 0.38, WALL_HEIGHT * 0.7, 0.02]} />
              <meshStandardMaterial color="#a8d0e8" transparent opacity={0.3} />
            </mesh>
            {/* Shower head */}
            <mesh position={[0, WALL_HEIGHT * 0.7, -depth * 0.18]}>
              <cylinderGeometry args={[0.1, 0.08, 0.05, 12]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>
      );

    case 'kitchen':
      return (
        <group>
          {/* L-shaped counter */}
          <mesh position={[0, 0.45, -depth * 0.38]} castShadow>
            <boxGeometry args={[width * 0.85, 0.9, 0.55]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          <mesh position={[-width * 0.38, 0.45, 0]} castShadow>
            <boxGeometry args={[0.55, 0.9, depth * 0.6]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Counter tops */}
          <mesh position={[0, 0.91, -depth * 0.38]}>
            <boxGeometry args={[width * 0.87, 0.03, 0.58]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
          <mesh position={[-width * 0.38, 0.91, 0]}>
            <boxGeometry args={[0.58, 0.03, depth * 0.62]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
          {/* Stove with burners */}
          <mesh position={[width * 0.15, 0.93, -depth * 0.38]}>
            <boxGeometry args={[0.6, 0.02, 0.5]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          {/* Burner rings */}
          {[[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.1], [0.12, 0.1]].map(([dx, dz], i) => (
            <mesh key={i} position={[width * 0.15 + dx, 0.95, -depth * 0.38 + dz]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.06, 0.01, 8, 24]} />
              <meshStandardMaterial color="#4a4a4a" />
            </mesh>
          ))}
          {/* Sink */}
          <mesh position={[-width * 0.15, 0.88, -depth * 0.38]}>
            <boxGeometry args={[0.5, 0.15, 0.4]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Fridge */}
          <mesh position={[width * 0.35, 0.9, depth * 0.3]} castShadow>
            <boxGeometry args={[0.7, 1.8, 0.65]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          {/* Fridge handle */}
          <mesh position={[width * 0.35 + 0.32, 1.0, depth * 0.3]}>
            <boxGeometry args={[0.02, 0.4, 0.03]} />
            <meshStandardMaterial color="#a0a0a0" />
          </mesh>
          {/* Upper cabinets */}
          <mesh position={[0, 2.0, -depth * 0.42]}>
            <boxGeometry args={[width * 0.8, 0.5, 0.35]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
        </group>
      );

    case 'living':
      return (
        <group>
          {/* L-shaped sofa */}
          <mesh position={[0, 0.2, depth * 0.25]} castShadow>
            <boxGeometry args={[width * 0.55, 0.4, 0.7]} />
            <meshStandardMaterial color="#4a6741" />
          </mesh>
          <mesh position={[0, 0.5, depth * 0.38]}>
            <boxGeometry args={[width * 0.55, 0.45, 0.12]} />
            <meshStandardMaterial color="#4a6741" />
          </mesh>
          <mesh position={[-width * 0.28, 0.35, depth * 0.25]}>
            <boxGeometry args={[0.08, 0.3, 0.7]} />
            <meshStandardMaterial color="#4a6741" />
          </mesh>
          <mesh position={[width * 0.28, 0.35, depth * 0.25]}>
            <boxGeometry args={[0.08, 0.3, 0.7]} />
            <meshStandardMaterial color="#4a6741" />
          </mesh>
          {/* Cushions */}
          {[-0.2, 0, 0.2].map((dx, i) => (
            <mesh key={i} position={[dx * width, 0.48, depth * 0.2]}>
              <boxGeometry args={[0.35, 0.12, 0.35]} />
              <meshStandardMaterial color="#5d8254" />
            </mesh>
          ))}
          {/* Coffee table with glass top */}
          <mesh position={[0, 0.25, -depth * 0.1]} castShadow>
            <boxGeometry args={[0.9, 0.04, 0.5]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.4} />
          </mesh>
          {[[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx, 0.12, -depth * 0.1 + dz]}>
              <boxGeometry args={[0.03, 0.22, 0.03]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
          ))}
          {/* TV unit */}
          <mesh position={[0, 0.25, -depth * 0.42]} castShadow>
            <boxGeometry args={[width * 0.5, 0.5, 0.35]} />
            <meshStandardMaterial color="#3d3d3d" />
          </mesh>
          {/* TV screen */}
          <mesh position={[0, 0.8, -depth * 0.43]}>
            <boxGeometry args={[width * 0.45, 0.5, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Indoor plant */}
          <group position={[width * 0.38, 0, depth * 0.35]}>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.15, 0.12, 0.4, 12]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.25, 12, 12]} />
              <meshStandardMaterial color="#228b22" />
            </mesh>
          </group>
        </group>
      );

    case 'dining':
      return (
        <group>
          {/* Table */}
          <mesh position={[0, 0.38, 0]} castShadow>
            <boxGeometry args={[width * 0.5, 0.04, depth * 0.4]} />
            <meshStandardMaterial color="#8b6914" />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.2, 0.19, dz * depth * 0.16]}>
              <boxGeometry args={[0.04, 0.38, 0.04]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
          ))}
          {/* Chairs with cushions */}
          {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz], i) => (
            <group key={`chair-${i}`} position={[dx * width * 0.35, 0, dz * depth * 0.32]}>
              <mesh position={[0, 0.22, 0]} castShadow>
                <boxGeometry args={[0.38, 0.03, 0.38]} />
                <meshStandardMaterial color="#6b4423" />
              </mesh>
              <mesh position={[0, 0.26, 0]}>
                <boxGeometry args={[0.32, 0.04, 0.32]} />
                <meshStandardMaterial color="#c49a6c" />
              </mesh>
              <mesh position={[0, 0.48, dz === 0 ? 0.16 * (dx || 1) : 0.16 * dz]}>
                <boxGeometry args={[0.38, 0.48, 0.03]} />
                <meshStandardMaterial color="#6b4423" />
              </mesh>
              {[[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].map(([lx, lz], li) => (
                <mesh key={li} position={[lx, 0.11, lz]}>
                  <boxGeometry args={[0.03, 0.22, 0.03]} />
                  <meshStandardMaterial color="#5c4033" />
                </mesh>
              ))}
            </group>
          ))}
          {/* Centerpiece */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 0.15, 12]} />
            <meshStandardMaterial color="#4a90a4" />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#228b22" />
          </mesh>
        </group>
      );

    case 'garage':
      return (
        <group>
          {/* Car body */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[width * 0.5, 0.7, depth * 0.7]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          {/* Car cabin/roof */}
          <mesh position={[0, 0.95, -depth * 0.05]}>
            <boxGeometry args={[width * 0.42, 0.4, depth * 0.4]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          {/* Windshield */}
          <mesh position={[0, 0.9, -depth * 0.18]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[width * 0.38, 0.3, 0.02]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} />
          </mesh>
          {/* Headlights */}
          {[-1, 1].map((dx, i) => (
            <mesh key={i} position={[dx * width * 0.18, 0.5, -depth * 0.36]}>
              <boxGeometry args={[0.12, 0.08, 0.02]} />
              <meshStandardMaterial color="#ffeaa7" emissive="#ffeaa7" emissiveIntensity={0.3} />
            </mesh>
          ))}
          {/* Wheels */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <group key={i}>
              <mesh position={[dx * width * 0.22, 0.2, dz * depth * 0.25]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
              <mesh position={[dx * width * 0.22, 0.2, dz * depth * 0.25]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Tool rack on wall */}
          <mesh position={[-width * 0.42, 1.2, 0]}>
            <boxGeometry args={[0.1, 0.8, depth * 0.5]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </group>
      );

    case 'balcony':
      // Railings are now handled by the wall system, just add furniture
      return (
        <group>
          {/* Potted plants along the edges */}
          {[[-width * 0.35, -depth * 0.3], [width * 0.35, -depth * 0.3], [-width * 0.35, depth * 0.3], [width * 0.35, depth * 0.3]].map(([px, pz], i) => (
            <group key={`plant-${i}`} position={[px, 0, pz]}>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.12, 0.1, 0.3, 12]} />
                <meshStandardMaterial color="#8b4513" />
              </mesh>
              <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshStandardMaterial color="#228b22" />
              </mesh>
            </group>
          ))}
          {/* Outdoor chair */}
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.5, 0.04, 0.5]} />
              <meshStandardMaterial color="#deb887" />
            </mesh>
            <mesh position={[0, 0.4, 0.22]}>
              <boxGeometry args={[0.5, 0.38, 0.04]} />
              <meshStandardMaterial color="#deb887" />
            </mesh>
            {/* Chair legs */}
            {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([lx, lz], li) => (
              <mesh key={li} position={[lx, 0.1, lz]}>
                <boxGeometry args={[0.03, 0.2, 0.03]} />
                <meshStandardMaterial color="#c4a574" />
              </mesh>
            ))}
          </group>
          {/* Small side table */}
          <group position={[width * 0.2, 0, 0]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
              <meshStandardMaterial color="#6b4423" />
            </mesh>
          </group>
        </group>
      );

    case 'garden':
      return (
        <group>
          {/* Grass patches with varying heights */}
          {Array.from({ length: 8 }).map((_, i) => {
            const px = (Math.random() - 0.5) * width * 0.8;
            const pz = (Math.random() - 0.5) * depth * 0.8;
            return (
              <mesh key={`grass-${i}`} position={[px, 0.03, pz]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
                <circleGeometry args={[0.15 + Math.random() * 0.1, 8]} />
                <meshStandardMaterial color={`hsl(${100 + Math.random() * 30}, ${50 + Math.random() * 20}%, ${35 + Math.random() * 15}%)`} />
              </mesh>
            );
          })}
          {/* Trees/bushes */}
          {[[-width * 0.3, -depth * 0.3], [width * 0.3, depth * 0.25], [-width * 0.25, depth * 0.3]].map(([tx, tz], i) => (
            <group key={`tree-${i}`} position={[tx, 0, tz]}>
              {/* Trunk */}
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.6, 8]} />
                <meshStandardMaterial color="#8b4513" />
              </mesh>
              {/* Foliage layers */}
              <mesh position={[0, 0.7, 0]}>
                <sphereGeometry args={[0.35, 8, 8]} />
                <meshStandardMaterial color="#228b22" />
              </mesh>
              <mesh position={[0, 0.95, 0]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshStandardMaterial color="#2e8b2e" />
              </mesh>
            </group>
          ))}
          {/* Flower beds */}
          <mesh position={[width * 0.25, 0.08, -depth * 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.5, 0.4, 0.12]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Flowers */}
          {[[-0.1, 0], [0.1, 0], [0, 0.1], [0, -0.1]].map(([fx, fz], i) => (
            <mesh key={`flower-${i}`} position={[width * 0.25 + fx, 0.2, -depth * 0.3 + fz]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshStandardMaterial color={['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff'][i]} />
            </mesh>
          ))}
          {/* Stone path */}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={`stone-${i}`} position={[0, 0.02, -depth * 0.35 + i * 0.35]} rotation={[-Math.PI / 2, 0, Math.random() * 0.3]}>
              <circleGeometry args={[0.12, 6]} />
              <meshStandardMaterial color="#808080" />
            </mesh>
          ))}
        </group>
      );

    case 'pooja':
      return (
        <group>
          {/* Wooden platform/mandir */}
          <mesh position={[0, 0.5, -depth * 0.3]} castShadow>
            <boxGeometry args={[width * 0.6, 1.0, 0.5]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Decorative top */}
          <mesh position={[0, 1.1, -depth * 0.3]}>
            <boxGeometry args={[width * 0.65, 0.15, 0.55]} />
            <meshStandardMaterial color="#a0522d" />
          </mesh>
          {/* Temple dome shape */}
          <mesh position={[0, 1.4, -depth * 0.3]}>
            <coneGeometry args={[0.25, 0.4, 8]} />
            <meshStandardMaterial color="#d4af37" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Deity space */}
          <mesh position={[0, 0.7, -depth * 0.25]}>
            <boxGeometry args={[0.3, 0.4, 0.02]} />
            <meshStandardMaterial color="#ffd700" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Diyas (oil lamps) */}
          {[-0.25, 0.25].map((dx, i) => (
            <group key={`diya-${i}`} position={[dx, 0.55, -depth * 0.15]}>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.03, 12]} />
                <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Flame */}
              <mesh position={[0, 0.05, 0]}>
                <coneGeometry args={[0.015, 0.04, 8]} />
                <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))}
          {/* Incense holder */}
          <mesh position={[0, 0.55, -depth * 0.1]}>
            <cylinderGeometry args={[0.03, 0.05, 0.08, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Floor mat */}
          <mesh position={[0, 0.01, depth * 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width * 0.5, 0.4]} />
            <meshStandardMaterial color="#8b0000" />
          </mesh>
        </group>
      );

    case 'study':
      return (
        <group>
          {/* Desk */}
          <mesh position={[0, 0.38, -depth * 0.3]} castShadow>
            <boxGeometry args={[width * 0.6, 0.04, 0.6]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Desk legs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.27, 0.19, -depth * 0.3 + dz * 0.25]}>
              <boxGeometry args={[0.04, 0.38, 0.04]} />
              <meshStandardMaterial color="#4a3728" />
            </mesh>
          ))}
          {/* Office chair */}
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.03, 0.15, 0.25, 8]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <boxGeometry args={[0.45, 0.08, 0.45]} />
              <meshStandardMaterial color="#1f1f1f" />
            </mesh>
            <mesh position={[0, 0.65, 0.18]}>
              <boxGeometry args={[0.45, 0.5, 0.08]} />
              <meshStandardMaterial color="#1f1f1f" />
            </mesh>
          </group>
          {/* Monitor */}
          <mesh position={[0, 0.65, -depth * 0.4]}>
            <boxGeometry args={[0.6, 0.4, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 0.45, -depth * 0.38]}>
            <boxGeometry args={[0.15, 0.1, 0.1]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
          {/* Keyboard */}
          <mesh position={[0, 0.41, -depth * 0.2]}>
            <boxGeometry args={[0.4, 0.02, 0.15]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
          {/* Bookshelf */}
          <mesh position={[-width * 0.4, 0.8, 0]} castShadow>
            <boxGeometry args={[0.3, 1.6, depth * 0.4]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          {/* Books */}
          {[0.2, 0.5, 0.8, 1.1].map((by, i) => (
            <mesh key={i} position={[-width * 0.4, by, 0]}>
              <boxGeometry args={[0.25, 0.2, depth * 0.35]} />
              <meshStandardMaterial color={['#c0392b', '#2980b9', '#27ae60', '#8e44ad'][i]} />
            </mesh>
          ))}
        </group>
      );

    case 'utility':
      return (
        <group>
          {/* Washing machine */}
          <mesh position={[-width * 0.25, 0.45, -depth * 0.3]} castShadow>
            <boxGeometry args={[0.6, 0.9, 0.6]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          {/* Washing machine door */}
          <mesh position={[-width * 0.25, 0.5, -depth * 0.3 + 0.31]}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 24]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} />
          </mesh>
          {/* Dryer */}
          <mesh position={[width * 0.25, 0.45, -depth * 0.3]} castShadow>
            <boxGeometry args={[0.6, 0.9, 0.6]} />
            <meshStandardMaterial color="#d0d0d0" />
          </mesh>
          {/* Utility sink */}
          <mesh position={[0, 0.45, depth * 0.25]}>
            <boxGeometry args={[0.6, 0.9, 0.5]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>
          <mesh position={[0, 0.85, depth * 0.25]}>
            <boxGeometry args={[0.5, 0.2, 0.4]} />
            <meshStandardMaterial color="#c0c0c0" />
          </mesh>
          {/* Shelving */}
          <mesh position={[width * 0.35, 1.2, 0]}>
            <boxGeometry args={[0.4, 0.04, depth * 0.4]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[width * 0.35, 1.6, 0]}>
            <boxGeometry args={[0.4, 0.04, depth * 0.4]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Cleaning supplies */}
          <mesh position={[width * 0.35, 1.35, 0]}>
            <boxGeometry args={[0.15, 0.25, 0.1]} />
            <meshStandardMaterial color="#3498db" />
          </mesh>
        </group>
      );

    case 'store':
      return (
        <group>
          {/* Storage shelves */}
          {[-0.25, 0, 0.25].map((dz, i) => (
            <group key={`shelf-unit-${i}`} position={[-width * 0.35, 0, dz * depth]}>
              {/* Vertical supports */}
              {[-1, 1].map((dx, j) => (
                <mesh key={j} position={[dx * 0.2, 1.0, 0]}>
                  <boxGeometry args={[0.04, 2.0, 0.04]} />
                  <meshStandardMaterial color="#6b6b6b" metalness={0.5} roughness={0.5} />
                </mesh>
              ))}
              {/* Shelves */}
              {[0.4, 0.9, 1.4, 1.9].map((sy, k) => (
                <mesh key={k} position={[0, sy, 0]}>
                  <boxGeometry args={[0.45, 0.03, 0.35]} />
                  <meshStandardMaterial color="#808080" />
                </mesh>
              ))}
            </group>
          ))}
          {/* Boxes on shelves */}
          {[
            [-width * 0.35, 0.55, -depth * 0.25],
            [-width * 0.35, 1.05, 0],
            [-width * 0.35, 1.55, depth * 0.25],
          ].map(([bx, by, bz], i) => (
            <mesh key={`box-${i}`} position={[bx, by, bz]}>
              <boxGeometry args={[0.3, 0.25, 0.25]} />
              <meshStandardMaterial color={['#c49a6c', '#8b7355', '#a0522d'][i]} />
            </mesh>
          ))}
          {/* Large storage bins */}
          <mesh position={[width * 0.2, 0.25, 0]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.4]} />
            <meshStandardMaterial color="#4a90a4" />
          </mesh>
        </group>
      );

    case 'wardrobe':
      return (
        <group>
          {/* Built-in wardrobe */}
          <mesh position={[0, 1.1, -depth * 0.35]} castShadow>
            <boxGeometry args={[width * 0.8, 2.2, 0.55]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          {/* Wardrobe doors */}
          {[-0.25, 0.25].map((dx, i) => (
            <mesh key={i} position={[dx * width, 1.1, -depth * 0.35 + 0.28]}>
              <boxGeometry args={[width * 0.38, 2.15, 0.02]} />
              <meshStandardMaterial color="#8b6914" />
            </mesh>
          ))}
          {/* Door handles */}
          {[-0.05, 0.05].map((dx, i) => (
            <mesh key={`handle-${i}`} position={[dx * width, 1.1, -depth * 0.35 + 0.3]}>
              <boxGeometry args={[0.02, 0.15, 0.02]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Mirror */}
          <mesh position={[width * 0.35, 1.2, depth * 0.2]} rotation={[0, 0.1, 0]}>
            <boxGeometry args={[0.02, 1.6, 0.5]} />
            <meshStandardMaterial color="#b8d4e8" metalness={0.8} roughness={0.1} />
          </mesh>
          {/* Dresser */}
          <mesh position={[-width * 0.3, 0.35, depth * 0.2]} castShadow>
            <boxGeometry args={[0.5, 0.7, 0.4]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Dresser drawers */}
          {[0.15, 0.4, 0.55].map((dy, i) => (
            <mesh key={i} position={[-width * 0.3, dy, depth * 0.2 + 0.21]}>
              <boxGeometry args={[0.45, 0.18, 0.02]} />
              <meshStandardMaterial color="#6b4423" />
            </mesh>
          ))}
        </group>
      );

    case 'hallway':
      return (
        <group>
          {/* Console table */}
          <mesh position={[-width * 0.35, 0.4, 0]} castShadow>
            <boxGeometry args={[0.4, 0.04, 0.25]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[-width * 0.35 + dx * 0.15, 0.2, dz * 0.1]}>
              <boxGeometry args={[0.03, 0.4, 0.03]} />
              <meshStandardMaterial color="#4a3728" />
            </mesh>
          ))}
          {/* Decorative vase */}
          <mesh position={[-width * 0.35, 0.55, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 0.2, 12]} />
            <meshStandardMaterial color="#4a90a4" />
          </mesh>
          {/* Wall art */}
          <mesh position={[-width * 0.35, 1.3, -depth * 0.45]}>
            <boxGeometry args={[0.4, 0.3, 0.02]} />
            <meshStandardMaterial color="#d4a574" />
          </mesh>
        </group>
      );

    case 'staircase':
      return (
        <group>
          {/* Stair steps */}
          {Array.from({ length: Math.min(10, Math.floor(depth / 0.3)) }).map((step, i) => (
            <mesh key={i} position={[0, 0.1 + i * 0.2, -depth * 0.4 + i * 0.25]} castShadow>
              <boxGeometry args={[width * 0.8, 0.15, 0.28]} />
              <meshStandardMaterial color="#8b7355" />
            </mesh>
          ))}
          {/* Handrail */}
          {[-1, 1].map((side) => (
            <group key={`rail-${side}`}>
              {/* Vertical posts */}
              {[0, 3, 6, 9].map((i) => (
                <mesh key={i} position={[side * width * 0.42, 0.6 + i * 0.2, -depth * 0.4 + i * 0.25]}>
                  <boxGeometry args={[0.04, 0.6, 0.04]} />
                  <meshStandardMaterial color="#5c4033" />
                </mesh>
              ))}
              {/* Rail */}
              <mesh 
                position={[side * width * 0.42, 1.0, 0]} 
                rotation={[Math.atan2(2.0, depth * 0.8), 0, 0]}
              >
                <boxGeometry args={[0.06, 0.04, Math.sqrt(depth * depth * 0.64 + 4)]} />
                <meshStandardMaterial color="#6b4423" />
              </mesh>
            </group>
          ))}
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
  const [debugMode, setDebugMode] = useState(false);
  const cameraDistance = Math.max(plotWidth, plotLength) * SCALE * 1.5;
  
  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-sky-200 to-sky-400 rounded-lg overflow-hidden relative">
      <DebugContext.Provider value={{ debugMode }}>
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
      </DebugContext.Provider>
      
      {/* Debug toggle */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        className={`absolute top-3 right-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          debugMode 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-background/80 text-foreground hover:bg-background'
        } backdrop-blur-sm`}
      >
        {debugMode ? '🔍 Debug ON' : '🔍 Debug'}
      </button>
      
      {/* Debug legend */}
      {debugMode && (
        <div className="absolute top-12 right-3 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs space-y-1">
          <div className="font-medium text-foreground mb-1">Wall Types:</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: DEBUG_COLORS.exterior }} />
            <span className="text-muted-foreground">Exterior</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: DEBUG_COLORS.sharedOwned }} />
            <span className="text-muted-foreground">Shared (owner)</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-muted-foreground">
        Drag to rotate • Scroll to zoom • Shift+Drag to pan
      </div>
    </div>
  );
};

export default FloorPlan3DViewer;
