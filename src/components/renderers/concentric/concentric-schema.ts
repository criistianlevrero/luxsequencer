
import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../controls/GradientEditor';
import { t } from '../../../i18n';
// FIX: Import `AccordionItem` from the root `types.ts` file.
import type { AccordionItem } from '../../../types';

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the concentric gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const ConcentricGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => state.currentSettings.concentric_gradientColors ?? []);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement('div', { className: "pt-4 border-t border-gray-700/50" },
        React.createElement(GradientEditor, {
            title: t('controls.concentricLayers'),
            colors: colors,
            onColorsChange: (newColors) => setCurrentSetting('concentric_gradientColors', newColors),
            minColors: 2
        })
    );
};

export const getConcentricSchema = (): AccordionItem[] => [
    {
        title: t('section.concentric'),
        defaultOpen: true,
        controls: [
            {
                type: 'slider',
                id: 'concentric_repetitionSpeed',
                label: t('controls.animationSpeed'),
                min: 0.1,
                max: 5,
                step: 0.1,
                formatter: (v) => `${v.toFixed(1)}s`
            },
            {
                type: 'slider',
                id: 'concentric_growthSpeed',
                label: t('controls.animationSpeed'),
                min: 0.1,
                max: 5,
                step: 0.1,
                formatter: (v) => `${v.toFixed(1)}x`
            },
            {
                type: 'slider',
                id: 'concentric_initialSize',
                label: t('controls.scaleSize'),
                min: 1,
                max: 100,
                step: 1,
                formatter: (v) => `${v}px`
            },
            {
                type: 'custom',
                id: 'concentric_gradient',
                component: ConcentricGradientEditor,
            }
        ]
    }
];
