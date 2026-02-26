

import React, { useEffect, useRef } from 'react';
import { useTextureStore } from '../../../store';
import { getNestedProperty } from '../../../utils/settingsMigration';
import { usePerformanceTimer } from '../../../hooks/usePerformanceMonitoring';

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

// Interface for storing ring configuration snapshot
// Each ring remembers the settings it was created with
interface RingSnapshot {
    creationTime: number;
    initialSize: number;
    sides: number;
    strokeWidth: number;
    fillMode: string;
    growthSpeed: number;
    rotationSpeed: number;
    gradientColors: { rgb: RGBColor, hardStop: boolean }[];
}

const ConcentricRenderer: React.FC<{ className?: string }> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const hexagons = useRef<RingSnapshot[]>([]);
    const lastCreationTime = useRef<number>(0);
    
    // Performance monitoring
    const { startTimer, endTimer } = usePerformanceTimer('concentric');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawPolygon = (size: number, sides: number, rotationOffset: number) => {
            const angleStep = (Math.PI * 2) / sides;
            const angleOffset = (Math.PI / sides) + rotationOffset;
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = angleStep * i + angleOffset;
                const x = size * Math.cos(angle);
                const y = size * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
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

        const drawScene = (time: number, settings: import('../../../types').ControlSettings) => {
            // Extract values from hierarchical settings with proper typing
            const repetitionSpeed = (getNestedProperty(settings, 'renderer.concentric.repetitionSpeed') as number) ?? 0.5;
            const growthSpeed = (getNestedProperty(settings, 'renderer.concentric.growthSpeed') as number) ?? 0.5;
            const initialSize = (getNestedProperty(settings, 'renderer.concentric.initialSize') as number) ?? 10;
            const gradientColors = (getNestedProperty(settings, 'renderer.concentric.gradientColors') as any[]) ?? [];
            const sidesValue = (getNestedProperty(settings, 'renderer.concentric.sides') as number) ?? 6;
            const sides = Math.max(3, Math.min(12, Math.round(sidesValue)));
            const rotationSpeed = (getNestedProperty(settings, 'renderer.concentric.rotationSpeed') as number) ?? 0;
            const strokeWidthValue = (getNestedProperty(settings, 'renderer.concentric.strokeWidth') as number) ?? 2;
            const strokeWidth = Math.max(0.5, Math.min(10, strokeWidthValue));
            const fillMode = (getNestedProperty(settings, 'renderer.concentric.fillMode') as string) ?? 'stroke';
            const rotationRadians = (time / 1000) * (rotationSpeed * Math.PI / 180);
            const backgroundGradientColors = (getNestedProperty(settings, 'common.backgroundGradientColors') as any[]) ?? [];

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

            // Convert current gradient colors to RGB format
            const rgbGradient = gradientColors.map(c => ({ 
                rgb: hexToRgb(c.color), 
                hardStop: c.hardStop 
            })).filter((c): c is { rgb: RGBColor, hardStop: boolean } => c.rgb !== null);

            // Add new hexagon if needed - capture current configuration snapshot
            if ((time - lastCreationTime.current) > (repetitionSpeed * 1000)) {
                // Create a snapshot of current configuration for this ring
                // This ring will keep these settings forever as it grows
                const ringSnapshot: RingSnapshot = {
                    creationTime: time,
                    initialSize: initialSize,
                    sides: sides,
                    strokeWidth: strokeWidth,
                    fillMode: fillMode,
                    growthSpeed: growthSpeed,
                    rotationSpeed: rotationSpeed,
                    // Deep copy gradient colors so changes don't affect existing rings
                    gradientColors: rgbGradient.map(c => ({ 
                        rgb: { ...c.rgb }, 
                        hardStop: c.hardStop 
                    }))
                };
                hexagons.current.push(ringSnapshot);
                lastCreationTime.current = time;
            }

            // Draw hexagons using their individual stored configurations
            ctx.save();
            ctx.translate(displayWidth / 2, displayHeight / 2);

            hexagons.current.forEach(ring => {
                const age = time - ring.creationTime;
                // Use ring's own growth speed (from when it was created)
                const currentSize = ring.initialSize + age * ring.growthSpeed * 0.1;
                
                // Calculate rotation based on ring's own rotation speed and time since creation
                const ringRotationRadians = (age / 1000) * (ring.rotationSpeed * Math.PI / 180);
                
                const colorValue = (currentSize / maxDimension) % 1.0;
                // Use ring's own gradient colors (from when it was created)
                const color = calculateColorFromGradient(ring.gradientColors, colorValue);
                
                ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                // Use ring's own strokeWidth (from when it was created)
                ctx.lineWidth = ring.strokeWidth;
                // Use ring's own sides and rotation speed (from when it was created)
                drawPolygon(currentSize, ring.sides, ringRotationRadians);
                // Use ring's own fill mode (from when it was created)
                if (ring.fillMode === 'fill' || ring.fillMode === 'both') {
                    ctx.fill();
                }
                if (ring.fillMode === 'stroke' || ring.fillMode === 'both') {
                    ctx.stroke();
                }
            });

            ctx.restore();

            // Remove large hexagons that have left the screen
            hexagons.current = hexagons.current.filter(ring => {
                const age = time - ring.creationTime;
                // Use ring's own growth speed for size calculation
                const currentSize = ring.initialSize + age * ring.growthSpeed * 0.1;
                // Keep polygon visible until it exceeds the diagonal distance
                // This ensures complete fill for all polygon types including thin shapes like triangles
                return currentSize < diagonal;
            });
        };

        const animate = (time: number) => {
            // Start performance timer
            startTimer();
            
            const state = useTextureStore.getState();
            // Use hierarchical settings directly
            drawScene(time, state.currentSettings);
            
            // End performance timer
            endTimer();
            
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [startTimer, endTimer]);

    return <canvas ref={canvasRef} className={className} />;
};

export default ConcentricRenderer;
