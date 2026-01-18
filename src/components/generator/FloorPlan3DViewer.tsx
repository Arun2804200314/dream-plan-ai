import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text, useTexture } from '@react-three/drei';
import { Room, GeneratedLayout, RoomType, ROOM_COLORS } from '@/types/floorPlan';
import * as THREE from 'three';

const WALL_HEIGHT = 3; // meters
const WALL_THICKNESS = 0.15; // meters
const SCALE = 0.3048; // feet to meters

// Convert HSL string to THREE color
const parseColor = (color: string): string => {
  if (color.startsWith('hsl')) {
    return color;
  }
  return color;
};

// Room materials based on type
const getRoomMaterial = (type: RoomType) => {
  const colors: Record<RoomType, { floor: string; wall: string }> = {
    bedroom: { floor: '#d4c4e0', wall: '#f5f0fa' },
    bathroom: { floor: '#b8d4e3', wall: '#e8f4fc' },
    kitchen: { floor: '#e8d4a8', wall: '#faf5e8' },
    living: { floor: '#c8e0c8', wall: '#f0faf0' },
    dining: { floor: '#e0d0b8', wall: '#faf5e8' },
    garage: { floor: '#a0a0a0', wall: '#d0d0d0' },
    balcony: { floor: '#c8d8a8', wall: '#e8f0d8' },
    garden: { floor: '#90c890', wall: '#d0f0d0' },
    hallway: { floor: '#d8d8d8', wall: '#f0f0f0' },
    staircase: { floor: '#b0b0b0', wall: '#e0e0e0' },
    pooja: { floor: '#e8d090', wall: '#faf0d0' },
    study: { floor: '#b8c8e0', wall: '#e8f0fa' },
  };
  return colors[type] || { floor: '#d0d0d0', wall: '#f0f0f0' };
};

interface WallProps {
  start: [number, number];
  end: [number, number];
  height: number;
  thickness: number;
  color: string;
  hasDoor?: boolean;
  hasWindow?: boolean;
  doorOffset?: number;
  windowOffset?: number;
}

