import { Room, Furniture, Door, Window, ROOM_COLORS, RoomType } from '@/types/floorPlan';

interface RoomSVGProps {
  room: Room;
  scale: number;
  zoom: number;
  wallThickness: number;
  allRooms: Room[];
  isInterior?: (side: 'top' | 'bottom' | 'left' | 'right') => boolean;
}

// Furniture icons as SVG paths
const FurnitureIcon = ({ type, x, y, width, height, rotation = 0 }: {
  type: Furniture['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}) => {
  const transform = `translate(${x}, ${y}) rotate(${rotation}, ${width/2}, ${height/2})`;
  
  switch (type) {
    case 'bed':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={0} width={width} height={height} fill="none" stroke="currentColor" strokeWidth={1} />
          <rect x={2} y={2} width={width - 4} height={height * 0.3} fill="currentColor" opacity={0.3} rx={2} />
          <rect x={2} y={height * 0.35} width={width - 4} height={height * 0.6} fill="none" stroke="currentColor" strokeWidth={0.5} />
        </g>
      );
    case 'sofa':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={height * 0.2} width={width} height={height * 0.8} fill="none" stroke="currentColor" strokeWidth={1} rx={2} />
          <rect x={2} y={0} width={width - 4} height={height * 0.3} fill="currentColor" opacity={0.3} rx={2} />
        </g>
      );
    case 'dining-table':
      return (
        <g transform={transform} className="text-foreground/60">
          <ellipse cx={width/2} cy={height/2} rx={width/2 - 2} ry={height/2 - 2} fill="none" stroke="currentColor" strokeWidth={1} />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle
              key={angle}
              cx={width/2 + Math.cos(angle * Math.PI / 180) * (width/2 + 3)}
              cy={height/2 + Math.sin(angle * Math.PI / 180) * (height/2 + 3)}
              r={3}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5}
            />
          ))}
        </g>
      );
    case 'kitchen-counter':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={0} width={width} height={height} fill="none" stroke="currentColor" strokeWidth={1} />
          <circle cx={width * 0.25} cy={height/2} r={Math.min(width, height) * 0.15} fill="none" stroke="currentColor" strokeWidth={0.5} />
          <circle cx={width * 0.5} cy={height/2} r={Math.min(width, height) * 0.15} fill="none" stroke="currentColor" strokeWidth={0.5} />
          <rect x={width * 0.7} y={height * 0.2} width={width * 0.25} height={height * 0.6} fill="none" stroke="currentColor" strokeWidth={0.5} />
        </g>
      );
    case 'toilet':
      return (
        <g transform={transform} className="text-foreground/60">
          <ellipse cx={width/2} cy={height * 0.6} rx={width/2 - 2} ry={height * 0.35} fill="none" stroke="currentColor" strokeWidth={1} />
          <rect x={width * 0.2} y={0} width={width * 0.6} height={height * 0.3} fill="none" stroke="currentColor" strokeWidth={1} rx={2} />
        </g>
      );
    case 'shower':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={0} width={width} height={height} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="4,2" />
          <circle cx={width/2} cy={height * 0.3} r={3} fill="currentColor" opacity={0.5} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={width/2 - 3 + i * 3} y1={height * 0.4} x2={width/2 - 3 + i * 3} y2={height * 0.6} stroke="currentColor" strokeWidth={0.5} />
          ))}
        </g>
      );
    case 'sink':
      return (
        <g transform={transform} className="text-foreground/60">
          <ellipse cx={width/2} cy={height/2} rx={width/2 - 2} ry={height/2 - 2} fill="none" stroke="currentColor" strokeWidth={1} />
          <circle cx={width/2} cy={height/2} r={2} fill="currentColor" opacity={0.5} />
        </g>
      );
    case 'wardrobe':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={0} width={width} height={height} fill="none" stroke="currentColor" strokeWidth={1} />
          <line x1={width/2} y1={0} x2={width/2} y2={height} stroke="currentColor" strokeWidth={0.5} />
          <circle cx={width * 0.25} cy={height/2} r={1.5} fill="currentColor" />
          <circle cx={width * 0.75} cy={height/2} r={1.5} fill="currentColor" />
        </g>
      );
    case 'desk':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={0} width={width} height={height} fill="none" stroke="currentColor" strokeWidth={1} />
          <rect x={width * 0.3} y={height * 0.1} width={width * 0.4} height={height * 0.3} fill="none" stroke="currentColor" strokeWidth={0.5} />
          <ellipse cx={width/2} cy={height * 0.75} rx={width * 0.2} ry={height * 0.15} fill="none" stroke="currentColor" strokeWidth={0.5} />
        </g>
      );
    case 'car':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={width * 0.1} y={0} width={width * 0.8} height={height} fill="none" stroke="currentColor" strokeWidth={1} rx={4} />
          <rect x={width * 0.2} y={height * 0.1} width={width * 0.6} height={height * 0.25} fill="none" stroke="currentColor" strokeWidth={0.5} rx={2} />
          <circle cx={width * 0.25} cy={height * 0.85} r={width * 0.1} fill="none" stroke="currentColor" strokeWidth={1} />
          <circle cx={width * 0.75} cy={height * 0.85} r={width * 0.1} fill="none" stroke="currentColor" strokeWidth={1} />
        </g>
      );
    case 'plants':
      return (
        <g transform={transform} className="text-foreground/60">
          <circle cx={width/2} cy={height/2} r={Math.min(width, height)/2 - 2} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="2,2" />
        </g>
      );
    case 'tv':
      return (
        <g transform={transform} className="text-foreground/60">
          <rect x={0} y={height * 0.3} width={width} height={height * 0.4} fill="currentColor" opacity={0.3} />
        </g>
      );
    default:
      return null;
  }
};

