

import React, { useEffect, useRef } from 'react';
import { useTextureStore } from '../../../store';
import type { ControlSettings, GradientColor } from '../../../types';
import { useConcentricCompatibleSettings } from '../../../utils/settingsMigration';

type RGBColor = { r: number, g: number, b: number };

// --- Helper Functions ---
const hexToRgb = (hex: string): RGBColor | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};
const lerp = (a: number, b: number, amount: number): number => (1 - amount) * a + amount * b;
const lerpColor = (colorA: RGBColor, colorB: RGBColor, amount: number): RGBColor => ({
    r: Math.round(lerp(colorA.r, colorB.r, amount)),
    g: Math.round(lerp(colorA.g, colorB.g, amount)),
    b: Math.round(lerp(colorA.b, colorB.b, amount)),
});

const ConcentricRenderer: React.FC<{ className?: string }> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const hexagons = useRef<{ creationTime: number, initialSize: number }[]>([]);
    const lastCreationTime = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawHexagon = (size: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + Math.PI / 6;
                const x = size * Math.cos(angle);
                const y = size * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        };

        const calculateColorFromGradient = (
            gradient: { rgb: RGBColor, hardStop: boolean }[],
            animationValue: number
        ): RGBColor => {
             if (gradient.length === 0) return { r: 255, g: 255, b: 255 };
             if (gradient.length === 1) return gradient[0].rgb;
             const effectiveGradient = [...gradient, gradient[0]];
             const numSegments = effectiveGradient.length - 1;
             if (numSegments <= 0) return gradient[0].rgb;
             const normalizedValue = (animationValue < 0 ? animationValue % 1 + 1 : animationValue % 1);
             const colorPosition = normalizedValue * numSegments;
             const startIndex = Math.floor(colorPosition);
             const endIndex = Math.min(startIndex + 1, effectiveGradient.length - 1);
             const amount = colorPosition - startIndex;
             return lerpColor(effectiveGradient[startIndex].rgb, effectiveGradient[endIndex].rgb, amount);
        };

        const drawScene = (time: number, settings: ControlSettings) => {
            const {
                concentric_repetitionSpeed = 0.5,
                concentric_growthSpeed = 0.5,
                concentric_initialSize = 10,
                concentric_gradientColors = [],
                backgroundGradientColors = [],
            } = settings;

            const dpr = window.devicePixelRatio || 1;
            const displayWidth = canvas.offsetWidth;
            const displayHeight = canvas.offsetHeight;
            const maxDimension = Math.max(displayWidth, displayHeight);
            const diagonal = Math.sqrt(displayWidth*displayWidth + displayHeight*displayHeight);

            if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
                canvas.width = displayWidth * dpr;
                canvas.height = displayHeight * dpr;
                ctx.scale(dpr, dpr);
            }

            // Background
            if (backgroundGradientColors.length === 1) {
                ctx.fillStyle = backgroundGradientColors[0].color;
            } else if (backgroundGradientColors.length > 1) {
                const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight);
                backgroundGradientColors.forEach((c, i) => {
                    gradient.addColorStop(i / (backgroundGradientColors.length - 1), c.color);
                });
                ctx.fillStyle = gradient;
            } else {
                 ctx.fillStyle = '#1f2937';
            }
            ctx.fillRect(0, 0, displayWidth, displayHeight);

            // Add new hexagon if needed
            if ((time - lastCreationTime.current) > (concentric_repetitionSpeed * 1000)) {
                hexagons.current.push({ creationTime: time, initialSize: concentric_initialSize });
                lastCreationTime.current = time;
            }

            // Draw hexagons
            ctx.save();
            ctx.translate(displayWidth / 2, displayHeight / 2);
            ctx.lineWidth = 2;

            const rgbGradient = concentric_gradientColors.map(c => ({ rgb: hexToRgb(c.color), hardStop: c.hardStop })).filter((c): c is { rgb: RGBColor, hardStop: boolean } => c.rgb !== null);

            hexagons.current.forEach(hex => {
                const age = time - hex.creationTime;
                const currentSize = hex.initialSize + age * concentric_growthSpeed * 0.1;
                
                const colorValue = (currentSize / maxDimension) % 1.0;
                const color = calculateColorFromGradient(rgbGradient, colorValue);
                
                ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                drawHexagon(currentSize);
            });

            ctx.restore();

            // Remove large hexagons
            hexagons.current = hexagons.current.filter(hex => {
                const age = time - hex.creationTime;
                const currentSize = hex.initialSize + age * concentric_growthSpeed * 0.1;
                return currentSize < diagonal / 2;
            });
        };

        const animate = (time: number) => {
            const state = useTextureStore.getState();
            // Use compatibility adapter to get settings in expected format
            const currentSettings = useConcentricCompatibleSettings(state.currentSettings);
            drawScene(time, currentSettings);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return <canvas ref={canvasRef} className={className} />;
};

export default ConcentricRenderer;
