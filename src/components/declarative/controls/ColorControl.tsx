import React, { useState, useRef, useCallback } from 'react';
import type { ColorControlProps } from '../../types/declarativeControls';

/**
 * Advanced color picker control with multiple input modes
 */
export const ColorControl: React.FC<ColorControlProps> = ({
  spec,
  value,
  onChange,
  context,
  disabled = false
}) => {
  const constraints = spec.constraints.color!;
  const [colorMode, setColorMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse color value (could be hex, rgb, or hsl)
  const parseColor = useCallback((colorValue: string) => {
    if (colorValue.startsWith('#')) {
      const hex = colorValue.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return { r, g, b, hex: colorValue, alpha: 1 };
    }
    
    if (colorValue.startsWith('rgb')) {
      const match = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match;
        const hex = `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`;
        return { r: parseInt(r), g: parseInt(g), b: parseInt(b), hex, alpha: 1 };
      }
    }
    
    // Default fallback
    return { r: 0, g: 0, b: 0, hex: '#000000', alpha: 1 };
  }, []);

  // Convert RGB to HSL
  const rgbToHsl = useCallback((r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }, []);

  // Convert HSL to RGB
  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }, []);

  const color = parseColor(value);
  const hsl = rgbToHsl(color.r, color.g, color.b);

  // Handle color picker change
  const handleColorChange = useCallback((newHex: string) => {
    if (constraints.format === 'rgb') {
      const newColor = parseColor(newHex);
      onChange(`rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`);
    } else if (constraints.format === 'hsl') {
      const newColor = parseColor(newHex);
      const newHsl = rgbToHsl(newColor.r, newColor.g, newColor.b);
      onChange(`hsl(${newHsl.h}, ${newHsl.s}%, ${newHsl.l}%)`);
    } else {
      onChange(newHex);
    }
  }, [constraints.format, onChange, parseColor, rgbToHsl]);

  // Handle palette selection
  const handlePaletteColor = useCallback((paletteColor: string) => {
    handleColorChange(paletteColor);
  }, [handleColorChange]);

  // Handle eyedropper (if supported)
  const handleEyeDropper = useCallback(async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - EyeDropper is experimental
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        handleColorChange(result.sRGBHex);
      } catch (err) {
        console.log('User cancelled eyedropper');
      }
    }
  }, [handleColorChange]);

  const defaultPalette = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FF8000', '#8000FF', '#00FF80', '#FF0080', '#80FF00', '#0080FF',
    '#FFFFFF', '#C0C0C0', '#808080', '#404040', '#202020', '#000000'
  ];

  const palette = constraints.palette || defaultPalette;

  return (
    <div className="space-y-3">
      <label className="font-medium text-gray-300 flex items-center gap-2">
        {spec.label}
        {spec.metadata?.tooltip && (
          <TooltipIcon tooltip={spec.metadata.tooltip} />
        )}
      </label>
      
      {spec.metadata?.description && (
        <p className="text-sm text-gray-400">{spec.metadata.description}</p>
      )}
      
      <div className="space-y-3">
        {/* Main color picker and preview */}
        <div className="flex gap-3">
          {/* Color preview */}
          <div
            className={`
              w-12 h-12 rounded-lg border-2 shadow-inner cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed border-gray-600' : 'border-gray-500 hover:border-gray-400'}
            `}
            style={{ backgroundColor: color.hex }}
            onClick={() => !disabled && fileInputRef.current?.click()}
          />
          
          {/* Native color input (hidden) */}
          <input
            ref={fileInputRef}
            type="color"
            value={color.hex}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            className="sr-only"
          />
          
          {/* Color value display and input */}
          <div className="flex-1 space-y-2">
            {/* Format selector */}
            <div className="flex gap-1">
              {(['hex', 'rgb', 'hsl'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  disabled={disabled}
                  className={`
                    px-2 py-1 text-xs rounded uppercase
                    ${colorMode === mode 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                    ${disabled && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  {mode}
                </button>
              ))}
              
              {/* Eyedropper tool */}
              {'EyeDropper' in window && (
                <button
                  onClick={handleEyeDropper}
                  disabled={disabled}
                  className={`
                    px-2 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 rounded
                    ${disabled && 'opacity-50 cursor-not-allowed'}
                  `}
                  title="Pick color from screen"
                >
                  💧
                </button>
              )}
            </div>
            
            {/* Color value input */}
            {colorMode === 'hex' && (
              <input
                type="text"
                value={color.hex}
                onChange={(e) => {
                  const hexValue = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(hexValue)) {
                    if (hexValue.length === 7) {
                      handleColorChange(hexValue);
                    }
                  }
                }}
                disabled={disabled}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50 font-mono"
                placeholder="#RRGGBB"
              />
            )}
            
            {colorMode === 'rgb' && (
              <div className="grid grid-cols-3 gap-1">
                {['r', 'g', 'b'].map((channel) => (
                  <input
                    key={channel}
                    type="number"
                    min={0}
                    max={255}
                    value={color[channel as keyof typeof color]}
                    onChange={(e) => {
                      const newValue = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                      const newColor = { ...color, [channel]: newValue };
                      const hex = `#${[newColor.r, newColor.g, newColor.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
                      handleColorChange(hex);
                    }}
                    disabled={disabled}
                    className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    placeholder={channel.toUpperCase()}
                  />
                ))}
              </div>
            )}
            
            {colorMode === 'hsl' && (
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={hsl.h}
                  onChange={(e) => {
                    const h = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                    const newRgb = hslToRgb(h, hsl.s, hsl.l);
                    const hex = `#${[newRgb.r, newRgb.g, newRgb.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
                    handleColorChange(hex);
                  }}
                  disabled={disabled}
                  className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                  placeholder="H"
                />
                {['s', 'l'].map((channel) => (
                  <input
                    key={channel}
                    type="number"
                    min={0}
                    max={100}
                    value={hsl[channel as keyof typeof hsl]}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      const newHsl = { ...hsl, [channel]: value };
                      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
                      const hex = `#${[newRgb.r, newRgb.g, newRgb.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
                      handleColorChange(hex);
                    }}
                    disabled={disabled}
                    className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    placeholder={channel.toUpperCase()}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Color palette */}
        {palette.length > 0 && (
          <div>
            <div className="text-sm text-gray-400 mb-2">Palette</div>
            <div className="grid grid-cols-9 gap-1">
              {palette.map((paletteColor, index) => (
                <button
                  key={index}
                  onClick={() => handlePaletteColor(paletteColor)}
                  disabled={disabled}
                  className={`
                    w-6 h-6 rounded border-2 hover:scale-110 transition-transform
                    ${color.hex.toLowerCase() === paletteColor.toLowerCase()
                      ? 'border-white ring-2 ring-cyan-500'
                      : 'border-gray-500 hover:border-gray-400'
                    }
                    ${disabled && 'opacity-50 cursor-not-allowed'}
                  `}
                  style={{ backgroundColor: paletteColor }}
                  title={paletteColor}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Presets */}
        {spec.presets && spec.presets.length > 0 && (
          <div>
            <div className="text-sm text-gray-400 mb-2">Presets</div>
            <div className="flex gap-2 flex-wrap">
              {spec.presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleColorChange(preset.value)}
                  disabled={disabled}
                  className={`
                    px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 
                    flex items-center gap-2
                    ${disabled && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <div
                    className="w-3 h-3 rounded border border-gray-500"
                    style={{ backgroundColor: preset.value }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tooltip icon component (shared)
 */
const TooltipIcon: React.FC<{ tooltip: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-300 cursor-help">
        ?
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};