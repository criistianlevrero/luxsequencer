
import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../controls/GradientEditor';
import { t } from '../../../i18n';
// FIX: Import `AccordionItem` from the root `types.ts` file.
import type { AccordionItem } from '../../../types';
import { getNestedProperty } from '../../../utils/settingsMigration';

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the scale gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const ScaleGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => getNestedProperty(state.currentSettings, 'renderer.webgl.gradientColors') || []);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement(GradientEditor, {
        title: t('controls.scaleGradient'),
        colors: colors,
        onColorsChange: (newColors) => setCurrentSetting('renderer.webgl.gradientColors', newColors),
        minColors: 2,
    });
};

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the background gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const BackgroundGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => getNestedProperty(state.currentSettings, 'common.backgroundGradientColors') || []);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement(GradientEditor, {
        title: t('controls.backgroundGradient'),
        colors: colors,
        onColorsChange: (newColors) => setCurrentSetting('common.backgroundGradientColors', newColors),
        minColors: 1,
    });
};

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for border color picker
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const BorderColorPicker: React.FC = () => {
    const borderColor = useTextureStore(state => getNestedProperty(state.currentSettings, 'renderer.webgl.scaleBorderColor') || '#000000');
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
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCurrentSetting('renderer.webgl.scaleBorderColor', e.target.value),
            className: "w-full h-10 p-1 bg-gray-700 border-2 border-gray-600 rounded-lg cursor-pointer"
        })
    );
};

export const getScaleTextureSchema = (): AccordionItem[] => [
    // Motor de Renderizado (esto lo maneja el ControlPanel, no está aquí)
    
    // Patrones (esto lo maneja el ControlPanel, no está aquí)
    
    // Primer separador
    { type: 'separator', id: 'separator-1' },
    
    // Configuración de Escama
    {
        title: t('section.scale'),
        defaultOpen: true,
        controls: [
            { type: 'slider', id: 'renderer.webgl.scaleSize', label: t('controls.scaleSize'), min: 45, max: 400, step: 1, formatter: (v) => `${v}px` },
            { type: 'slider', id: 'renderer.webgl.scaleSpacing', label: t('controls.horizontalSpacing'), min: -0.4, max: 2.0, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'renderer.webgl.verticalOverlap', label: t('controls.verticalSpacing'), min: -0.4, max: 2.0, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'renderer.webgl.horizontalOffset', label: t('controls.horizontalOffset'), min: 0, max: 1, step: 0.01, formatter: (v) => `${(v * 100).toFixed(0)}%` },
            { type: 'slider', id: 'renderer.webgl.shapeMorph', label: t('controls.shapeForm'), min: 0, max: 1, step: 0.01, formatter: (v) => {
                if (v < 0.05) return t('shape.circle');
                if (v > 0.45 && v < 0.55) return t('shape.diamond');
                if (v > 0.95) return t('shape.star');
                if (v < 0.5) return t('shape.circleToDiamond');
                return t('shape.diamondToStar');
            }},
        ]
    },
    
    // Borde
    {
        title: t('section.border'),
        controls: [
            { type: 'custom', id: 'borderColor', component: BorderColorPicker },
            { type: 'slider', id: 'renderer.webgl.scaleBorderWidth', label: t('controls.borderSize'), min: 0, max: 10, step: 0.1, formatter: (v) => `${v.toFixed(1)}px` },
        ]
    },
    
    // Velocidad de Rotación
    {
        title: t('controls.rotationSpeed'),
        controls: [
            { 
                type: 'slider',
                id: 'renderer.webgl.textureRotationSpeed', 
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
    
    // Color de Escamas y Animación
    {
        title: t('section.animation'),
        controls: [
            { type: 'custom', id: 'scaleGradient', component: ScaleGradientEditor },
            { type: 'slider', id: 'common.animationSpeed', label: t('controls.animationSpeed'), min: 0.10, max: 2.50, step: 0.05, formatter: (v) => `${v.toFixed(2)}x` },
            { type: 'slider', id: 'common.animationDirection', label: t('controls.animationDirection'), min: 0, max: 360, step: 1, formatter: (v) => `${Math.round(v)}°` },
        ]
    },
    
    // Fondo
    {
        title: t('section.background'),
        controls: [
            { type: 'custom', id: 'backgroundGradient', component: BackgroundGradientEditor },
        ]
    },
    
    // Segundo separador
    { type: 'separator', id: 'separator-2' },
    
    // Configuración Global (esto lo maneja el ControlPanel, no está aquí)
];
