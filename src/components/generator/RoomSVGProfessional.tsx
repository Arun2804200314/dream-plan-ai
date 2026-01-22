import { Room, Furniture, Door, Window, RoomType } from '@/types/floorPlan';

interface RoomSVGProps {
  room: Room;
  scale: number;
  zoom: number;
  wallThickness: number;
  allRooms: Room[];
}

// Minimal furniture icons - architectural style (thin lines)
const FurnitureIcon = ({ type, x, y, width, height, rotation = 0 }: {
  type: Furniture['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}) => {
  const transform = `translate(${x}, ${y}) rotate(${rotation}, ${width/2}, ${height/2})`;
  const stroke = '#1a1a1a';
  const strokeWidth = 0.5;
  
  switch (type) {
    case 'bed':
      return (
        <g transform={transform}>
          <rect x={0} y={0} width={width} height={height} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={2} y={2} width={width - 4} height={height * 0.25} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1={2} y1={height * 0.35} x2={width - 2} y2={height * 0.35} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case 'sofa':
      return (
        <g transform={transform}>
          <rect x={0} y={height * 0.15} width={width} height={height * 0.85} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={2} y={0} width={width * 0.25} height={height * 0.2} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={width * 0.75 - 2} y={0} width={width * 0.25} height={height * 0.2} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case 'dining-table':
      return (
        <g transform={transform}>
          <rect x={width * 0.15} y={height * 0.15} width={width * 0.7} height={height * 0.7} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          {/* Chairs */}
          <rect x={width * 0.3} y={0} width={width * 0.15} height={height * 0.1} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={width * 0.55} y={0} width={width * 0.15} height={height * 0.1} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={width * 0.3} y={height * 0.9} width={width * 0.15} height={height * 0.1} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={width * 0.55} y={height * 0.9} width={width * 0.15} height={height * 0.1} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case 'kitchen-counter':
      return (
        <g transform={transform}>
          <rect x={0} y={0} width={width} height={height} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          {/* Sink */}
          <rect x={width * 0.35} y={height * 0.25} width={width * 0.3} height={height * 0.5} fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={2} />
          {/* Stove burners */}
          <circle cx={width * 0.15} cy={height * 0.5} r={Math.min(width, height) * 0.12} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx={width * 0.85} cy={height * 0.5} r={Math.min(width, height) * 0.12} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case 'toilet':
      return (
        <g transform={transform}>
          <ellipse cx={width * 0.5} cy={height * 0.55} rx={width * 0.4} ry={height * 0.35} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={width * 0.25} y={0} width={width * 0.5} height={height * 0.25} fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={2} />
        </g>
      );
    case 'shower':
      return (
        <g transform={transform}>
          <rect x={0} y={0} width={width} height={height} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="3,2" />
          <circle cx={width * 0.5} cy={height * 0.25} r={2} fill={stroke} />
        </g>
      );
    case 'sink':
      return (
        <g transform={transform}>
          <ellipse cx={width/2} cy={height/2} rx={width * 0.4} ry={height * 0.35} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx={width/2} cy={height * 0.35} r={1.5} fill={stroke} />
        </g>
      );
    case 'wardrobe':
      return (
        <g transform={transform}>
          <rect x={0} y={0} width={width} height={height} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1={width/2} y1={0} x2={width/2} y2={height} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case 'desk':
      return (
        <g transform={transform}>
          <rect x={0} y={0} width={width} height={height * 0.6} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={width * 0.35} y={height * 0.7} width={width * 0.3} height={height * 0.25} fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={4} />
        </g>
      );
    case 'car':
      return (
        <g transform={transform}>
          <rect x={width * 0.1} y={0} width={width * 0.8} height={height} fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={4} />
          <rect x={width * 0.2} y={height * 0.08} width={width * 0.6} height={height * 0.2} fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={2} />
          <circle cx={width * 0.25} cy={height * 0.85} r={width * 0.08} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx={width * 0.75} cy={height * 0.85} r={width * 0.08} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case 'plants':
      return (
        <g transform={transform}>
          <circle cx={width/2} cy={height/2} r={Math.min(width, height)/2 - 2} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="2,2" />
        </g>
      );
    case 'tv':
      return (
        <g transform={transform}>
          <rect x={0} y={height * 0.35} width={width} height={height * 0.3} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    default:
      return null;
  }
};

// Professional door arc - standard 3' door with swing
const DoorSVG = ({ door, roomWidth, roomHeight, scale, zoom }: {
  door: Door;
  roomWidth: number;
  roomHeight: number;
  scale: number;
  zoom: number;
}) => {
  const doorWidthPx = door.width * scale * zoom;
  const isHorizontal = door.position === 'top' || door.position === 'bottom';
  const wallLength = isHorizontal ? roomWidth : roomHeight;
  const offsetPx = (door.offset / 100) * wallLength * scale * zoom;
  
  let x = 0, y = 0, arcPath = '';
  const arcRadius = doorWidthPx * 0.9;
  
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
    <g>
      {/* Door opening (white gap in wall) */}
      <path d={arcPath} fill="none" stroke="#1a1a1a" strokeWidth={door.isMain ? 1.5 : 1} />
    </g>
  );
};

// Professional window mark
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
    <g>
      {/* Standard architectural window representation */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1a1a" strokeWidth={3} />
      {isHorizontal ? (
        <>
          <line x1={x1 + 2} y1={y1 - 2} x2={x2 - 2} y2={y2 - 2} stroke="#1a1a1a" strokeWidth={0.5} />
          <line x1={x1 + 2} y1={y1 + 2} x2={x2 - 2} y2={y2 + 2} stroke="#1a1a1a" strokeWidth={0.5} />
          <line x1={midX} y1={y1 - 3} x2={midX} y2={y1 + 3} stroke="#1a1a1a" strokeWidth={0.5} />
        </>
      ) : (
        <>
          <line x1={x1 - 2} y1={y1 + 2} x2={x2 - 2} y2={y2 - 2} stroke="#1a1a1a" strokeWidth={0.5} />
          <line x1={x1 + 2} y1={y1 + 2} x2={x2 + 2} y2={y2 - 2} stroke="#1a1a1a" strokeWidth={0.5} />
          <line x1={x1 - 3} y1={midY} x2={x1 + 3} y2={midY} stroke="#1a1a1a" strokeWidth={0.5} />
        </>
      )}
    </g>
  );
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

// Default furniture by room type
const getDefaultFurniture = (roomType: RoomType): { type: Furniture['type']; x: number; y: number; w: number; h: number; rotation?: number }[] => {
  switch (roomType) {
    case 'bedroom':
      return [
        { type: 'bed', x: 15, y: 25, w: 55, h: 50 },
        { type: 'wardrobe', x: 5, y: 5, w: 30, h: 12 },
      ];
    case 'bathroom':
      return [
        { type: 'toilet', x: 10, y: 55, w: 28, h: 35 },
        { type: 'shower', x: 55, y: 10, w: 38, h: 38 },
        { type: 'sink', x: 10, y: 12, w: 30, h: 18 },
      ];
    case 'kitchen':
      return [
        { type: 'kitchen-counter', x: 5, y: 5, w: 90, h: 18 },
      ];
    case 'living':
      return [
        { type: 'sofa', x: 15, y: 50, w: 50, h: 25 },
        { type: 'tv', x: 20, y: 8, w: 40, h: 8 },
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
        { type: 'plants', x: 15, y: 15, w: 20, h: 20 },
        { type: 'plants', x: 65, y: 65, w: 20, h: 20 },
      ];
    default:
      return [];
  }
};

// Room component - professional monochrome style
const RoomSVGProfessional = ({ room, scale, zoom, wallThickness, allRooms }: RoomSVGProps) => {
  const x = room.x * scale * zoom;
  const y = room.y * scale * zoom;
  const width = room.width * scale * zoom;
  const height = room.height * scale * zoom;
  
  const isInteriorTop = checkAdjacentWall(room, 'top', allRooms);
  const isInteriorBottom = checkAdjacentWall(room, 'bottom', allRooms);
  const isInteriorLeft = checkAdjacentWall(room, 'left', allRooms);
  const isInteriorRight = checkAdjacentWall(room, 'right', allRooms);
  
  const defaultFurnitureSizes = getDefaultFurniture(room.type);
  
  // Professional wall thickness: 9" exterior, 6" interior (scaled)
  const exteriorWallWidth = wallThickness * 1.5;
  const interiorWallWidth = wallThickness;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Room fill - clean white */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#ffffff"
      />
      
      {/* Interior walls */}
      {isInteriorTop && (
        <line x1={0} y1={0} x2={width} y2={0} stroke="#1a1a1a" strokeWidth={interiorWallWidth} />
      )}
      {isInteriorBottom && (
        <line x1={0} y1={height} x2={width} y2={height} stroke="#1a1a1a" strokeWidth={interiorWallWidth} />
      )}
      {isInteriorLeft && (
        <line x1={0} y1={0} x2={0} y2={height} stroke="#1a1a1a" strokeWidth={interiorWallWidth} />
      )}
      {isInteriorRight && (
        <line x1={width} y1={0} x2={width} y2={height} stroke="#1a1a1a" strokeWidth={interiorWallWidth} />
      )}
      
      {/* Exterior walls - thicker */}
      {!isInteriorTop && (
        <line x1={0} y1={0} x2={width} y2={0} stroke="#1a1a1a" strokeWidth={exteriorWallWidth} />
      )}
      {!isInteriorBottom && (
        <line x1={0} y1={height} x2={width} y2={height} stroke="#1a1a1a" strokeWidth={exteriorWallWidth} />
      )}
      {!isInteriorLeft && (
        <line x1={0} y1={0} x2={0} y2={height} stroke="#1a1a1a" strokeWidth={exteriorWallWidth} />
      )}
      {!isInteriorRight && (
        <line x1={width} y1={0} x2={width} y2={height} stroke="#1a1a1a" strokeWidth={exteriorWallWidth} />
      )}
      
      {/* Doors */}
      {(room.doors || []).map((door, i) => (
        <DoorSVG
          key={`door-${i}`}
          door={door}
          roomWidth={room.width}
          roomHeight={room.height}
          scale={scale}
          zoom={zoom}
        />
      ))}
      
      {/* Windows (only exterior) */}
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
      
      {/* Furniture - minimal */}
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
      
      {/* Room label - minimal text */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1a1a1a"
        fontFamily="Arial, sans-serif"
        fontWeight="500"
        style={{ fontSize: Math.max(8, Math.min(11, width / 8)) }}
      >
        {room.name.toUpperCase()}
      </text>
    </g>
  );
};

export default RoomSVGProfessional;
