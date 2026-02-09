/**
 * Performance Metrics System
 * 
 * Core utilities for capturing and analyzing performance metrics in real-time.
 * Provides FPS tracking, memory usage, render time profiling, and WebGL metrics.
 */

export interface PerformanceMetrics {
  // Frame Rate Metrics
  fps: number;
  avgFrameTime: number; // ms per frame
  minFrameTime: number;
  maxFrameTime: number;
  frameTimeHistory: number[]; // Last N frame times
  
  // Memory Metrics
  memoryUsage: {
    usedJSHeapSize: number; // Bytes
    totalJSHeapSize: number; // Bytes
    jsHeapSizeLimit: number; // Bytes
    percentageUsed: number; // 0-100
  };
  
  // Rendering Metrics
  renderTime: {
    current: number; // ms
    average: number; // ms
    max: number; // ms
    history: number[]; // Last N render times
  };
  
  // WebGL Metrics
  webgl?: {
    shaderCompileTime: number; // ms
    textureMemory: number; // Estimated bytes
    drawCalls: number; // Per frame
    triangles: number; // Per frame
    extensions: string[];
    renderer: string;
    vendor: string;
  };
  
  // System Performance
  systemMetrics: {
    cpuUsage?: number; // Estimated percentage
    deviceMemory?: number; // GB
    hardwareConcurrency: number; // CPU cores
    connection?: {
      effectiveType: string;
      downlink: number; // Mbps
    };
  };
  
  // Timestamp tracking
  lastUpdate: number;
  sampleCount: number;
}

export interface PerformanceThresholds {
  fps: {
    warning: number; // Below this shows warning
    critical: number; // Below this shows critical alert
  };
  frameTime: {
    warning: number; // Above this (ms) shows warning
    critical: number; // Above this (ms) shows critical alert
  };
  memory: {
    warning: number; // Above this percentage shows warning
    critical: number; // Above this percentage shows critical alert
  };
  renderTime: {
    warning: number; // Above this (ms) shows warning
    critical: number; // Above this (ms) shows critical alert
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  category: 'fps' | 'memory' | 'render' | 'webgl';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}

/**
 * Default performance thresholds for alerts
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: {
    warning: 45, // Below 45 FPS
    critical: 30, // Below 30 FPS
  },
  frameTime: {
    warning: 20, // Above 20ms per frame
    critical: 33, // Above 33ms per frame (30 FPS)
  },
  memory: {
    warning: 70, // Above 70% memory usage
    critical: 85, // Above 85% memory usage
  },
  renderTime: {
    warning: 10, // Above 10ms render time
    critical: 16, // Above 16ms render time
  },
};

/**
 * Performance Metrics Collector
 * Handles the actual collection and calculation of performance metrics
 */
export class PerformanceMetricsCollector {
  private metrics: PerformanceMetrics;
  private frameTimes: number[] = [];
  private renderTimes: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private historySize = 60; // Keep 60 samples (1 second at 60fps)
  
  constructor() {
    this.metrics = this.createInitialMetrics();
  }
  
  private createInitialMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      frameTimeHistory: [],
      
      memoryUsage: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        percentageUsed: 0,
      },
      
      renderTime: {
        current: 0,
        average: 0,
        max: 0,
        history: [],
      },
      
      webgl: this.collectWebGLMetrics(),
      
      systemMetrics: this.collectSystemMetrics(),
      
