import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text } from '@react-three/drei';
import { Room, GeneratedLayout } from '@/types/floorPlan';
import * as THREE from 'three';

interface Room3DProps {
  room: Room;
  scale: number;
  plotWidth: number;
  plotLength: number;
  wallHeight: number;
}

function Room3D({ room, scale, plotWidth, plotLength, wallHeight }: Room3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Center the room positions
  const x = (room.x + room.width / 2 - plotLength / 2) * scale;
  const z = (room.y + room.height / 2 - plotWidth / 2) * scale;
  const width = room.width * scale;
  const depth = room.height * scale;
  const height = wallHeight * (room.floor || 1);

  // Parse HSL color or use default
  const getColor = () => {
    const colorMap: Record<string, string> = {
      bedroom: '#c4b5fd',
      bathroom: '#93c5fd',
      kitchen: '#fcd34d',
      living: '#86efac',
      dining: '#fbbf24',
      garage: '#9ca3af',
      balcony: '#a3e635',
      garden: '#4ade80',
      hallway: '#e5e5e5',
    };
    return colorMap[room.type] || '#d1d5db';
  };

  return (
    <group position={[x, height / 2, z]}>
      {/* Room floor */}
      <mesh position={[0, -height / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={getColor()} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Room walls (transparent) */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={getColor()} 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Room label */}
      <Text
        position={[0, height / 2 + 0.3, 0]}
        fontSize={0.4}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {room.name}
      </Text>
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
  const scale = 0.1;
  const wallHeight = 0.8;

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[plotLength * scale + 2, plotWidth * scale + 2]} />
        <meshStandardMaterial color="#f0fdf4" />
      </mesh>
      
      {/* Plot boundary */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[plotLength * scale, plotWidth * scale]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Plot border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(plotLength * scale, plotWidth * scale)]} />
        <lineBasicMaterial color="#475569" linewidth={2} />
      </lineSegments>
      
      {/* Rooms */}
      {layout.rooms.map((room) => (
        <Room3D
          key={room.id}
          room={room}
          scale={scale}
          plotWidth={plotWidth}
          plotLength={plotLength}
          wallHeight={wallHeight}
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
  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-muted/20 to-muted/40 rounded-lg overflow-hidden">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
          <OrbitControls 
            enablePan 
            enableZoom 
            enableRotate
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.1}
          />
          
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 15, 10]} 
            intensity={1} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, 10, -10]} intensity={0.3} />
          
          <Building 
            layout={layout} 
            plotWidth={plotWidth} 
            plotLength={plotLength}
            floors={floors}
          />
          
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded text-xs text-muted-foreground">
        Drag to rotate • Scroll to zoom • Shift+drag to pan
      </div>
    </div>
  );
};

export default FloorPlan3DViewer;
