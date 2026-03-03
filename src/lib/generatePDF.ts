import jsPDF from 'jspdf';
import { FormData, GeneratedLayout, Room } from '@/types/floorPlan';

type WallSide = 'top' | 'bottom' | 'left' | 'right';

const rangesOverlap = (startA: number, endA: number, startB: number, endB: number): boolean => {
  return Math.min(endA, endB) - Math.max(startA, startB) > 0.05;
};

const hasAdjacentRoom = (room: Room, side: WallSide, rooms: Room[]): boolean => {
  const tolerance = 0.05;

  return rooms.some((other) => {
    if (other.id === room.id) return false;

    if (side === 'top') {
      return (
        Math.abs(other.y + other.height - room.y) <= tolerance &&
        rangesOverlap(room.x, room.x + room.width, other.x, other.x + other.width)
      );
    }

    if (side === 'bottom') {
      return (
        Math.abs(other.y - (room.y + room.height)) <= tolerance &&
        rangesOverlap(room.x, room.x + room.width, other.x, other.x + other.width)
      );
    }

    if (side === 'left') {
      return (
        Math.abs(other.x + other.width - room.x) <= tolerance &&
        rangesOverlap(room.y, room.y + room.height, other.y, other.y + other.height)
      );
    }

    return (
      Math.abs(other.x - (room.x + room.width)) <= tolerance &&
      rangesOverlap(room.y, room.y + room.height, other.y, other.y + other.height)
    );
  });
};

const drawDoorMarker = (
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    door: NonNullable<Room['doors']>[number];
    isExteriorTop: boolean;
    isExteriorBottom: boolean;
    isExteriorLeft: boolean;
    isExteriorRight: boolean;
  }
): void => {
  const { x, y, width, height, scale, door, isExteriorTop, isExteriorBottom, isExteriorLeft, isExteriorRight } = options;
  const openingLength = Math.max(door.width * scale, 2.2);

  const getWallWidth = (isExterior: boolean) => (isExterior ? 0.65 : 0.35);

  doc.setDrawColor(240, 248, 255);

  if (door.position === 'top' || door.position === 'bottom') {
    const maxStart = Math.max(0, width - openingLength);
    const openingStart = Math.max(0, Math.min((door.offset / 100) * width, maxStart));
    const sx = x + openingStart;
    const ex = sx + Math.min(openingLength, width);
    const yEdge = door.position === 'top' ? y : y + height;
    const wallWidth = getWallWidth(door.position === 'top' ? isExteriorTop : isExteriorBottom);

    doc.setLineWidth(wallWidth + 0.3);
    doc.line(sx, yEdge, ex, yEdge);

    doc.setDrawColor(70, 80, 100);
    doc.setLineWidth(0.2);
    const swingY = door.position === 'top' ? yEdge + openingLength * 0.45 : yEdge - openingLength * 0.45;
    doc.line(sx, yEdge, sx + openingLength * 0.7, swingY);
    return;
  }

  const maxStart = Math.max(0, height - openingLength);
  const openingStart = Math.max(0, Math.min((door.offset / 100) * height, maxStart));
  const sy = y + openingStart;
  const ey = sy + Math.min(openingLength, height);
  const xEdge = door.position === 'left' ? x : x + width;
  const wallWidth = getWallWidth(door.position === 'left' ? isExteriorLeft : isExteriorRight);

  doc.setLineWidth(wallWidth + 0.3);
  doc.line(xEdge, sy, xEdge, ey);

  doc.setDrawColor(70, 80, 100);
  doc.setLineWidth(0.2);
  const swingX = door.position === 'left' ? xEdge + openingLength * 0.45 : xEdge - openingLength * 0.45;
  doc.line(xEdge, sy, swingX, sy + openingLength * 0.7);
};

const drawWindowMarker = (
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    window: NonNullable<Room['windows']>[number];
    isExteriorTop: boolean;
    isExteriorBottom: boolean;
    isExteriorLeft: boolean;
    isExteriorRight: boolean;
  }
): void => {
  const { x, y, width, height, scale, window, isExteriorTop, isExteriorBottom, isExteriorLeft, isExteriorRight } = options;
  const openingLength = Math.max(window.width * scale, 2.4);

  const getWallWidth = (isExterior: boolean) => (isExterior ? 0.65 : 0.35);

  doc.setDrawColor(240, 248, 255);

  if (window.position === 'top' || window.position === 'bottom') {
    const maxStart = Math.max(0, width - openingLength);
    const openingStart = Math.max(0, Math.min((window.offset / 100) * width, maxStart));
    const sx = x + openingStart;
    const ex = sx + Math.min(openingLength, width);
    const yEdge = window.position === 'top' ? y : y + height;
    const wallWidth = getWallWidth(window.position === 'top' ? isExteriorTop : isExteriorBottom);

    doc.setLineWidth(wallWidth + 0.25);
    doc.line(sx, yEdge, ex, yEdge);

    doc.setDrawColor(80, 90, 110);
    doc.setLineWidth(0.15);
    doc.line(sx, yEdge - 0.35, ex, yEdge - 0.35);
    doc.line(sx, yEdge + 0.35, ex, yEdge + 0.35);
    return;
  }

  const maxStart = Math.max(0, height - openingLength);
  const openingStart = Math.max(0, Math.min((window.offset / 100) * height, maxStart));
  const sy = y + openingStart;
  const ey = sy + Math.min(openingLength, height);
  const xEdge = window.position === 'left' ? x : x + width;
  const wallWidth = getWallWidth(window.position === 'left' ? isExteriorLeft : isExteriorRight);

  doc.setLineWidth(wallWidth + 0.25);
  doc.line(xEdge, sy, xEdge, ey);

  doc.setDrawColor(80, 90, 110);
  doc.setLineWidth(0.15);
  doc.line(xEdge - 0.35, sy, xEdge - 0.35, ey);
  doc.line(xEdge + 0.35, sy, xEdge + 0.35, ey);
};