function Wall({ start, end, height, thickness, color, hasDoor, hasWindow, doorOffset = 0.3, windowOffset = 0.5 }: WallProps) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  const doorWidth = 0.9;
  const doorHeight = 2.1;
  const windowWidth = 1.2;
  const windowHeight = 1.2;
  const windowBottom = 1.0;
  
  if (hasDoor) {
    const doorStart = length * doorOffset;
    const doorEnd = doorStart + doorWidth;
    
    return (
      <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
        {/* Wall before door */}
        {doorStart > 0.1 && (
          <mesh position={[-(length/2) + doorStart/2, height/2, 0]}>
            <boxGeometry args={[doorStart, height, thickness]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
        {/* Wall above door */}
        <mesh position={[-(length/2) + doorStart + doorWidth/2, height - (height - doorHeight)/2, 0]}>
          <boxGeometry args={[doorWidth, height - doorHeight, thickness]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Wall after door */}
        {length - doorEnd > 0.1 && (
          <mesh position={[(length/2) - (length - doorEnd)/2, height/2, 0]}>
            <boxGeometry args={[length - doorEnd, height, thickness]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
        {/* Door frame */}
        <mesh position={[-(length/2) + doorStart + doorWidth/2, doorHeight/2, 0]}>
          <boxGeometry args={[doorWidth + 0.05, doorHeight + 0.05, thickness + 0.02]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>
      </group>
    );
  }
  
  if (hasWindow) {
    const windowStart = length * windowOffset - windowWidth/2;
    const windowEnd = windowStart + windowWidth;
    
    return (
      <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
        {/* Wall before window */}
        {windowStart > 0.1 && (
          <mesh position={[-(length/2) + windowStart/2, height/2, 0]}>
            <boxGeometry args={[windowStart, height, thickness]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
        {/* Wall below window */}
        <mesh position={[-(length/2) + windowStart + windowWidth/2, windowBottom/2, 0]}>
          <boxGeometry args={[windowWidth, windowBottom, thickness]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Wall above window */}
        <mesh position={[-(length/2) + windowStart + windowWidth/2, windowBottom + windowHeight + (height - windowBottom - windowHeight)/2, 0]}>
          <boxGeometry args={[windowWidth, height - windowBottom - windowHeight, thickness]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Wall after window */}
        {length - windowEnd > 0.1 && (
          <mesh position={[(length/2) - (length - windowEnd)/2, height/2, 0]}>
            <boxGeometry args={[length - windowEnd, height, thickness]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
        {/* Window frame */}
        <mesh position={[-(length/2) + windowStart + windowWidth/2, windowBottom + windowHeight/2, 0]}>
          <boxGeometry args={[windowWidth + 0.05, windowHeight + 0.05, thickness + 0.02]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
        </mesh>
      </group>
    );
  }
  
  return (
    <mesh position={[midX, height/2, midZ]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[length, height, thickness]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

interface Room3DProps {
  room: Room;
  plotWidth: number;
  plotLength: number;
  floorHeight: number;
}

function Room3D({ room, plotWidth, plotLength, floorHeight }: Room3DProps) {
  const materials = getRoomMaterial(room.type);
  
  // Convert to meters and center
  const x = (room.x - plotLength / 2) * SCALE;
  const z = (room.y - plotWidth / 2) * SCALE;
  const width = room.width * SCALE;
  const depth = room.height * SCALE;
  const baseY = (room.floor - 1) * floorHeight;
  
  // Check for doors/windows
  const hasDoor = room.doors && room.doors.length > 0;
  const hasWindow = room.windows && room.windows.length > 0;
  const doorPositions = room.doors?.map(d => d.position) || [];
  const windowPositions = room.windows?.map(w => w.position) || [];
  
  return (
    <group position={[x + width/2, baseY, z + depth/2]}>
      {/* Floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={materials.floor} />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, floorHeight - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Walls */}
      {/* Front wall (negative Z) */}
      <Wall
        start={[-width/2, -depth/2]}
        end={[width/2, -depth/2]}
        height={floorHeight}
        thickness={WALL_THICKNESS}
        color={materials.wall}
        hasDoor={doorPositions.includes('top')}
        hasWindow={windowPositions.includes('top')}
      />
      
      {/* Back wall (positive Z) */}
      <Wall
        start={[-width/2, depth/2]}
        end={[width/2, depth/2]}
        height={floorHeight}
        thickness={WALL_THICKNESS}
        color={materials.wall}
        hasDoor={doorPositions.includes('bottom')}
        hasWindow={windowPositions.includes('bottom')}
      />
      
      {/* Left wall (negative X) */}
      <Wall
        start={[-width/2, -depth/2]}
        end={[-width/2, depth/2]}
        height={floorHeight}
        thickness={WALL_THICKNESS}
        color={materials.wall}
        hasDoor={doorPositions.includes('left')}
        hasWindow={windowPositions.includes('left')}
      />
      
      {/* Right wall (positive X) */}
      <Wall
        start={[width/2, -depth/2]}
        end={[width/2, depth/2]}
        height={floorHeight}
        thickness={WALL_THICKNESS}
        color={materials.wall}
        hasDoor={doorPositions.includes('right')}
        hasWindow={windowPositions.includes('right')}
      />
      
      {/* Room label floating above */}
      <Text
        position={[0, floorHeight + 0.5, 0]}
        fontSize={0.5}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
      
      {/* Add furniture placeholders based on room type */}
      <RoomFurniture type={room.type} width={width} depth={depth} />
    </group>
  );
}

function RoomFurniture({ type, width, depth }: { type: RoomType; width: number; depth: number }) {
  switch (type) {
    case 'bedroom':
      return (
        <group>
          {/* Bed */}
          <mesh position={[0, 0.25, depth * 0.1]} castShadow>
            <boxGeometry args={[width * 0.5, 0.5, depth * 0.6]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          {/* Headboard */}
          <mesh position={[0, 0.6, depth * 0.35]}>
            <boxGeometry args={[width * 0.5, 0.7, 0.05]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          {/* Pillows */}
          <mesh position={[-width * 0.12, 0.55, depth * 0.25]}>
            <boxGeometry args={[0.4, 0.1, 0.3]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[width * 0.12, 0.55, depth * 0.25]}>
            <boxGeometry args={[0.4, 0.1, 0.3]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      );
    case 'bathroom':
      return (
        <group>
          {/* Toilet */}
          <mesh position={[-width * 0.3, 0.25, -depth * 0.3]}>
            <boxGeometry args={[0.4, 0.5, 0.5]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Shower area */}
          <mesh position={[width * 0.25, 0.01, depth * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width * 0.4, depth * 0.4]} />
            <meshStandardMaterial color="#d0d8e0" />
          </mesh>
        </group>
      );
    case 'kitchen':
      return (
        <group>
          {/* Counter */}
          <mesh position={[0, 0.45, -depth * 0.35]} castShadow>
            <boxGeometry args={[width * 0.9, 0.9, 0.6]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          {/* Counter top */}
          <mesh position={[0, 0.92, -depth * 0.35]}>
            <boxGeometry args={[width * 0.92, 0.04, 0.65]} />
            <meshStandardMaterial color="#d0d0d0" />
          </mesh>
        </group>
      );
    case 'living':
      return (
        <group>
          {/* Sofa */}
          <mesh position={[0, 0.25, depth * 0.2]} castShadow>
            <boxGeometry args={[width * 0.6, 0.5, 0.8]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Sofa back */}
          <mesh position={[0, 0.55, depth * 0.35]}>
            <boxGeometry args={[width * 0.6, 0.6, 0.15]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Coffee table */}
          <mesh position={[0, 0.2, -depth * 0.15]}>
            <boxGeometry args={[0.8, 0.4, 0.5]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
        </group>
      );
    case 'dining':
      return (
        <group>
          {/* Table */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[width * 0.5, 0.05, depth * 0.4]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          {/* Table legs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.2, 0.2, dz * depth * 0.15]}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          ))}
          {/* Chairs */}
          {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz], i) => (
            <mesh key={`chair-${i}`} position={[dx * width * 0.35, 0.25, dz * depth * 0.3]}>
              <boxGeometry args={[0.35, 0.5, 0.35]} />
              <meshStandardMaterial color="#6b4423" />
            </mesh>
          ))}
        </group>
      );
    case 'garage':
      return (
        <group>
          {/* Car placeholder */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[width * 0.5, 1, depth * 0.7]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {/* Wheels */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx * width * 0.2, 0.2, dz * depth * 0.25]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

interface RoofProps {
  plotWidth: number;
  plotLength: number;
  floors: number;
}

function Roof({ plotWidth, plotLength, floors }: RoofProps) {
  const width = plotLength * SCALE;
  const depth = plotWidth * SCALE;
  const height = floors * WALL_HEIGHT;
  const roofHeight = Math.min(width, depth) * 0.2;
  
  const roofShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2 - 0.3, -depth/2 - 0.3);
    shape.lineTo(width/2 + 0.3, -depth/2 - 0.3);
    shape.lineTo(width/2 + 0.3, depth/2 + 0.3);
    shape.lineTo(-width/2 - 0.3, depth/2 + 0.3);
    shape.lineTo(-width/2 - 0.3, -depth/2 - 0.3);
    return shape;
  }, [width, depth]);
  
  return (
    <group position={[0, height, 0]}>
      {/* Flat roof with slight elevation */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[roofShape]} />
        <meshStandardMaterial color="#8b4513" side={THREE.DoubleSide} />
      </mesh>
      {/* Roof edge */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[width + 0.6, 0.1, depth + 0.6]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
}

function Ground({ plotWidth, plotLength }: { plotWidth: number; plotLength: number }) {
  const width = plotLength * SCALE;
  const depth = plotWidth * SCALE;
  
  return (
    <group>
      {/* Surrounding ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[width + 10, depth + 10]} />
        <meshStandardMaterial color="#90a959" />
      </mesh>
      
      {/* Plot boundary */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width + 1, depth + 1]} />
        <meshStandardMaterial color="#d4c4a8" />
      </mesh>
      
      {/* Plot edge markers */}
      <lineSegments position={[0, 0.01, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, depth)]} />
        <lineBasicMaterial color="#475569" />
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
        />
      ))}
      
      {/* Roof */}
      <Roof plotWidth={plotWidth} plotLength={plotLength} floors={floors} />
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
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[20, 30, 20]} 
            intensity={1.2} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <directionalLight position={[-10, 20, -10]} intensity={0.3} />
          <hemisphereLight args={['#87ceeb', '#90a959', 0.4]} />
          
          <Building 
            layout={layout} 
            plotWidth={plotWidth} 
            plotLength={plotLength}
            floors={floors}
          />
          
          {/* Sky */}
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg text-xs text-muted-foreground shadow-lg">
        <span className="font-medium">Controls:</span> Drag to rotate • Scroll to zoom • Right-click drag to pan
      </div>
      
      {/* Floor indicator */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm shadow-lg">
        <span className="text-muted-foreground">Floors: </span>
        <span className="font-bold text-foreground">{floors}</span>
      </div>
    </div>
  );
};

export default FloorPlan3DViewer;
