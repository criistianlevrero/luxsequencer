
import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../controls/GradientEditor';
// FIX: Import `ControlSection` from the root `types.ts` file.
import type { ControlSection } from '../../../types';

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the scale gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const ScaleGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => state.currentSettings.gradientColors);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement(GradientEditor, {
        title: "Gradiente de Escamas",
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
        title: "Gradiente de Fondo",
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
                "Color de Borde"
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

export const scaleTextureSchema: ControlSection[] = [
    {
        title: "Controles de Textura",
        defaultOpen: true,
        controls: [
            { type: 'slider', id: 'scaleSize', label: 'Tamaño', min: 45, max: 400, step: 1, formatter: (v) => `${v}px` },
            { type: 'slider', id: 'scaleSpacing', label: 'Espaciado Horizontal', min: -0.4, max: 2.0, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'verticalOverlap', label: 'Espaciado Vertical', min: -0.4, max: 2.0, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'horizontalOffset', label: 'Desplazamiento Horizontal', min: 0, max: 1, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'shapeMorph', label: 'Forma de Escama', min: 0, max: 1, step: 0.01, formatter: (v) => {
                if (v < 0.05) return 'Círculo';
                if (v > 0.45 && v < 0.55) return 'Rombo';
                if (v > 0.95) return 'Estrella';
                if (v < 0.5) return 'Círculo → Rombo';
                return 'Rombo → Estrella';
            }},
        ]
    },
    {
        title: "Controles de Borde",
        controls: [
            { type: 'custom', id: 'borderColor', component: BorderColorPicker },
            { type: 'slider', id: 'scaleBorderWidth', label: 'Grosor de Borde', min: 0, max: 10, step: 0.1, formatter: (v) => `${v.toFixed(1)}px` },
        ]
    },
    {
        title: "Transformación de Textura",
        controls: [
            { 
                type: 'slider',
                id: 'textureRotationSpeed', 
                label: 'Rotación de Textura', 
                min: -5, 
                max: 5, 
                step: 0.1, 
                formatter: (v) => {
                    if (Math.abs(v) < 0.05) return 'Detenido';
                    const speed = Math.abs(v).toFixed(1);
                    return v > 0 ? `→ ${speed}` : `← ${speed}`;
                }
            },
        ]
    },
    {
        title: "Gradiente y Animación",
        controls: [
            { type: 'custom', id: 'scaleGradient', component: ScaleGradientEditor },
            { type: 'slider', id: 'animationSpeed', label: 'Velocidad de Animación', min: 0.10, max: 2.50, step: 0.05, formatter: (v) => `${v.toFixed(2)}x` },
            { type: 'slider', id: 'animationDirection', label: 'Dirección de Animación', min: 0, max: 360, step: 1, formatter: (v) => `${Math.round(v)}°` },
        ]
    },
    {
        title: "Fondo",
        controls: [
            { type: 'custom', id: 'backgroundGradient', component: BackgroundGradientEditor },
        ]
    }
];
