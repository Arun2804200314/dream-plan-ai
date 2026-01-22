interface PlanLegendProps {
  showFurniture?: boolean;
}

const PlanLegend = ({ showFurniture = true }: PlanLegendProps) => {
  return (
    <div className="bg-white border-2 border-neutral-900 p-4 font-mono text-xs">
      <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b-2 border-neutral-900 pb-2 mb-3">
        Legend
      </h3>
      
      <div className="space-y-3">
        {/* Wall Types */}
        <div>
          <h4 className="text-[10px] font-semibold text-neutral-600 uppercase mb-2">Walls</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0 border-t-[4px] border-neutral-900" />
              <span className="text-neutral-700">Exterior Wall (9")</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0 border-t-[2px] border-neutral-900" />
              <span className="text-neutral-700">Interior Wall (6")</span>
            </div>
          </div>
        </div>
        
        {/* Openings */}
        <div>
          <h4 className="text-[10px] font-semibold text-neutral-600 uppercase mb-2">Openings</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <svg width="24" height="16" viewBox="0 0 24 16" className="flex-shrink-0">
                <path d="M 2 14 L 2 2 A 12 12 0 0 0 22 14" fill="none" stroke="#1a1a1a" strokeWidth="1" />
              </svg>
              <span className="text-neutral-700">Door with Swing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="24" height="12" viewBox="0 0 24 12" className="flex-shrink-0">
                <line x1="2" y1="6" x2="22" y2="6" stroke="#1a1a1a" strokeWidth="3" />
                <line x1="4" y1="3" x2="20" y2="3" stroke="#1a1a1a" strokeWidth="0.5" />
                <line x1="4" y1="9" x2="20" y2="9" stroke="#1a1a1a" strokeWidth="0.5" />
                <line x1="12" y1="3" x2="12" y2="9" stroke="#1a1a1a" strokeWidth="0.5" />
              </svg>
              <span className="text-neutral-700">Window</span>
            </div>
          </div>
        </div>
        
        {/* Furniture (if enabled) */}
        {showFurniture && (
          <div>
            <h4 className="text-[10px] font-semibold text-neutral-600 uppercase mb-2">Furniture</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12">
                  <rect x="1" y="1" width="14" height="10" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                  <rect x="2" y="2" width="12" height="3" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                </svg>
                <span className="text-neutral-700">Bed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12">
                  <rect x="1" y="3" width="14" height="8" fill="none" stroke="#1a1a1a" strokeWidth="0.5" rx="1" />
                </svg>
                <span className="text-neutral-700">Sofa</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12">
                  <rect x="3" y="2" width="10" height="8" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                </svg>
                <span className="text-neutral-700">Table</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12">
                  <ellipse cx="8" cy="7" rx="5" ry="4" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                </svg>
                <span className="text-neutral-700">Toilet</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div className="pt-2 border-t border-neutral-300">
          <p className="text-[9px] text-neutral-500 leading-relaxed">
            All dimensions in feet. Wall thicknesses shown for reference only. 
            Actual construction may vary based on structural requirements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanLegend;
