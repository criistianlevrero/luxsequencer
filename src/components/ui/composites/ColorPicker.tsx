import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Input } from '../primitives';

export interface ColorPreset {
  name: string;
  value: string;
}

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  format?: 'hex' | 'rgb' | 'hsl';
  palette?: string[];
  presets?: ColorPreset[];
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
  format = 'hex',
  palette,
  presets,
}) => {
  const [colorMode, setColorMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const colorInputRef = useRef<HTMLInputElement>(null);

  const parseColor = useCallback((colorValue: string) => {
    if (colorValue.startsWith('#') && colorValue.length >= 7) {
      const hex = colorValue.slice(1, 7);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, hex: colorValue.slice(0, 7), alpha: 1 };
    }

    if (colorValue.startsWith('rgb')) {
      const match = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match;
        const hex = `#${[r, g, b].map((channel) => parseInt(channel, 10).toString(16).padStart(2, '0')).join('')}`;
        return { r: parseInt(r, 10), g: parseInt(g, 10), b: parseInt(b, 10), hex, alpha: 1 };
      }
    }

    return { r: 0, g: 0, b: 0, hex: '#000000', alpha: 1 };
  }, []);

  const rgbToHsl = useCallback((r: number, g: number, b: number) => {
    const normalizedR = r / 255;
    const normalizedG = g / 255;
    const normalizedB = b / 255;

    const maxChannel = Math.max(normalizedR, normalizedG, normalizedB);
    const minChannel = Math.min(normalizedR, normalizedG, normalizedB);
    let hue = 0;
    let saturation = 0;
    const lightness = (maxChannel + minChannel) / 2;

    if (maxChannel !== minChannel) {
      const delta = maxChannel - minChannel;
      saturation = lightness > 0.5 ? delta / (2 - maxChannel - minChannel) : delta / (maxChannel + minChannel);

      switch (maxChannel) {
        case normalizedR:
          hue = (normalizedG - normalizedB) / delta + (normalizedG < normalizedB ? 6 : 0);
          break;
        case normalizedG:
          hue = (normalizedB - normalizedR) / delta + 2;
          break;
        case normalizedB:
          hue = (normalizedR - normalizedG) / delta + 4;
          break;
        default:
          break;
      }

      hue /= 6;
    }

    return {
      h: Math.round(hue * 360),
      s: Math.round(saturation * 100),
      l: Math.round(lightness * 100),
    };
  }, []);

  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    const hue = h / 360;
    const saturation = s / 100;
    const lightness = l / 100;

    const hueToRgb = (p: number, q: number, t: number) => {
      let next = t;
      if (next < 0) next += 1;
      if (next > 1) next -= 1;
      if (next < 1 / 6) return p + (q - p) * 6 * next;
      if (next < 1 / 2) return q;
      if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
      return p;
    };

    let normalizedR = 0;
    let normalizedG = 0;
    let normalizedB = 0;

    if (saturation === 0) {
      normalizedR = lightness;
      normalizedG = lightness;
      normalizedB = lightness;
    } else {
      const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
      const p = 2 * lightness - q;
      normalizedR = hueToRgb(p, q, hue + 1 / 3);
      normalizedG = hueToRgb(p, q, hue);
      normalizedB = hueToRgb(p, q, hue - 1 / 3);
    }

    return {
      r: Math.round(normalizedR * 255),
      g: Math.round(normalizedG * 255),
      b: Math.round(normalizedB * 255),
    };
  }, []);

  const color = useMemo(() => parseColor(value), [parseColor, value]);
  const hsl = useMemo(() => rgbToHsl(color.r, color.g, color.b), [color.b, color.g, color.r, rgbToHsl]);

  const normalizedPalette = useMemo(() => (
    palette || [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#FF8000', '#8000FF', '#00FF80', '#FF0080', '#80FF00', '#0080FF',
      '#FFFFFF', '#C0C0C0', '#808080', '#404040', '#202020', '#000000',
    ]
  ), [palette]);

  const applyColorByFormat = useCallback((hexValue: string) => {
    if (format === 'rgb') {
      const parsed = parseColor(hexValue);
      onChange(`rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`);
      return;
    }

    if (format === 'hsl') {
      const parsed = parseColor(hexValue);
      const nextHsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
      onChange(`hsl(${nextHsl.h}, ${nextHsl.s}%, ${nextHsl.l}%)`);
      return;
    }

    onChange(hexValue);
  }, [format, onChange, parseColor, rgbToHsl]);

  const handleEyeDropper = useCallback(async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - experimental API
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        applyColorByFormat(result.sRGBHex);
      } catch {
      }
    }
  }, [applyColorByFormat]);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="flex gap-3">
          <div
            className={[
              'h-12 w-12 cursor-pointer rounded-lg border-2 shadow-inner',
              disabled ? 'cursor-not-allowed border-gray-600 opacity-50' : 'border-gray-500 hover:border-gray-400',
            ].join(' ')}
            style={{ backgroundColor: color.hex }}
            onClick={() => !disabled && colorInputRef.current?.click()}
          />

          <Input
            ref={colorInputRef}
            type="color"
            value={color.hex}
            onChange={(event) => applyColorByFormat(event.target.value)}
            disabled={disabled}
            className="sr-only"
            unstyled
          />

          <div className="flex-1 space-y-2">
            <div className="flex gap-1">
              {(['hex', 'rgb', 'hsl'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant="secondary"
                  size="sm"
                  onClick={() => setColorMode(mode)}
                  disabled={disabled}
                  className={[
                    'px-2 uppercase',
                    colorMode === mode ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
                    disabled ? 'cursor-not-allowed opacity-50' : '',
                  ].join(' ').trim()}
                >
                  {mode}
                </Button>
              ))}

              {'EyeDropper' in window && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEyeDropper}
                  disabled={disabled}
                  className={[
                    'px-2 bg-gray-700 text-gray-300 hover:bg-gray-600',
                    disabled ? 'cursor-not-allowed opacity-50' : '',
                  ].join(' ').trim()}
                  title="Pick color from screen"
                >
                  💧
                </Button>
              )}
            </div>

            {colorMode === 'hex' && (
              <Input
                type="text"
                value={color.hex}
                onChange={(event) => {
                  const hexValue = event.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(hexValue) && hexValue.length === 7) {
                    applyColorByFormat(hexValue);
                  }
                }}
                disabled={disabled}
                className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 font-mono text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                placeholder="#RRGGBB"
                unstyled
              />
            )}

            {colorMode === 'rgb' && (
              <div className="grid grid-cols-3 gap-1">
                {(['r', 'g', 'b'] as const).map((channel) => (
                  <Input
                    key={channel}
                    type="number"
                    min={0}
                    max={255}
                    value={color[channel]}
                    onChange={(event) => {
                      const next = Math.max(0, Math.min(255, parseInt(event.target.value, 10) || 0));
                      const nextColor = { ...color, [channel]: next };
                      const hexValue = `#${[nextColor.r, nextColor.g, nextColor.b].map((valuePart) => valuePart.toString(16).padStart(2, '0')).join('')}`;
                      applyColorByFormat(hexValue);
                    }}
                    disabled={disabled}
                    className="w-full rounded border border-gray-600 bg-gray-700 px-1 py-1 text-xs text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    placeholder={channel.toUpperCase()}
                    unstyled
                  />
                ))}
              </div>
            )}

            {colorMode === 'hsl' && (
              <div className="grid grid-cols-3 gap-1">
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={hsl.h}
                  onChange={(event) => {
                    const nextH = Math.max(0, Math.min(360, parseInt(event.target.value, 10) || 0));
                    const nextRgb = hslToRgb(nextH, hsl.s, hsl.l);
                    const hexValue = `#${[nextRgb.r, nextRgb.g, nextRgb.b].map((valuePart) => valuePart.toString(16).padStart(2, '0')).join('')}`;
                    applyColorByFormat(hexValue);
                  }}
                  disabled={disabled}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-1 py-1 text-xs text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                  placeholder="H"
                  unstyled
                />
                {(['s', 'l'] as const).map((channel) => (
                  <Input
                    key={channel}
                    type="number"
                    min={0}
                    max={100}
                    value={hsl[channel]}
                    onChange={(event) => {
                      const nextValue = Math.max(0, Math.min(100, parseInt(event.target.value, 10) || 0));
                      const nextHsl = { ...hsl, [channel]: nextValue };
                      const nextRgb = hslToRgb(nextHsl.h, nextHsl.s, nextHsl.l);
                      const hexValue = `#${[nextRgb.r, nextRgb.g, nextRgb.b].map((valuePart) => valuePart.toString(16).padStart(2, '0')).join('')}`;
                      applyColorByFormat(hexValue);
                    }}
                    disabled={disabled}
                    className="w-full rounded border border-gray-600 bg-gray-700 px-1 py-1 text-xs text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    placeholder={channel.toUpperCase()}
                    unstyled
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {normalizedPalette.length > 0 && (
          <div>
            <div className="mb-2 text-sm text-gray-400">Palette</div>
            <div className="grid grid-cols-9 gap-1">
              {normalizedPalette.map((paletteColor, index) => (
                <Button
                  key={`${paletteColor}-${index}`}
                  onClick={() => applyColorByFormat(paletteColor)}
                  disabled={disabled}
                  unstyled
                  className={[
                    'h-6 w-6 rounded border-2 transition-transform hover:scale-110',
                    color.hex.toLowerCase() === paletteColor.toLowerCase()
                      ? 'border-white ring-2 ring-cyan-500'
                      : 'border-gray-500 hover:border-gray-400',
                    disabled ? 'cursor-not-allowed opacity-50' : '',
                  ].join(' ').trim()}
                  style={{ backgroundColor: paletteColor }}
                  title={paletteColor}
                />
              ))}
            </div>
          </div>
        )}

        {presets && presets.length > 0 && (
          <div>
            <div className="mb-2 text-sm text-gray-400">Presets</div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={`${preset.name}-${preset.value}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => applyColorByFormat(preset.value)}
                  disabled={disabled}
                  className={[
                    'flex items-center gap-2 px-3 bg-gray-700 text-gray-300 hover:bg-gray-600',
                    disabled ? 'cursor-not-allowed opacity-50' : '',
                  ].join(' ').trim()}
                >
                  <span className="h-3 w-3 rounded border border-gray-500" style={{ backgroundColor: preset.value }} />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
