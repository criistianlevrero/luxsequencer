import type { ControlSettings } from '../types';
import type {
  ControlType,
  PropertyDependency,
  SliderConstraints as SharedSliderConstraints,
  ColorConstraints as SharedColorConstraints,
  GradientConstraints as SharedGradientConstraints,
  SelectConstraints as SharedSelectConstraints,
  ToggleConstraints as SharedToggleConstraints,
  Vector2DConstraints as SharedVector2DConstraints,
  RangeConstraints as SharedRangeConstraints,
  TextConstraints as SharedTextConstraints,
  ControlConstraints as SharedControlConstraints,
  StandardControlSpec as SharedStandardControlSpec,
  RendererControlSpec as SharedRendererControlSpec,
  DeclarativeControlSchema,
} from '@luxsequencer/contracts/declarative-controls';

export type {
  ControlType,
  PropertyDependency,
  DeclarativeControlSchema,
};

export type AllowedControlType = ControlType;

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  description?: string;
}

export interface SelectOption {
  value: unknown;
  label: string;
  description?: string;
  icon?: string;
  group?: string;
}

export interface PresetValue {
  name: string;
  value: unknown;
  description?: string;
}

export type SliderConstraints = Omit<SharedSliderConstraints, 'defaultValue' | 'formatter' | 'valueLabels'> & {
  defaultValue?: number;
  formatter?: (value: number) => string;
  valueLabels?: ((value: number) => string) | Record<number | string, string>;
};
export type ColorConstraints = SharedColorConstraints;
export type ToggleConstraints = SharedToggleConstraints;
export type Vector2DConstraints = SharedVector2DConstraints;
export type RangeConstraints = SharedRangeConstraints;
export type TextConstraints = SharedTextConstraints;

export type GradientConstraints = SharedGradientConstraints & {
  presetPalettes?: ColorPalette[];
  colorSpace?: 'rgb' | 'hsl' | 'lab';
};

export type SelectConstraints = Omit<SharedSelectConstraints, 'options'> & {
  options: SelectOption[];
};

export interface ControlConstraints extends Omit<SharedControlConstraints, 'slider' | 'gradient' | 'select'> {
  slider?: SliderConstraints;
  gradient?: GradientConstraints;
  select?: SelectConstraints;
}

export interface StandardControlSpec extends Omit<SharedStandardControlSpec, 'constraints' | 'presets' | 'metadata'> {
  id: string;
  constraints: ControlConstraints;
  presets?: PresetValue[];
  metadata?: {
    description?: string;
    tooltip?: string;
    units?: string;
    category?: string;
    order?: number;
    presets?: PresetValue[];
    dependencies?: PropertyDependency[];
  };
}

export interface RendererControlSpec extends Omit<SharedRendererControlSpec, 'standard'> {
  standard: StandardControlSpec[];
}

export interface ControlRenderContext {
  settings: ControlSettings;
  rendererId: string;
  timestamp: number;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export interface BaseControlProps<T = unknown> {
  spec: StandardControlSpec;
  value: T;
  onChange: (value: T) => void;
  context: ControlRenderContext;
  disabled?: boolean;
}

export interface SliderControlProps extends BaseControlProps<number> {
  spec: StandardControlSpec & { constraints: { slider: SliderConstraints } };
}

export interface ColorControlProps extends BaseControlProps<string> {
  spec: StandardControlSpec & { constraints: { color: ColorConstraints } };
}

export interface GradientControlProps extends BaseControlProps<unknown[] | string> {
  spec: StandardControlSpec & { constraints: { gradient: GradientConstraints } };
}

export interface Vector2DControlProps extends BaseControlProps<{ x: number; y: number }> {
  spec: StandardControlSpec & { constraints: { vector2d: Vector2DConstraints } };
}

export interface SelectControlProps extends BaseControlProps<unknown> {
  spec: StandardControlSpec & { constraints: { select: SelectConstraints } };
}

export interface ToggleControlProps extends BaseControlProps<boolean> {
  spec: StandardControlSpec & { constraints: { toggle: ToggleConstraints } };
}

export interface RangeControlProps extends BaseControlProps<{ min: number; max: number }> {
  spec: StandardControlSpec & { constraints: { range: RangeConstraints } };
}

export interface TextControlProps extends BaseControlProps<string> {
  spec: StandardControlSpec & { constraints: { text: TextConstraints } };
}
