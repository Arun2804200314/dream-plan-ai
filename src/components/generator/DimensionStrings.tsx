interface DimensionStringsProps {
  plotLength: number;
  plotWidth: number;
  scale: number;
  zoom: number;
  svgWidth: number;
  svgHeight: number;
}

const DimensionStrings = ({ plotLength, plotWidth, scale, zoom, svgWidth, svgHeight }: DimensionStringsProps) => {
  const dimOffset = 25; // Distance from edge
  const tickSize = 6;
  const fontSize = 10;
  
  return (
    <g className="dimension-strings">
      {/* Top dimension - total width */}
      <g>
        {/* Extension lines */}
        <line x1={0} y1={-dimOffset + tickSize} x2={0} y2={-dimOffset - tickSize} stroke="#1a1a1a" strokeWidth={0.5} />
        <line x1={svgWidth} y1={-dimOffset + tickSize} x2={svgWidth} y2={-dimOffset - tickSize} stroke="#1a1a1a" strokeWidth={0.5} />
        
        {/* Dimension line with arrows */}
        <line x1={0} y1={-dimOffset} x2={svgWidth} y2={-dimOffset} stroke="#1a1a1a" strokeWidth={0.5} />
        
        {/* Arrow heads */}
        <path d={`M 0 ${-dimOffset} L 5 ${-dimOffset - 2} L 5 ${-dimOffset + 2} Z`} fill="#1a1a1a" />
        <path d={`M ${svgWidth} ${-dimOffset} L ${svgWidth - 5} ${-dimOffset - 2} L ${svgWidth - 5} ${-dimOffset + 2} Z`} fill="#1a1a1a" />
        
        {/* Dimension text */}
        <rect x={svgWidth / 2 - 25} y={-dimOffset - 8} width={50} height={12} fill="white" />
        <text
          x={svgWidth / 2}
          y={-dimOffset + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1a1a1a"
          fontFamily="Arial, sans-serif"
          fontSize={fontSize}
          fontWeight="500"
        >
          {plotLength}'-0"
        </text>
      </g>
      
      {/* Left dimension - total height */}
      <g>
        {/* Extension lines */}
        <line x1={-dimOffset + tickSize} y1={0} x2={-dimOffset - tickSize} y2={0} stroke="#1a1a1a" strokeWidth={0.5} />
        <line x1={-dimOffset + tickSize} y1={svgHeight} x2={-dimOffset - tickSize} y2={svgHeight} stroke="#1a1a1a" strokeWidth={0.5} />
        
        {/* Dimension line */}
        <line x1={-dimOffset} y1={0} x2={-dimOffset} y2={svgHeight} stroke="#1a1a1a" strokeWidth={0.5} />
        
        {/* Arrow heads */}
        <path d={`M ${-dimOffset} 0 L ${-dimOffset - 2} 5 L ${-dimOffset + 2} 5 Z`} fill="#1a1a1a" />
        <path d={`M ${-dimOffset} ${svgHeight} L ${-dimOffset - 2} ${svgHeight - 5} L ${-dimOffset + 2} ${svgHeight - 5} Z`} fill="#1a1a1a" />
        
        {/* Dimension text (rotated) */}
        <g transform={`translate(${-dimOffset - 2}, ${svgHeight / 2})`}>
          <rect x={-25} y={-6} width={50} height={12} fill="white" transform="rotate(-90)" />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#1a1a1a"
            fontFamily="Arial, sans-serif"
            fontSize={fontSize}
            fontWeight="500"
            transform="rotate(-90)"
          >
            {plotWidth}'-0"
          </text>
        </g>
      </g>
    </g>
  );
};

export default DimensionStrings;