// Door arc SVG
const DoorSVG = ({ door, roomWidth, roomHeight, scale, zoom, isInteriorWall }: {
  door: Door;
  roomWidth: number;
  roomHeight: number;
  scale: number;
  zoom: number;
  isInteriorWall: boolean;
}) => {
  const doorWidthPx = door.width * scale * zoom;
  const isHorizontal = door.position === 'top' || door.position === 'bottom';
  const wallLength = isHorizontal ? roomWidth : roomHeight;
  const offsetPx = (door.offset / 100) * wallLength * scale * zoom;
  
  let x = 0, y = 0, arcPath = '';
  const arcRadius = doorWidthPx * 0.8;
  
  switch (door.position) {
    case 'top':
      x = offsetPx;
      y = 0;
      arcPath = `M ${x} ${y} L ${x} ${y + arcRadius} A ${arcRadius} ${arcRadius} 0 0 0 ${x + doorWidthPx} ${y}`;
      break;
    case 'bottom':
      x = offsetPx;
      y = roomHeight * scale * zoom;
      arcPath = `M ${x} ${y} L ${x} ${y - arcRadius} A ${arcRadius} ${arcRadius} 0 0 1 ${x + doorWidthPx} ${y}`;
      break;
    case 'left':
      x = 0;
      y = offsetPx;
      arcPath = `M ${x} ${y} L ${x + arcRadius} ${y} A ${arcRadius} ${arcRadius} 0 0 1 ${x} ${y + doorWidthPx}`;
      break;
    case 'right':
      x = roomWidth * scale * zoom;
      y = offsetPx;
      arcPath = `M ${x} ${y} L ${x - arcRadius} ${y} A ${arcRadius} ${arcRadius} 0 0 0 ${x} ${y + doorWidthPx}`;
      break;
  }
  
  return (
    <g className={door.isMain ? "text-primary" : "text-foreground"}>
      <path d={arcPath} fill="none" stroke="currentColor" strokeWidth={door.isMain ? 2 : 1.5} />
      {/* Door opening break in wall */}
      {isHorizontal ? (
        <line x1={x} y1={y} x2={x + doorWidthPx} y2={y} stroke="hsl(var(--background))" strokeWidth={6} />
      ) : (
        <line x1={x} y1={y} x2={x} y2={y + doorWidthPx} stroke="hsl(var(--background))" strokeWidth={6} />
      )}
    </g>
  );
};

