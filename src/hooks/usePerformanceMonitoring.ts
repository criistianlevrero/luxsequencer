/**
 * Performance Monitoring Hook
 * 
 * React hook for integrating performance monitoring with components.
 * Provides easy access to metrics, alerts, and monitoring controls.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useTextureStore } from '../store';
import { PerformanceStoreManager } from '../store/slices/performance.slice';
import { PerformanceMetrics, PerformanceThresholds, PerformanceAlert } from '../utils/performanceMetrics';

/**
 * Performance monitoring hook return type
 */
export interface UsePerformanceMonitoringReturn {
  // Current metrics
  metrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  
  // Performance analysis
  performanceScore: number;
  recommendations: string[];
  
  // Session statistics
  sessionStats: {
    totalFrames: number;
    averageFPS: number;
    peakMemoryUsage: number;
    alertsGenerated: number;
    sessionDuration: number;
  };
  
  // Renderer profiling
  rendererProfile: {
    [rendererId: string]: {
      averageRenderTime: number;
      peakRenderTime: number;
      totalFrames: number;
      lastUpdate: number;
    };
  };
  
  // History data for charts
  history: {
    fps: Array<{ timestamp: number; value: number }>;
    memory: Array<{ timestamp: number; value: number }>;
    renderTime: Array<{ timestamp: number; value: number }>;
  };
  
  // Controls
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  
  // Render time tracking
  recordRenderTime: (renderTime: number, rendererId?: string) => void;
  
  // Alert management
  acknowledgeAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Threshold management
  updateThresholds: (thresholds: Partial<PerformanceThresholds>) => void;
  resetThresholds: () => void;
  
  // Settings
  settings: {
    enableAlerts: boolean;
    enableProfiling: boolean;
    historySize: number;
    updateInterval: number;
    enableWebGLProfiling: boolean;
  };
  updateSettings: (settings: Partial<{
    enableAlerts: boolean;
    enableProfiling: boolean;
    historySize: number;
    updateInterval: number;
    enableWebGLProfiling: boolean;
  }>) => void;
}

/**
 * Performance monitoring hook
 * 
 * @param options Configuration options for performance monitoring
 * @returns Performance monitoring interface
 */
export const usePerformanceMonitoring = (options: {
  autoStart?: boolean;
  trackRenderer?: string;
} = {}): UsePerformanceMonitoringReturn => {
  const { autoStart = false, trackRenderer } = options;
  
  // Store state and actions
  const performanceState = useTextureStore((state) => ({
    metrics: state.metrics,
    alerts: state.alerts,
    isMonitoring: state.isMonitoring,
    sessionStats: state.sessionStats,
    rendererProfile: state.rendererProfile,
    history: state.history,
    settings: state.settings,
    thresholds: state.thresholds,
    
    // Actions
    startMonitoring: state.startMonitoring,
    stopMonitoring: state.stopMonitoring,
    resetMetrics: state.resetMetrics,
    recordRenderTime: state.recordRenderTime,
    acknowledgeAlert: state.acknowledgeAlert,
    clearAllAlerts: state.clearAllAlerts,
    updateThresholds: state.updateThresholds,
    resetThresholds: state.resetThresholds,
    updateSettings: state.updateSettings,
  }));
  
  // Performance store manager reference
  const managerRef = useRef<PerformanceStoreManager | null>(null);
  
  // Initialize performance store manager
  useEffect(() => {
    if (!managerRef.current) {
      const getState = () => useTextureStore.getState();
      const setState = (updater: any) => useTextureStore.setState(updater);
      
      managerRef.current = new PerformanceStoreManager(getState, setState);
      managerRef.current.initialize();
      
      // Auto-start if requested
      if (autoStart) {
        managerRef.current.startMonitoring();
      }
    }
    
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
        managerRef.current = null;
      }
    };
  }, [autoStart]);
  
  // Enhanced record render time with renderer tracking
  const recordRenderTime = useCallback((renderTime: number, rendererId?: string) => {
    if (managerRef.current) {
      const targetRenderer = rendererId || trackRenderer;
      managerRef.current.recordRenderTime(renderTime, targetRenderer);
    }
  }, [trackRenderer]);
  
  // Calculate performance score
  const performanceScore = performanceState.metrics 
    ? calculatePerformanceScore(performanceState.metrics)
    : 0;
  
  // Generate recommendations
  const recommendations = performanceState.metrics 
    ? generateRecommendations(performanceState.metrics)
    : [];
  
  return {
    ...performanceState,
    performanceScore,
    recommendations,
    recordRenderTime,
  };
};