      lastUpdate: performance.now(),
      sampleCount: 0,
    };
  }
  
  /**
   * Update metrics with a new frame
   */
  public updateFrame(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.addFrameTime(frameTime);
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
    
    // Update memory metrics every 30 frames (~0.5 seconds)
    if (this.frameCount % 30 === 0) {
      this.updateMemoryMetrics();
    }
    
    this.metrics.lastUpdate = now;
    this.metrics.sampleCount = this.frameCount;
  }
  
  /**
   * Record render time for current frame
   */
  public recordRenderTime(renderTime: number): void {
    this.renderTimes.push(renderTime);
    
    // Keep only recent samples
    if (this.renderTimes.length > this.historySize) {
      this.renderTimes.shift();
    }
    
    this.metrics.renderTime.current = renderTime;
    this.metrics.renderTime.history = [...this.renderTimes];
    this.metrics.renderTime.average = this.calculateAverage(this.renderTimes);
    this.metrics.renderTime.max = Math.max(...this.renderTimes);
  }
  
  /**
   * Add a frame time measurement
   */
  private addFrameTime(frameTime: number): void {
    this.frameTimes.push(frameTime);
    
    // Keep only recent samples
    if (this.frameTimes.length > this.historySize) {
      this.frameTimes.shift();
    }
    
    // Update metrics
    this.metrics.frameTimeHistory = [...this.frameTimes];
    this.metrics.avgFrameTime = this.calculateAverage(this.frameTimes);
    this.metrics.minFrameTime = Math.min(...this.frameTimes);
    this.metrics.maxFrameTime = Math.max(...this.frameTimes);
    
    // Calculate FPS from average frame time
    this.metrics.fps = this.frameTimes.length > 0 ? 1000 / this.metrics.avgFrameTime : 0;
  }
  
  /**
   * Update memory usage metrics
   */
  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentageUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
  }
  
  /**
   * Collect WebGL-specific metrics
   */
  private collectWebGLMetrics() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) return undefined;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const extensions = gl.getSupportedExtensions() || [];
      
      return {
        shaderCompileTime: 0, // Will be updated during shader compilation
        textureMemory: 0, // Will be estimated based on texture usage
        drawCalls: 0, // Will be tracked per frame
        triangles: 0, // Will be tracked per frame
        extensions,
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      };
    } catch (error) {
      console.warn('Could not collect WebGL metrics:', error);
      return undefined;
    }
  }
  
  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics() {
    const nav = navigator as any;
    
    return {
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: nav.hardwareConcurrency || 1,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
      } : undefined,
    };
  }
  
  /**
   * Update WebGL-specific metrics
   */
  public updateWebGLMetrics(update: Partial<NonNullable<PerformanceMetrics['webgl']>>): void {
    if (this.metrics.webgl) {
      this.metrics.webgl = { ...this.metrics.webgl, ...update };
    }
  }
  
  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  /**
   * Get current metrics snapshot
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset all metrics
   */
  public reset(): void {
    this.frameTimes = [];
    this.renderTimes = [];
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.metrics = this.createInitialMetrics();
  }
}

/**
 * Performance Alert Manager
 * Manages alerts based on performance thresholds
 */
export class PerformanceAlertManager {
  private alerts: Map<string, PerformanceAlert> = new Map();
  private listeners: ((alerts: PerformanceAlert[]) => void)[] = [];
  private alertIdCounter = 0;
  
  /**
   * Check metrics against thresholds and generate alerts
   */
  public checkMetrics(metrics: PerformanceMetrics, thresholds: PerformanceThresholds): void {
    this.checkFPS(metrics.fps, thresholds.fps);
    this.checkFrameTime(metrics.avgFrameTime, thresholds.frameTime);
    this.checkMemory(metrics.memoryUsage.percentageUsed, thresholds.memory);
    this.checkRenderTime(metrics.renderTime.current, thresholds.renderTime);
  }
  
  private checkFPS(fps: number, thresholds: { warning: number; critical: number }): void {
    const alertId = 'fps-performance';
    
    if (fps < thresholds.critical) {
      this.createOrUpdateAlert(alertId, 'critical', 'fps', 
        `Critical: FPS dropped to ${fps.toFixed(1)}`, fps, thresholds.critical);
    } else if (fps < thresholds.warning) {
      this.createOrUpdateAlert(alertId, 'warning', 'fps', 
        `Warning: Low FPS (${fps.toFixed(1)})`, fps, thresholds.warning);
    } else {
      this.removeAlert(alertId);
    }
  }
  
  private checkFrameTime(frameTime: number, thresholds: { warning: number; critical: number }): void {
    const alertId = 'frametime-performance';
    
    if (frameTime > thresholds.critical) {
      this.createOrUpdateAlert(alertId, 'critical', 'render', 
        `Critical: Frame time ${frameTime.toFixed(1)}ms`, frameTime, thresholds.critical);
    } else if (frameTime > thresholds.warning) {
      this.createOrUpdateAlert(alertId, 'warning', 'render', 
        `Warning: High frame time (${frameTime.toFixed(1)}ms)`, frameTime, thresholds.warning);
    } else {
      this.removeAlert(alertId);
    }
  }
  
  private checkMemory(memoryUsage: number, thresholds: { warning: number; critical: number }): void {
    const alertId = 'memory-usage';
    
    if (memoryUsage > thresholds.critical) {
      this.createOrUpdateAlert(alertId, 'critical', 'memory', 
        `Critical: Memory usage ${memoryUsage.toFixed(1)}%`, memoryUsage, thresholds.critical);
    } else if (memoryUsage > thresholds.warning) {
      this.createOrUpdateAlert(alertId, 'warning', 'memory', 
        `Warning: High memory usage (${memoryUsage.toFixed(1)}%)`, memoryUsage, thresholds.warning);
    } else {
      this.removeAlert(alertId);
    }
  }
  