export function generateBlueprintPDF(
  formData: FormData,
  layout: GeneratedLayout,
  selectedFloor?: number
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const availableFloors = [...new Set(layout.rooms.map((room) => room.floor ?? 1))].sort((a, b) => a - b);
  const activeFloor = selectedFloor && availableFloors.includes(selectedFloor)
    ? selectedFloor
    : (availableFloors[0] ?? 1);
  const floorRooms = layout.rooms.filter((room) => (room.floor ?? 1) === activeFloor);
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title Block
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, margin, pageWidth - margin * 2, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FLOOR PLAN BLUEPRINT', margin + 10, margin + 16);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated by PlanAI | ${new Date().toLocaleDateString()}`, pageWidth - margin - 10, margin + 16, { align: 'right' });

  // Plot Info Section
  const infoY = margin + 35;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT SPECIFICATIONS', margin, infoY);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, infoY + 3, margin + 80, infoY + 3);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const specs = [
    `Plot Size: ${formData.plotLength} ft × ${formData.plotWidth} ft`,
    `Total Area: ${layout.totalArea} sq.ft`,
    `Floors: ${formData.floors} | PDF Floor: ${activeFloor}`,
    `Style: ${formData.style.charAt(0).toUpperCase() + formData.style.slice(1)}`,
    `Budget: ${formData.budgetRange.charAt(0).toUpperCase() + formData.budgetRange.slice(1)}`,
    `Vastu: ${formData.vastuCompliant ? 'Yes' : 'No'}`,
  ];
  
  specs.forEach((spec, i) => {
    doc.text(spec, margin, infoY + 12 + i * 6);
  });

  // Room Schedule
  const scheduleY = infoY + 55;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ROOM SCHEDULE', margin, scheduleY);
  doc.line(margin, scheduleY + 3, margin + 80, scheduleY + 3);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Room', margin, scheduleY + 12);
  doc.text('Size (ft)', margin + 40, scheduleY + 12);
  doc.text('Area (sq.ft)', margin + 65, scheduleY + 12);

  doc.setFont('helvetica', 'normal');
  floorRooms.forEach((room, i) => {
    const y = scheduleY + 18 + i * 5;
    if (y < scheduleY + 70) {
      doc.text(room.name, margin, y);
      doc.text(`${room.width.toFixed(1)} × ${room.height.toFixed(1)}`, margin + 40, y);
      doc.text((room.width * room.height).toFixed(1), margin + 65, y);
    }
  });

  // Floor Plan Drawing Area
  const planX = 120;
  const planY = margin + 35;
  const planWidth = pageWidth - planX - margin - 10;
  const planHeight = pageHeight - planY - margin - 30;

  // Blueprint grid background
  doc.setFillColor(240, 248, 255);
  doc.rect(planX, planY, planWidth, planHeight, 'F');

  // Grid lines
  doc.setDrawColor(200, 220, 240);
  doc.setLineWidth(0.1);
  const gridSpacing = 5;
  for (let x = planX; x <= planX + planWidth; x += gridSpacing) {
    doc.line(x, planY, x, planY + planHeight);
  }
  for (let y = planY; y <= planY + planHeight; y += gridSpacing) {
    doc.line(planX, y, planX + planWidth, y);
  }

  // Calculate scale
  const plotWidth = parseInt(formData.plotWidth) || 40;
  const plotLength = parseInt(formData.plotLength) || 60;
  const scaleX = (planWidth - 20) / plotLength;
  const scaleY = (planHeight - 20) / plotWidth;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = planX + 10 + (planWidth - 20 - plotLength * scale) / 2;
  const offsetY = planY + 10 + (planHeight - 20 - plotWidth * scale) / 2;

  // Plot outline
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.rect(offsetX, offsetY, plotLength * scale, plotWidth * scale);

  // Draw rooms in architectural style (walls + openings)
  floorRooms.forEach((room) => {
    const rx = offsetX + room.x * scale;
    const ry = offsetY + room.y * scale;
    const rw = room.width * scale;
    const rh = room.height * scale;

    const adjacentTop = hasAdjacentRoom(room, 'top', floorRooms);
    const adjacentBottom = hasAdjacentRoom(room, 'bottom', floorRooms);
    const adjacentLeft = hasAdjacentRoom(room, 'left', floorRooms);
    const adjacentRight = hasAdjacentRoom(room, 'right', floorRooms);

    // room face
    doc.setFillColor(252, 253, 255);
    doc.rect(rx, ry, rw, rh, 'F');

    const drawWall = (x1: number, y1: number, x2: number, y2: number, isExterior: boolean) => {
      doc.setDrawColor(60, 70, 90);
      doc.setLineWidth(isExterior ? 0.65 : 0.35);
      doc.line(x1, y1, x2, y2);
    };

    drawWall(rx, ry, rx + rw, ry, !adjacentTop);
    drawWall(rx, ry + rh, rx + rw, ry + rh, !adjacentBottom);
    drawWall(rx, ry, rx, ry + rh, !adjacentLeft);
    drawWall(rx + rw, ry, rx + rw, ry + rh, !adjacentRight);

    (room.doors ?? []).forEach((door) => {
      drawDoorMarker(doc, {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        scale,
        door,
        isExteriorTop: !adjacentTop,
        isExteriorBottom: !adjacentBottom,
        isExteriorLeft: !adjacentLeft,
        isExteriorRight: !adjacentRight,
      });
    });

    (room.windows ?? []).forEach((window) => {
      drawWindowMarker(doc, {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        scale,
        window,
        isExteriorTop: !adjacentTop,
        isExteriorBottom: !adjacentBottom,
        isExteriorLeft: !adjacentLeft,
        isExteriorRight: !adjacentRight,
      });
    });

    if (rw > 10 && rh > 8) {
      doc.setFontSize(6.5);
      doc.setTextColor(35, 45, 60);
      doc.setFont('helvetica', 'bold');
      const textX = rx + rw / 2;
      const textY = ry + rh / 2;
      doc.text(room.name, textX, textY, { align: 'center' });

      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${room.width.toFixed(0)}' × ${room.height.toFixed(0)}'`, textX, textY + 3, { align: 'center' });
    }
  });

  // Dimensions
  doc.setDrawColor(100, 100, 120);
  doc.setLineWidth(0.2);
  
  // Horizontal dimension
  const dimY = offsetY - 5;
  doc.line(offsetX, dimY, offsetX + plotLength * scale, dimY);
  doc.line(offsetX, dimY - 2, offsetX, dimY + 2);
  doc.line(offsetX + plotLength * scale, dimY - 2, offsetX + plotLength * scale, dimY + 2);
  
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 80);
  doc.text(`${plotLength} ft`, offsetX + (plotLength * scale) / 2, dimY - 2, { align: 'center' });

  // Vertical dimension
  const dimX = offsetX - 5;
  doc.line(dimX, offsetY, dimX, offsetY + plotWidth * scale);
  doc.line(dimX - 2, offsetY, dimX + 2, offsetY);
  doc.line(dimX - 2, offsetY + plotWidth * scale, dimX + 2, offsetY + plotWidth * scale);
  
  // Draw vertical text manually
  const verticalText = `${plotWidth} ft`;
  const textY = offsetY + (plotWidth * scale) / 2;
  doc.text(verticalText, dimX - 3, textY, { angle: 90 });

  // North Arrow
  const arrowX = planX + planWidth - 15;
  const arrowY = planY + 15;
  doc.setFillColor(30, 41, 59);
  doc.triangle(arrowX, arrowY - 8, arrowX - 4, arrowY, arrowX + 4, arrowY, 'F');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('N', arrowX, arrowY + 6, { align: 'center' });

  // Scale bar
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Scale: 1" = ${(25.4 / scale).toFixed(1)} ft`, planX + planWidth - 5, planY + planHeight + 5, { align: 'right' });

  // Efficiency rating
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Space Efficiency: ${(layout.efficiency * 100).toFixed(0)}%`, margin, pageHeight - margin - 5);

  // AI Suggestions
  if (layout.suggestions.length > 0) {
    const suggestY = scheduleY + 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('AI RECOMMENDATIONS', margin, suggestY);
    doc.line(margin, suggestY + 2, margin + 80, suggestY + 2);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    layout.suggestions.slice(0, 3).forEach((suggestion, i) => {
      doc.text(`• ${suggestion}`, margin, suggestY + 10 + i * 5);
    });
  }

  // Footer
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, pageHeight - margin, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('This is a computer-generated blueprint for conceptual purposes. Consult a licensed architect for construction.', pageWidth / 2, pageHeight - margin + 5, { align: 'center' });

  // Save
  doc.save(`FloorPlan_${formData.plotLength}x${formData.plotWidth}_${Date.now()}.pdf`);
}