/**
 * Performance timer hook for measuring render times
 * 
 * @param rendererId Optional renderer identifier
 * @returns Timer functions for measuring performance
 */
export const usePerformanceTimer = (rendererId?: string) => {
  const { recordRenderTime } = usePerformanceMonitoring({ trackRenderer: rendererId });
  const startTimeRef = useRef<number>(0);
  
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);
  
  const endTimer = useCallback(() => {
    if (startTimeRef.current > 0) {
      const endTime = performance.now();
      const renderTime = endTime - startTimeRef.current;
      recordRenderTime(renderTime, rendererId);
      startTimeRef.current = 0;
      return renderTime;
    }
    return 0;
  }, [recordRenderTime, rendererId]);
  
  const measureAsync = useCallback(async <T>(fn: () => Promise<T>): Promise<{ result: T; renderTime: number }> => {
    startTimer();
    const result = await fn();
    const renderTime = endTimer();
    return { result, renderTime };
  }, [startTimer, endTimer]);
  
  const measure = useCallback(<T>(fn: () => T): { result: T; renderTime: number } => {
    startTimer();
    const result = fn();
    const renderTime = endTimer();
    return { result, renderTime };
  }, [startTimer, endTimer]);
  
  return {
    startTimer,
    endTimer,
    measure,
    measureAsync,
  };
};

/**
 * Performance alerts hook for managing alerts
 * 
 * @returns Alert management interface
 */
export const usePerformanceAlerts = () => {
  const alertState = useTextureStore((state) => ({
    alerts: state.alerts,
    acknowledgeAlert: state.acknowledgeAlert,
    clearAllAlerts: state.clearAllAlerts,
    settings: state.settings,
  }));
  
  // Get unacknowledged alerts
  const unacknowledgedAlerts = alertState.alerts.filter(alert => !alert.acknowledged);
  
  // Get alerts by type
  const criticalAlerts = alertState.alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alertState.alerts.filter(alert => alert.type === 'warning');
  
  // Get alerts by category
  const alertsByCategory = alertState.alerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = [];
    }
    acc[alert.category].push(alert);
    return acc;
  }, {} as Record<string, PerformanceAlert[]>);
  
  return {
    alerts: alertState.alerts,
    unacknowledgedAlerts,
    criticalAlerts,
    warningAlerts,
    alertsByCategory,
    acknowledgeAlert: alertState.acknowledgeAlert,
    clearAllAlerts: alertState.clearAllAlerts,
    hasUnacknowledgedAlerts: unacknowledgedAlerts.length > 0,
    hasCriticalAlerts: criticalAlerts.length > 0,
  };
};

/**
 * Utility functions for performance calculations
 */

// Calculate performance score (0-100)
function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // FPS impact (40% of score)
  const targetFPS = 60;
  const fpsRatio = Math.min(metrics.fps / targetFPS, 1);
  score -= (1 - fpsRatio) * 40;
  
  // Memory usage impact (30% of score)
  const memoryImpact = Math.max(0, (metrics.memoryUsage.percentageUsed - 50) / 50);
  score -= memoryImpact * 30;
  
  // Render time impact (30% of score)
  const maxAcceptableRenderTime = 16; // 60fps = 16ms per frame
  const renderTimeImpact = Math.max(0, (metrics.renderTime.average - maxAcceptableRenderTime) / maxAcceptableRenderTime);
  score -= Math.min(renderTimeImpact * 30, 30);
  
  return Math.max(0, Math.min(100, score));
}

// Generate performance recommendations
function generateRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.fps < 30) {
    recommendations.push('Consider lowering texture resolution or reducing visual effects');
  } else if (metrics.fps < 45) {
    recommendations.push('Frame rate could be improved - try optimizing settings');
  }
  
  if (metrics.memoryUsage.percentageUsed > 85) {
    recommendations.push('Memory usage is critical - consider reloading the page');
  } else if (metrics.memoryUsage.percentageUsed > 70) {
    recommendations.push('Memory usage is high - monitor for potential memory leaks');
  }
  
  if (metrics.renderTime.average > 20) {
    recommendations.push('Render time is high - optimize shaders or reduce complexity');
  } else if (metrics.renderTime.average > 12) {
    recommendations.push('Render time could be improved - check for optimization opportunities');
  }
  
  // Frame time stability analysis
  if (metrics.frameTimeHistory.length > 10) {
    const variance = calculateVariance(metrics.frameTimeHistory);
    if (variance > 25) {
      recommendations.push('Frame rate is unstable - check for background processes or thermal throttling');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance is optimal! 🚀');
  }
  
  return recommendations;
}

// Calculate variance of an array
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
}