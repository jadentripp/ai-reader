import React from 'react';

interface AppearancePanelProps {
  fontFamily: string;
  lineHeight: number;
  margin: number;
  onFontFamilyChange: (font: string) => void;
  onLineHeightChange: (lh: number) => void;
  onMarginChange: (m: number) => void;
}

const AppearancePanel: React.FC<AppearancePanelProps> = ({
  fontFamily,
  lineHeight,
  margin,
  onFontFamilyChange,
  onLineHeightChange,
  onMarginChange,
}) => {
  return (
    <div className="bookToolbar" style={{ padding: '16px', minWidth: '240px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontFamily: 'var(--font-serif)' }}>Appearance</h3>
      
      <div className="form">
        <label className="label">
          <span className="muted" id="font-family-label">Font Family</span>
          <select 
            className="select" 
            value={fontFamily} 
            onChange={(e) => onFontFamilyChange(e.target.value)}
            aria-labelledby="font-family-label"
          >
            <option value="'EB Garamond', serif">EB Garamond</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Baskervville', serif">Baskerville</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="serif">System Serif</option>
            <option value="sans-serif">System Sans-Serif</option>
          </select>
        </label>

        <label className="label">
          <span className="muted" id="line-height-label">Line Height: {lineHeight}</span>
          <input 
            type="range" 
            min="1.0" 
            max="3.0" 
            step="0.1" 
            value={lineHeight} 
            onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
            aria-labelledby="line-height-label"
          />
        </label>

        <label className="label">
          <span className="muted" id="margin-label">Horizontal Margin: {margin}px</span>
          <input 
            type="range" 
            min="0" 
            max="200" 
            step="10" 
            value={margin} 
            onChange={(e) => onMarginChange(parseInt(e.target.value))}
            aria-labelledby="margin-label"
          />
        </label>
      </div>
    </div>
  );
};

export default AppearancePanel;
