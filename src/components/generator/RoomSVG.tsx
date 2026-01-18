import { Room, Furniture, Door, Window, ROOM_COLORS } from '@/types/floorPlan';

interface RoomSVGProps {
  room: Room;
  scale: number;
  zoom: number;
  wallThickness: number;
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
  const arcRadius = doorWidthPx;
  
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
      <path d={arcPath} fill="none" stroke="currentColor" strokeWidth={door.isMain ? 2 : 1} />
      {/* Door opening break in wall */}
      {isHorizontal ? (
        <line x1={x} y1={y} x2={x + doorWidthPx} y2={y} stroke="hsl(var(--background))" strokeWidth={4} />
      ) : (
        <line x1={x} y1={y} x2={x} y2={y + doorWidthPx} stroke="hsl(var(--background))" strokeWidth={4} />
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
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--background))" strokeWidth={4} />
      {/* Window frame lines */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2} />
      {/* Window cross */}
      {isHorizontal ? (
        <>
          <line x1={midX} y1={y1 - 3} x2={midX} y2={y1 + 3} stroke="currentColor" strokeWidth={1} />
        </>
      ) : (
        <>
          <line x1={x1 - 3} y1={midY} x2={x1 + 3} y2={midY} stroke="currentColor" strokeWidth={1} />
        </>
      )}
    </g>
  );
};

// Room component with walls, doors, windows, and furniture
const RoomSVG = ({ room, scale, zoom, wallThickness }: RoomSVGProps) => {
  const x = room.x * scale * zoom;
  const y = room.y * scale * zoom;
  const width = room.width * scale * zoom;
  const height = room.height * scale * zoom;
  
  // Generate default furniture based on room type
  const getDefaultFurniture = (): { type: Furniture['type']; x: number; y: number; w: number; h: number; rotation?: number }[] => {
    switch (room.type) {
      case 'bedroom':
        return [
          { type: 'bed', x: 20, y: 30, w: 60, h: 45 },
          { type: 'wardrobe', x: 5, y: 5, w: 25, h: 15 },
        ];
      case 'bathroom':
        return [
          { type: 'toilet', x: 10, y: 60, w: 25, h: 35 },
          { type: 'shower', x: 50, y: 10, w: 45, h: 45 },
          { type: 'sink', x: 10, y: 10, w: 30, h: 20 },
        ];
      case 'kitchen':
        return [
          { type: 'kitchen-counter', x: 5, y: 5, w: 90, h: 25 },
        ];
      case 'living':
        return [
          { type: 'sofa', x: 10, y: 50, w: 50, h: 25 },
          { type: 'tv', x: 10, y: 5, w: 40, h: 10 },
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
          { type: 'desk', x: 10, y: 10, w: 50, h: 30 },
        ];
      case 'garden':
      case 'balcony':
        return [
          { type: 'plants', x: 20, y: 20, w: 20, h: 20 },
          { type: 'plants', x: 60, y: 60, w: 20, h: 20 },
        ];
      default:
        return [];
    }
  };
  
  const furniture = room.furniture || getDefaultFurniture().map((f, i) => ({
    type: f.type,
    x: f.x,
    y: f.y,
    rotation: f.rotation || 0,
  }));
  
  const defaultFurnitureSizes = getDefaultFurniture();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Room fill */}
      <rect
        x={wallThickness}
        y={wallThickness}
        width={width - wallThickness * 2}
        height={height - wallThickness * 2}
        fill={room.color || ROOM_COLORS[room.type]}
        className="opacity-60"
      />
      
      {/* Room walls */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth={wallThickness}
      />
      
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
      
      {/* Windows */}
      {(room.windows || []).map((window, i) => (
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
          x={(f.x / 100) * (width - wallThickness * 2) + wallThickness}
          y={(f.y / 100) * (height - wallThickness * 2) + wallThickness}
          width={(f.w / 100) * (width - wallThickness * 2)}
          height={(f.h / 100) * (height - wallThickness * 2)}
          rotation={f.rotation}
        />
      ))}
      
      {/* Room label */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground font-medium pointer-events-none"
        style={{ fontSize: Math.max(10, Math.min(14, width / 8)) }}
      >
        {room.name}
      </text>
      
      {/* Room dimensions */}
      <text
        x={width / 2}
        y={height / 2 + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground pointer-events-none"
        style={{ fontSize: Math.max(8, Math.min(10, width / 10)) }}
      >
        {room.width}' × {room.height}'
      </text>
    </g>
  );
};

export default RoomSVG;
