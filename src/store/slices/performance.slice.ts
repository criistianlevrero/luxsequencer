/**
 * Performance Store Slice
 * 
 * Zustand slice for managing performance metrics, thresholds, and alerts.
 * Integrates with the performance monitoring system.
 */

import { StateCreator } from 'zustand';
import { 
  PerformanceMetrics, 
  PerformanceThresholds, 
  PerformanceAlert, 
  PerformanceMetricsCollector, 
  PerformanceAlertManager,
  DEFAULT_THRESHOLDS 
} from '../../utils/performanceMetrics';
import { config } from '../../config';

export interface PerformanceState {
  // Core performance data
  metrics: PerformanceMetrics | null;
  thresholds: PerformanceThresholds;
  alerts: PerformanceAlert[];
  
  // Performance monitoring state
  isMonitoring: boolean;
  monitoringStartTime: number | null;
  
  // Settings
  settings: {
    enableAlerts: boolean;
    enableProfiling: boolean;
    historySize: number;
    updateInterval: number; // ms
    enableWebGLProfiling: boolean;
  };
  
  // Performance history for charts
  history: {
    fps: Array<{ timestamp: number; value: number }>;
    memory: Array<{ timestamp: number; value: number }>;
    renderTime: Array<{ timestamp: number; value: number }>;
  };
  
  // Renderer-specific profiling
  rendererProfile: {
    [rendererId: string]: {
      averageRenderTime: number;
      peakRenderTime: number;
      totalFrames: number;
      lastUpdate: number;
    };
  };
  
  // Session statistics
  sessionStats: {
    totalFrames: number;
    averageFPS: number;
    peakMemoryUsage: number;
    alertsGenerated: number;
    sessionDuration: number; // ms
  };
}

export interface PerformanceActions {
  // Monitoring control
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  
  // Metrics updates
  updateMetrics: (metrics: PerformanceMetrics) => void;
  updateWebGLMetrics: (update: Partial<NonNullable<PerformanceMetrics['webgl']>>) => void;
  recordRenderTime: (rendererId: string, renderTime: number) => void;
  
  // Threshold management
  updateThresholds: (thresholds: Partial<PerformanceThresholds>) => void;
  resetThresholds: () => void;
  
  // Alert management
  updateAlerts: (alerts: PerformanceAlert[]) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Settings
  updateSettings: (settings: Partial<PerformanceState['settings']>) => void;
  
  // History management
  addHistoryPoint: (type: 'fps' | 'memory' | 'renderTime', value: number) => void;
  clearHistory: () => void;
  
  // Session management
  updateSessionStats: (stats: Partial<PerformanceState['sessionStats']>) => void;
}

export type PerformanceSlice = PerformanceState & PerformanceActions;

/**
 * Initial state for performance monitoring
 */
const initialState: PerformanceState = {
  metrics: null,
  thresholds: DEFAULT_THRESHOLDS,
  alerts: [],
  
  isMonitoring: false,
  monitoringStartTime: null,
  
  settings: {
    enableAlerts: true,
    enableProfiling: config.debugMode,
    historySize: 300, // 5 minutes at 60fps
    updateInterval: 1000, // Update every second
    enableWebGLProfiling: config.debugMode,
  },
  
  history: {
    fps: [],
    memory: [],
    renderTime: [],
  },
  
  rendererProfile: {},
  
  sessionStats: {
    totalFrames: 0,
    averageFPS: 0,
    peakMemoryUsage: 0,
    alertsGenerated: 0,
    sessionDuration: 0,
  },
};

/**
 * Create the performance slice
 */
export const createPerformanceSlice: StateCreator<
  PerformanceSlice,
  [],
  [],
  PerformanceSlice
