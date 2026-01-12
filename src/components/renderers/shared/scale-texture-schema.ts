
import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../controls/GradientEditor';
import { t } from '../../../i18n';
// FIX: Import `ControlSection` from the root `types.ts` file.
import type { ControlSection } from '../../../types';

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the scale gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const ScaleGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => state.currentSettings.gradientColors);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement(GradientEditor, {
        title: t('controls.scaleGradient'),
        colors: colors,
        onColorsChange: (newColors) => setCurrentSetting('gradientColors', newColors),
        minColors: 2,
    });
};

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the background gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const BackgroundGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => state.currentSettings.backgroundGradientColors || []);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement(GradientEditor, {
        title: t('controls.backgroundGradient'),
        colors: colors,
        onColorsChange: (newColors) => setCurrentSetting('backgroundGradientColors', newColors),
        minColors: 1,
    });
};

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for border color picker
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const BorderColorPicker: React.FC = () => {
    const borderColor = useTextureStore(state => state.currentSettings.scaleBorderColor);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement('div', { className: "space-y-3" },
        React.createElement('div', { className: "flex justify-between items-center" },
            React.createElement('label', { htmlFor: "borderColor", className: "font-medium text-gray-300" },
                t('controls.borderColor')
            ),
            React.createElement('span', { className: "text-sm font-mono bg-gray-700 text-cyan-300 px-2 py-1 rounded uppercase" },
                borderColor
            )
        ),
        React.createElement('input', {
            id: "borderColor",
            type: "color",
            value: borderColor,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCurrentSetting('scaleBorderColor', e.target.value),
            className: "w-full h-10 p-1 bg-gray-700 border-2 border-gray-600 rounded-lg cursor-pointer"
        })
    );
};

export const getScaleTextureSchema = (): ControlSection[] => [
    {
        title: t('section.scale'),
        defaultOpen: true,
        controls: [
            { type: 'slider', id: 'scaleSize', label: t('controls.scaleSize'), min: 45, max: 400, step: 1, formatter: (v) => `${v}px` },
            { type: 'slider', id: 'scaleSpacing', label: t('controls.horizontalSpacing'), min: -0.4, max: 2.0, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'verticalOverlap', label: t('controls.verticalSpacing'), min: -0.4, max: 2.0, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'horizontalOffset', label: t('controls.horizontalOffset'), min: 0, max: 1, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'shapeMorph', label: t('controls.shapeForm'), min: 0, max: 1, step: 0.01, formatter: (v) => {
                if (v < 0.05) return t('shape.circle');
                if (v > 0.45 && v < 0.55) return t('shape.diamond');
                if (v > 0.95) return t('shape.star');
                if (v < 0.5) return t('shape.circleToDiamond');
                return t('shape.diamondToStar');
            }},
        ]
    },
    {
        title: t('section.border'),
        controls: [
            { type: 'custom', id: 'borderColor', component: BorderColorPicker },
            { type: 'slider', id: 'scaleBorderWidth', label: t('controls.borderSize'), min: 0, max: 10, step: 0.1, formatter: (v) => `${v.toFixed(1)}px` },
        ]
    },
    {
        title: t('controls.rotationSpeed'),
        controls: [
            { 
                type: 'slider',
                id: 'textureRotationSpeed', 
                label: t('controls.rotationSpeed'), 
                min: -5, 
                max: 5, 
                step: 0.1, 
                formatter: (v) => {
                    if (Math.abs(v) < 0.05) return t('shape.stopped');
                    const speed = Math.abs(v).toFixed(1);
                    return v > 0 ? `→ ${speed}` : `← ${speed}`;
                }
            },
        ]
    },
    {
        title: t('section.animation'),
        controls: [
            { type: 'custom', id: 'scaleGradient', component: ScaleGradientEditor },
            { type: 'slider', id: 'animationSpeed', label: t('controls.animationSpeed'), min: 0.10, max: 2.50, step: 0.05, formatter: (v) => `${v.toFixed(2)}x` },
            { type: 'slider', id: 'animationDirection', label: t('controls.animationDirection'), min: 0, max: 360, step: 1, formatter: (v) => `${Math.round(v)}°` },
        ]
    },
    {
        title: t('section.background'),
        controls: [
            { type: 'custom', id: 'backgroundGradient', component: BackgroundGradientEditor },
        ]
    }
];
