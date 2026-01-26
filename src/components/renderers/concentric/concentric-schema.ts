
import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../controls/GradientEditor';
import { t } from '../../../i18n';
// FIX: Import `AccordionItem` from the root `types.ts` file.
import type { AccordionItem } from '../../../types';
import { getNestedProperty } from '../../../utils/settingsMigration';

// FIX: Correctly defined as a functional component returning JSX.
// Custom component for the concentric gradient editor
// FIX: Converted to React.createElement to avoid JSX parsing issues in .ts files.
const ConcentricGradientEditor: React.FC = () => {
    const colors = useTextureStore(state => getNestedProperty(state.currentSettings, 'renderer.concentric.gradientColors') ?? []);
    const { setCurrentSetting } = useTextureStore.getState();
    return React.createElement('div', { className: "pt-4 border-t border-gray-700/50" },
        React.createElement(GradientEditor, {
            title: t('controls.concentricLayers'),
            colors: colors,
            onColorsChange: (newColors) => setCurrentSetting('renderer.concentric.gradientColors', newColors),
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
                id: 'renderer.concentric.repetitionSpeed',
                label: t('controls.animationSpeed'),
                min: 0.1,
                max: 5,
                step: 0.1,
                formatter: (v) => `${v.toFixed(1)}s`
            },
            {
                type: 'slider',
                id: 'renderer.concentric.growthSpeed',
                label: t('controls.animationSpeed'),
                min: 0.1,
                max: 5,
                step: 0.1,
                formatter: (v) => `${v.toFixed(1)}x`
            },
            {
                type: 'slider',
                id: 'renderer.concentric.initialSize',
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