> = (set, __get) => ({
  ...initialState,
  
  // Monitoring control
  startMonitoring: () => {
    set((state) => ({
      ...state,
      isMonitoring: true,
      monitoringStartTime: Date.now(),
      sessionStats: {
        ...state.sessionStats,
        totalFrames: 0,
        averageFPS: 0,
        peakMemoryUsage: 0,
        alertsGenerated: 0,
        sessionDuration: 0,
      },
    }));
  },
  
  stopMonitoring: () => {
    set((state) => ({
      ...state,
      isMonitoring: false,
      monitoringStartTime: null,
    }));
  },
  
  resetMetrics: () => {
    set((state) => ({
      ...state,
      metrics: null,
      history: {
        fps: [],
        memory: [],
        renderTime: [],
      },
      rendererProfile: {},
      sessionStats: initialState.sessionStats,
    }));
  },
  
  // Metrics updates
  updateMetrics: (metrics: PerformanceMetrics) => {
    set((state) => {
      const now = Date.now();
      const newState = { ...state, metrics };
      
      // Update session stats
      if (state.monitoringStartTime) {
        newState.sessionStats = {
          ...state.sessionStats,
          totalFrames: metrics.sampleCount,
          averageFPS: metrics.fps,
          peakMemoryUsage: Math.max(state.sessionStats.peakMemoryUsage, metrics.memoryUsage.percentageUsed),
          sessionDuration: now - state.monitoringStartTime,
        };
      }
      
      // Update history (keeping only recent data)
      const addToHistory = (history: Array<{ timestamp: number; value: number }>, value: number) => {
        const newHistory = [...history, { timestamp: now, value }];
        return newHistory.slice(-state.settings.historySize);
      };
      
      newState.history = {
        fps: addToHistory(state.history.fps, metrics.fps),
        memory: addToHistory(state.history.memory, metrics.memoryUsage.percentageUsed),
        renderTime: addToHistory(state.history.renderTime, metrics.renderTime.current),
      };
      
      return newState;
    });
  },
  
  updateWebGLMetrics: (update: Partial<NonNullable<PerformanceMetrics['webgl']>>) => {
    set((state) => {
      if (!state.metrics?.webgl) return state;
      
      return {
        ...state,
        metrics: {
          ...state.metrics,
          webgl: {
            ...state.metrics.webgl,
            ...update,
          },
        },
      };
    });
  },
  
  recordRenderTime: (rendererId: string, renderTime: number) => {
    set((state) => {
      const currentProfile = state.rendererProfile[rendererId] || {
        averageRenderTime: renderTime,
        peakRenderTime: renderTime,
        totalFrames: 0,
        lastUpdate: Date.now(),
      };
      
      const totalFrames = currentProfile.totalFrames + 1;
      const newAverageRenderTime = 
        (currentProfile.averageRenderTime * currentProfile.totalFrames + renderTime) / totalFrames;
      
      return {
        ...state,
        rendererProfile: {
          ...state.rendererProfile,
          [rendererId]: {
            averageRenderTime: newAverageRenderTime,
            peakRenderTime: Math.max(currentProfile.peakRenderTime, renderTime),
            totalFrames,
            lastUpdate: Date.now(),
          },
        },
      };
    });
  },
  
  // Threshold management
  updateThresholds: (thresholds: Partial<PerformanceThresholds>) => {
    set((state) => ({
      ...state,
      thresholds: {
        ...state.thresholds,
        ...thresholds,
      },
    }));
  },
  
  resetThresholds: () => {
    set((state) => ({
      ...state,
      thresholds: DEFAULT_THRESHOLDS,
    }));
  },
  
  // Alert management
  updateAlerts: (alerts: PerformanceAlert[]) => {
    set((state) => {
      // Count new alerts for session stats
      const newAlertsCount = alerts.filter(alert => 
        !state.alerts.some(existing => existing.id === alert.id)
      ).length;
      
      return {
        ...state,
        alerts,
        sessionStats: {
          ...state.sessionStats,
          alertsGenerated: state.sessionStats.alertsGenerated + newAlertsCount,
        },
      };
    });
  },
  
  acknowledgeAlert: (alertId: string) => {
    set((state) => ({
      ...state,
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
  },
  
  clearAllAlerts: () => {
    set((state) => ({
      ...state,
      alerts: [],
    }));
  },
  
  // Settings
  updateSettings: (settings: Partial<PerformanceState['settings']>) => {
    set((state) => ({
      ...state,
      settings: {
        ...state.settings,
        ...settings,
      },
    }));
  },
  
  // History management
  addHistoryPoint: (type: 'fps' | 'memory' | 'renderTime', value: number) => {
    set((state) => {
      const timestamp = Date.now();
      const newPoint = { timestamp, value };
      
      return {
        ...state,
        history: {
          ...state.history,
          [type]: [...state.history[type], newPoint].slice(-state.settings.historySize),
        },
      };
    });
  },
  
  clearHistory: () => {
    set((state) => ({
      ...state,
      history: {
        fps: [],
        memory: [],
        renderTime: [],
      },
    }));
  },
  
  // Session management
  updateSessionStats: (stats: Partial<PerformanceState['sessionStats']>) => {
    set((state) => ({
      ...state,
      sessionStats: {
        ...state.sessionStats,
        ...stats,
      },
    }));
  },
});

/**
 * Performance store utilities
 */
export class PerformanceStoreManager {
  private metricsCollector: PerformanceMetricsCollector;
  private alertManager: PerformanceAlertManager;
  private updateInterval: NodeJS.Timeout | null = null;
  private unsubscribeAlerts: (() => void) | null = null;
  
  constructor(
    private getState: () => PerformanceSlice,
    private setState: (updater: (state: PerformanceSlice) => void) => void
  ) {
    this.metricsCollector = new PerformanceMetricsCollector();
    this.alertManager = new PerformanceAlertManager();
  }
  
  /**
   * Initialize performance monitoring
   */
  public initialize(): void {
    // Subscribe to alert changes
    this.unsubscribeAlerts = this.alertManager.subscribe((alerts) => {
      this.getState().updateAlerts(alerts);
    });
    
    // Start monitoring if debug mode is enabled
    if (config.debugMode) {
      this.startMonitoring();
    }
  }
  
  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    const state = this.getState();
    if (state.isMonitoring) return;
    
    state.startMonitoring();
    
    // Start metrics collection
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, state.settings.updateInterval);
    
    // Start frame tracking
    this.startFrameTracking();
  }
  
  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    const state = this.getState();
    state.stopMonitoring();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Update metrics from collector
   */
  private updateMetrics(): void {
    const state = this.getState();
    if (!state.isMonitoring) return;
    
    const metrics = this.metricsCollector.getMetrics();
    state.updateMetrics(metrics);
    
    // Check for alerts if enabled
    if (state.settings.enableAlerts) {
      this.alertManager.checkMetrics(metrics, state.thresholds);
    }
  }
  
  /**
   * Start frame tracking
   */
  private startFrameTracking(): void {
    const trackFrame = () => {
      const state = this.getState();
      if (!state.isMonitoring) return;
      
      this.metricsCollector.updateFrame();
      requestAnimationFrame(trackFrame);
    };
    
    requestAnimationFrame(trackFrame);
  }
  
  /**
   * Record render time for current frame
   */
  public recordRenderTime(renderTime: number, rendererId?: string): void {
    const state = this.getState();
    if (!state.isMonitoring) return;
    
    this.metricsCollector.recordRenderTime(renderTime);
    
    if (rendererId) {
      state.recordRenderTime(rendererId, renderTime);
    }
  }
  
  /**
   * Update WebGL metrics
   */
  public updateWebGLMetrics(update: Partial<NonNullable<PerformanceMetrics['webgl']>>): void {
    this.metricsCollector.updateWebGLMetrics(update);
    this.getState().updateWebGLMetrics(update);
  }
  
  /**
   * Cleanup
   */
  public cleanup(): void {
    this.stopMonitoring();
    
    if (this.unsubscribeAlerts) {
      this.unsubscribeAlerts();
      this.unsubscribeAlerts = null;
    }
  }
}