// Window mark SVG
const WindowSVG = ({ window, roomWidth, roomHeight, scale, zoom }: {
  window: Window;
  roomWidth: number;
  roomHeight: number;
  scale: number;
  zoom: number;
}) => {
  const windowWidthPx = window.width * scale * zoom;
  const isHorizontal = window.position === 'top' || window.position === 'bottom';
  const wallLength = isHorizontal ? roomWidth : roomHeight;
  const offsetPx = (window.offset / 100) * wallLength * scale * zoom;
  
  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  
  switch (window.position) {
    case 'top':
      x1 = offsetPx; y1 = 0; x2 = offsetPx + windowWidthPx; y2 = 0;
      break;
    case 'bottom':
      x1 = offsetPx; y1 = roomHeight * scale * zoom; x2 = offsetPx + windowWidthPx; y2 = roomHeight * scale * zoom;
      break;
    case 'left':
      x1 = 0; y1 = offsetPx; x2 = 0; y2 = offsetPx + windowWidthPx;
      break;
    case 'right':
      x1 = roomWidth * scale * zoom; y1 = offsetPx; x2 = roomWidth * scale * zoom; y2 = offsetPx + windowWidthPx;
      break;
  }
  
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return (
    <g className="text-primary">
      {/* Window opening */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--background))" strokeWidth={5} />
      {/* Window frame - double lines */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2} />
      {isHorizontal ? (
        <>
          <line x1={x1 + 2} y1={y1 - 2} x2={x2 - 2} y2={y2 - 2} stroke="currentColor" strokeWidth={1} />
          <line x1={x1 + 2} y1={y1 + 2} x2={x2 - 2} y2={y2 + 2} stroke="currentColor" strokeWidth={1} />
          <line x1={midX} y1={y1 - 3} x2={midX} y2={y1 + 3} stroke="currentColor" strokeWidth={1} />
        </>
      ) : (
        <>
          <line x1={x1 - 2} y1={y1 + 2} x2={x2 - 2} y2={y2 - 2} stroke="currentColor" strokeWidth={1} />
          <line x1={x1 + 2} y1={y1 + 2} x2={x2 + 2} y2={y2 - 2} stroke="currentColor" strokeWidth={1} />
          <line x1={x1 - 3} y1={midY} x2={x1 + 3} y2={midY} stroke="currentColor" strokeWidth={1} />
        </>
      )}
    </g>
  );
};

