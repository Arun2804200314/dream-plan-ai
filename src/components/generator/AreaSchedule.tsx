import { Room } from '@/types/floorPlan';

interface AreaScheduleProps {
  rooms: Room[];
  totalArea: number;
  efficiency: number;
}

const AreaSchedule = ({ rooms, totalArea, efficiency }: AreaScheduleProps) => {
  // Group rooms by type and calculate areas
  const roomSummary = rooms.reduce((acc, room) => {
    const area = room.width * room.height;
    if (!acc[room.type]) {
      acc[room.type] = { count: 0, totalArea: 0, rooms: [] };
    }
    acc[room.type].count += 1;
    acc[room.type].totalArea += area;
    acc[room.type].rooms.push({ name: room.name, area, dimensions: `${room.width.toFixed(0)}' × ${room.height.toFixed(0)}'` });
    return acc;
  }, {} as Record<string, { count: number; totalArea: number; rooms: { name: string; area: number; dimensions: string }[] }>);

  const sortedTypes = Object.entries(roomSummary).sort((a, b) => b[1].totalArea - a[1].totalArea);
  const builtUpArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);

  return (
    <div className="bg-white border-2 border-neutral-900 p-4 font-mono text-xs">
      <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b-2 border-neutral-900 pb-2 mb-3">
        Area Statement
      </h3>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-400">
            <th className="text-left py-1 text-neutral-700 font-medium">S.No</th>
            <th className="text-left py-1 text-neutral-700 font-medium">Room</th>
            <th className="text-center py-1 text-neutral-700 font-medium">Size</th>
            <th className="text-right py-1 text-neutral-700 font-medium">Area (sq.ft)</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, i) => (
            <tr key={room.id} className="border-b border-neutral-200">
              <td className="py-1 text-neutral-600">{i + 1}</td>
              <td className="py-1 text-neutral-900 font-medium">{room.name}</td>
              <td className="py-1 text-center text-neutral-600">{room.width.toFixed(0)}' × {room.height.toFixed(0)}'</td>
              <td className="py-1 text-right text-neutral-900">{(room.width * room.height).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-900">
            <td colSpan={3} className="py-2 font-bold text-neutral-900">Built-Up Area</td>
            <td className="py-2 text-right font-bold text-neutral-900">{builtUpArea.toFixed(0)} sq.ft</td>
          </tr>
          <tr>
            <td colSpan={3} className="py-1 text-neutral-700">Plot Area</td>
            <td className="py-1 text-right text-neutral-700">{totalArea.toFixed(0)} sq.ft</td>
          </tr>
          <tr>
            <td colSpan={3} className="py-1 text-neutral-700">Coverage Efficiency</td>
            <td className="py-1 text-right text-neutral-700">{(efficiency * 100).toFixed(1)}%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AreaSchedule;