  private checkRenderTime(renderTime: number, thresholds: { warning: number; critical: number }): void {
    const alertId = 'render-time';
    
    if (renderTime > thresholds.critical) {
      this.createOrUpdateAlert(alertId, 'critical', 'render', 
        `Critical: Render time ${renderTime.toFixed(1)}ms`, renderTime, thresholds.critical);
    } else if (renderTime > thresholds.warning) {
      this.createOrUpdateAlert(alertId, 'warning', 'render', 
        `Warning: High render time (${renderTime.toFixed(1)}ms)`, renderTime, thresholds.warning);
    } else {
      this.removeAlert(alertId);
    }
  }
  
  private createOrUpdateAlert(
    id: string, 
    type: 'warning' | 'critical', 
    category: PerformanceAlert['category'],
    message: string, 
    value: number, 
    threshold: number
  ): void {
    const existing = this.alerts.get(id);
    
    if (existing) {
      existing.message = message;
      existing.value = value;
      existing.timestamp = Date.now();
    } else {
      this.alerts.set(id, {
        id,
        type,
        category,
        message,
        value,
        threshold,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }
    
    this.notifyListeners();
  }
  
  private removeAlert(id: string): void {
    if (this.alerts.delete(id)) {
      this.notifyListeners();
    }
  }
  
  /**
   * Subscribe to alert changes
   */
  public subscribe(listener: (alerts: PerformanceAlert[]) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(): void {
    const alerts = Array.from(this.alerts.values());
    this.listeners.forEach(listener => listener(alerts));
  }
  
  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifyListeners();
    }
  }
  
  /**
   * Clear all alerts
   */
  public clearAll(): void {
    this.alerts.clear();
    this.notifyListeners();
  }
  
  /**
   * Get current alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }
}

/**
 * Utility functions for performance analysis
 */
export class PerformanceAnalyzer {
  /**
   * Analyze FPS stability
   */
  static analyzeFPSStability(frameTimeHistory: number[]): {
    stability: 'stable' | 'variable' | 'unstable';
    variance: number;
    steadyStatePercentage: number;
  } {
    if (frameTimeHistory.length < 10) {
      return { stability: 'stable', variance: 0, steadyStatePercentage: 100 };
    }
    
    const mean = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;
    const variance = frameTimeHistory.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / frameTimeHistory.length;
    const stdDev = Math.sqrt(variance);
    
    // Count frames within 1 std dev of mean
    const steadyFrames = frameTimeHistory.filter(time => Math.abs(time - mean) <= stdDev).length;
    const steadyStatePercentage = (steadyFrames / frameTimeHistory.length) * 100;
    
    let stability: 'stable' | 'variable' | 'unstable';
    if (steadyStatePercentage > 80) stability = 'stable';
    else if (steadyStatePercentage > 60) stability = 'variable';
    else stability = 'unstable';
    
    return { stability, variance, steadyStatePercentage };
  }
  
  /**
   * Calculate performance score (0-100)
   */
  static calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // FPS impact (40% of score)
    const targetFPS = 60;
    const fpsRatio = Math.min(metrics.fps / targetFPS, 1);
    score -= (1 - fpsRatio) * 40;
    
    // Frame time consistency (30% of score)
    const stability = this.analyzeFPSStability(metrics.frameTimeHistory);
    if (stability.stability === 'unstable') score -= 30;
    else if (stability.stability === 'variable') score -= 15;
    
    // Memory usage impact (20% of score)
    const memoryImpact = Math.max(0, (metrics.memoryUsage.percentageUsed - 50) / 50);
    score -= memoryImpact * 20;
    
    // Render time impact (10% of score)
    const maxAcceptableRenderTime = 16; // 60fps = 16ms per frame
    const renderTimeImpact = Math.max(0, (metrics.renderTime.average - maxAcceptableRenderTime) / maxAcceptableRenderTime);
    score -= Math.min(renderTimeImpact * 10, 10);
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate performance recommendations
   */
  static generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.fps < 30) {
      recommendations.push('Consider lowering texture resolution or reducing visual effects');
    }
    
    if (metrics.memoryUsage.percentageUsed > 80) {
      recommendations.push('Memory usage is high - consider reloading the page or reducing texture quality');
    }
    
    if (metrics.renderTime.average > 20) {
      recommendations.push('Render time is high - optimize shaders or reduce complexity');
    }
    
    const stability = this.analyzeFPSStability(metrics.frameTimeHistory);
    if (stability.stability === 'unstable') {
      recommendations.push('Frame rate is unstable - check for background processes or thermal throttling');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal! 🚀');
    }
    
    return recommendations;
  }
}