// Check if a wall is shared with another room
const checkAdjacentWall = (room: Room, side: 'top' | 'bottom' | 'left' | 'right', allRooms: Room[]): boolean => {
  const tolerance = 1; // 1 foot tolerance for adjacency
  
  for (const other of allRooms) {
    if (other.id === room.id || other.floor !== room.floor) continue;
    
    switch (side) {
      case 'top':
        // Check if another room is directly above (its bottom edge touches our top edge)
        if (Math.abs((other.y + other.height) - room.y) < tolerance) {
          const overlapStart = Math.max(room.x, other.x);
          const overlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
      case 'bottom':
        // Check if another room is directly below
        if (Math.abs(other.y - (room.y + room.height)) < tolerance) {
          const overlapStart = Math.max(room.x, other.x);
          const overlapEnd = Math.min(room.x + room.width, other.x + other.width);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
      case 'left':
        // Check if another room is directly to the left
        if (Math.abs((other.x + other.width) - room.x) < tolerance) {
          const overlapStart = Math.max(room.y, other.y);
          const overlapEnd = Math.min(room.y + room.height, other.y + other.height);
          if (overlapEnd - overlapStart > tolerance) return true;
        }
        break;
      case 'right':
        // Check if another room is directly to the right
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

// Generate default furniture based on room type
const getDefaultFurniture = (roomType: RoomType): { type: Furniture['type']; x: number; y: number; w: number; h: number; rotation?: number }[] => {
  switch (roomType) {
    case 'bedroom':
      return [
        { type: 'bed', x: 15, y: 25, w: 55, h: 50 },
        { type: 'wardrobe', x: 5, y: 5, w: 30, h: 12 },
      ];
    case 'bathroom':
      return [
        { type: 'toilet', x: 10, y: 55, w: 30, h: 40 },
        { type: 'shower', x: 55, y: 10, w: 40, h: 40 },
        { type: 'sink', x: 10, y: 10, w: 35, h: 20 },
      ];
    case 'kitchen':
      return [
        { type: 'kitchen-counter', x: 5, y: 5, w: 90, h: 20 },
      ];
    case 'living':
      return [
        { type: 'sofa', x: 15, y: 45, w: 55, h: 30 },
        { type: 'tv', x: 15, y: 5, w: 45, h: 8 },
      ];
    case 'dining':
      return [
        { type: 'dining-table', x: 20, y: 20, w: 60, h: 60 },
      ];
    case 'garage':
      return [
        { type: 'car', x: 15, y: 15, w: 70, h: 70 },
      ];
    case 'study':
      return [
        { type: 'desk', x: 15, y: 15, w: 55, h: 35 },
      ];
    case 'garden':
    case 'balcony':
      return [
        { type: 'plants', x: 15, y: 15, w: 25, h: 25 },
        { type: 'plants', x: 60, y: 60, w: 25, h: 25 },
      ];
    default:
      return [];
  }
};

// Room component with walls, doors, windows, and furniture
const RoomSVG = ({ room, scale, zoom, wallThickness, allRooms }: RoomSVGProps) => {
  const x = room.x * scale * zoom;
  const y = room.y * scale * zoom;
  const width = room.width * scale * zoom;
  const height = room.height * scale * zoom;
  
  // Check which walls are interior (shared with other rooms)
  const isInteriorTop = checkAdjacentWall(room, 'top', allRooms);
  const isInteriorBottom = checkAdjacentWall(room, 'bottom', allRooms);
  const isInteriorLeft = checkAdjacentWall(room, 'left', allRooms);
  const isInteriorRight = checkAdjacentWall(room, 'right', allRooms);
  
  const defaultFurnitureSizes = getDefaultFurniture(room.type);
  
  // Wall thickness for interior vs exterior
  const exteriorWallWidth = wallThickness * 1.5;
  const interiorWallWidth = wallThickness * 0.8;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Room fill */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={room.color || ROOM_COLORS[room.type]}
        className="opacity-70"
      />
      
      {/* Floor pattern for different room types */}
      {room.type === 'bathroom' && (
        <pattern id={`tiles-${room.id}`} width={8} height={8} patternUnits="userSpaceOnUse">
          <rect width={8} height={8} fill="hsl(195, 60%, 85%)" />
          <rect x={0} y={0} width={4} height={4} fill="hsl(195, 60%, 80%)" />
          <rect x={4} y={4} width={4} height={4} fill="hsl(195, 60%, 80%)" />
        </pattern>
      )}
      {room.type === 'bathroom' && (
        <rect x={2} y={2} width={width - 4} height={height - 4} fill={`url(#tiles-${room.id})`} opacity={0.5} />
      )}
      
      {room.type === 'kitchen' && (
        <pattern id={`kitchen-${room.id}`} width={12} height={12} patternUnits="userSpaceOnUse">
          <rect width={12} height={12} fill="hsl(40, 70%, 85%)" />
          <rect x={0} y={0} width={6} height={6} fill="hsl(40, 70%, 80%)" />
          <rect x={6} y={6} width={6} height={6} fill="hsl(40, 70%, 80%)" />
        </pattern>
      )}
      {room.type === 'kitchen' && (
        <rect x={2} y={2} width={width - 4} height={height - 4} fill={`url(#kitchen-${room.id})`} opacity={0.4} />
      )}
      
      {/* Interior wall lines (thinner, for shared walls) */}
      {isInteriorTop && (
        <line x1={0} y1={0} x2={width} y2={0} stroke="hsl(var(--foreground))" strokeWidth={interiorWallWidth} />
      )}
      {isInteriorBottom && (
        <line x1={0} y1={height} x2={width} y2={height} stroke="hsl(var(--foreground))" strokeWidth={interiorWallWidth} />
      )}
      {isInteriorLeft && (
        <line x1={0} y1={0} x2={0} y2={height} stroke="hsl(var(--foreground))" strokeWidth={interiorWallWidth} />
      )}
      {isInteriorRight && (
        <line x1={width} y1={0} x2={width} y2={height} stroke="hsl(var(--foreground))" strokeWidth={interiorWallWidth} />
      )}
      
      {/* Exterior walls (thicker) */}
      {!isInteriorTop && (
        <line x1={0} y1={0} x2={width} y2={0} stroke="hsl(var(--foreground))" strokeWidth={exteriorWallWidth} />
      )}
      {!isInteriorBottom && (
        <line x1={0} y1={height} x2={width} y2={height} stroke="hsl(var(--foreground))" strokeWidth={exteriorWallWidth} />
      )}
      {!isInteriorLeft && (
        <line x1={0} y1={0} x2={0} y2={height} stroke="hsl(var(--foreground))" strokeWidth={exteriorWallWidth} />
      )}
      {!isInteriorRight && (
        <line x1={width} y1={0} x2={width} y2={height} stroke="hsl(var(--foreground))" strokeWidth={exteriorWallWidth} />
      )}
      
      {/* Doors */}
      {(room.doors || []).map((door, i) => {
        const isInteriorDoor = 
          (door.position === 'top' && isInteriorTop) ||
          (door.position === 'bottom' && isInteriorBottom) ||
          (door.position === 'left' && isInteriorLeft) ||
          (door.position === 'right' && isInteriorRight);
        
        return (
          <DoorSVG
            key={`door-${i}`}
            door={door}
            roomWidth={room.width}
            roomHeight={room.height}
            scale={scale}
            zoom={zoom}
            isInteriorWall={isInteriorDoor}
          />
        );
      })}
      
      {/* Windows (only on exterior walls) */}
      {(room.windows || []).filter(w => {
        if (w.position === 'top' && isInteriorTop) return false;
        if (w.position === 'bottom' && isInteriorBottom) return false;
        if (w.position === 'left' && isInteriorLeft) return false;
        if (w.position === 'right' && isInteriorRight) return false;
        return true;
      }).map((window, i) => (
        <WindowSVG
          key={`window-${i}`}
          window={window}
          roomWidth={room.width}
          roomHeight={room.height}
          scale={scale}
          zoom={zoom}
        />
      ))}
      
      {/* Furniture */}
      {defaultFurnitureSizes.map((f, i) => (
        <FurnitureIcon
          key={`furniture-${i}`}
          type={f.type}
          x={(f.x / 100) * width}
          y={(f.y / 100) * height}
          width={(f.w / 100) * width}
          height={(f.h / 100) * height}
          rotation={f.rotation}
        />
      ))}
      
      {/* Room label */}
      <text
        x={width / 2}
        y={height / 2 - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground font-semibold pointer-events-none"
        style={{ fontSize: Math.max(9, Math.min(13, width / 7)) }}
      >
        {room.name}
      </text>
      
      {/* Room dimensions */}
      <text
        x={width / 2}
        y={height / 2 + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground pointer-events-none"
        style={{ fontSize: Math.max(7, Math.min(10, width / 9)) }}
      >
        {room.width.toFixed(0)}' × {room.height.toFixed(0)}'
      </text>
      
      {/* Room area */}
      <text
        x={width / 2}
        y={height / 2 + 18}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground/70 pointer-events-none"
        style={{ fontSize: Math.max(6, Math.min(8, width / 10)) }}
      >
        {(room.width * room.height).toFixed(0)} sq ft
      </text>
    </g>
  );
};

export default RoomSVG;
