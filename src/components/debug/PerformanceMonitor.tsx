/**
 * Performance Monitor Component
 * 
 * Visual dashboard for displaying performance metrics in real-time.
 * Features charts, alerts, recommendations, and detailed metrics display.
 */

import React, { useState, useMemo } from 'react';
import { usePerformanceMonitoring, usePerformanceAlerts } from '../../hooks/usePerformanceMonitoring';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import Button from '../shared/Button';
import { Switch } from '../shared/Switch';
import CollapsibleSection from '../shared/CollapsibleSection';
import { 
  ConsoleIcon,
  SettingsIcon,
  CheckIcon,
  CloseIcon,
  ChevronDownIcon,
  FishIcon
} from '../shared/icons';

interface PerformanceMonitorProps {
  className?: string;
  compactMode?: boolean;
  showCharts?: boolean;
}

/**
 * Main Performance Monitor component
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  compactMode = false,
  showCharts = true,
}) => {
  const { t: _t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  
  const _performanceData = usePerformanceMonitoring({ autoStart: true });
  const alertData = usePerformanceAlerts();
  
  const {
    metrics,
    isMonitoring,
    performanceScore,
    recommendations,
    sessionStats,
    rendererProfile,
    history,
    settings,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    updateSettings,
  } = _performanceData;
  
  // Format values for display
  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  // Performance score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  // Alert summary
  const alertSummary = useMemo(() => {
    const critical = alertData.criticalAlerts.length;
    const warnings = alertData.warningAlerts.length;
    const unacknowledged = alertData.unacknowledgedAlerts.length;
    
    return { critical, warnings, unacknowledged };
  }, [alertData]);
  
  if (compactMode) {
    return (
      <div className={`bg-gray-800 rounded-lg p-3 border border-gray-600 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ConsoleIcon className="w-5 h-5 text-cyan-400" />
            <div className="text-sm">
              {metrics ? (
                <>
                  <span className={`font-medium ${getScoreColor(performanceScore)}`}>
                    {performanceScore.toFixed(0)}%
                  </span>
                  <span className="text-gray-400 ml-2">
                    {metrics.fps.toFixed(0)} FPS
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Not monitoring</span>
              )}
            </div>
          </div>
          
          {alertSummary.unacknowledged > 0 && (
            <div className="flex items-center space-x-1">
              <CheckIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400">{alertSummary.unacknowledged}</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className="p-1"
          >
            {isMonitoring ? (
              <CloseIcon className="w-4 h-4" />
            ) : (
              <FishIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ConsoleIcon className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-medium text-white">Performance Monitor</h3>
          {isMonitoring && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetMetrics}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={isMonitoring ? "secondary" : "primary"}
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <h4 className="text-sm font-medium text-gray-200 mb-3">Monitoring Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Enable Alerts</label>
              <Switch
                checked={settings.enableAlerts}
                onChange={(checked) => updateSettings({ enableAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Enable Profiling</label>
              <Switch
                checked={settings.enableProfiling}
                onChange={(checked) => updateSettings({ enableProfiling: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">WebGL Profiling</label>
              <Switch
                checked={settings.enableWebGLProfiling}
                onChange={(checked) => updateSettings({ enableWebGLProfiling: checked })}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Score */}
      {metrics && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-200">Performance Score</h4>
            <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore.toFixed(0)}%
            </span>
          </div>
          
          {/* Score bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                performanceScore >= 80 ? 'bg-green-400' :
                performanceScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${performanceScore}%` }}
            />
          </div>
          
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 mb-1">Recommendations:</p>
              {recommendations.slice(0, 3).map((rec, index) => (
                <p key={index} className="text-xs text-gray-300">
                  • {rec}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Alerts Section */}
      {alertData.alerts.length > 0 && (
        <CollapsibleSection
          title={`Alerts (${alertData.unacknowledgedAlerts.length} unread)`}
          defaultOpen={alertData.hasUnacknowledgedAlerts}
        >
          <div className="space-y-2">
            {alertData.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md border-l-4 ${
                  alert.type === 'critical'
                    ? 'bg-red-900/20 border-red-400'
                    : 'bg-yellow-900/20 border-yellow-400'
                } ${alert.acknowledged ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckIcon 
                      className={`w-4 h-4 ${
                        alert.type === 'critical' ? 'text-red-400' : 'text-yellow-400'
                      }`} 
                    />
                    <span className="text-sm text-gray-200">{alert.message}</span>
                  </div>
                  
                  {!alert.acknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alertData.acknowledgeAlert(alert.id)}
                      className="text-xs"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {alertData.alerts.length > 5 && (
              <p className="text-xs text-gray-400 text-center">
                ... and {alertData.alerts.length - 5} more alerts
              </p>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={alertData.clearAllAlerts}
              className="w-full mt-2"
            >
              Clear All Alerts
            </Button>
          </div>
        </CollapsibleSection>
      )}
      
      {/* Current Metrics */}
      {metrics && (
        <CollapsibleSection title="Current Metrics" defaultOpen>
          <div className="grid grid-cols-2 gap-4">
            {/* FPS */}
            <div className="bg-gray-750 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">FPS</span>
                <span className={`text-lg font-medium ${
                  metrics.fps >= 45 ? 'text-green-400' :
                  metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {metrics.fps.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {metrics.avgFrameTime.toFixed(1)}ms
              </div>
            </div>
            
            {/* Memory */}
            <div className="bg-gray-750 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Memory</span>
                <span className={`text-lg font-medium ${
                  metrics.memoryUsage.percentageUsed < 70 ? 'text-green-400' :
                  metrics.memoryUsage.percentageUsed < 85 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {metrics.memoryUsage.percentageUsed.toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatBytes(metrics.memoryUsage.usedJSHeapSize)}
              </div>
            </div>
            
            {/* Render Time */}
            <div className="bg-gray-750 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Render</span>
                <span className={`text-lg font-medium ${
                  metrics.renderTime.current < 12 ? 'text-green-400' :
                  metrics.renderTime.current < 20 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {metrics.renderTime.current.toFixed(1)}ms
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {metrics.renderTime.average.toFixed(1)}ms
              </div>
            </div>
            
            {/* Session Duration */}
            <div className="bg-gray-750 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Session</span>
                <span className="text-lg font-medium text-gray-200">
                  {formatDuration(sessionStats.sessionDuration)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {sessionStats.totalFrames} frames
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}
      
      {/* Performance Charts */}
      {showCharts && metrics && history.fps.length > 0 && (
        <CollapsibleSection title="Performance Charts">
          <PerformanceCharts history={history} />
        </CollapsibleSection>
      )}
      
      {/* Renderer Profiling */}
      {Object.keys(rendererProfile).length > 0 && (
        <CollapsibleSection title="Renderer Profiling">
          <div className="space-y-2">
            {Object.entries(rendererProfile).map(([rendererId, profile]) => (
              <div key={rendererId} className="bg-gray-750 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-200 capitalize">
                    {rendererId} Renderer
                  </span>
                  <span className="text-xs text-gray-400">
                    {profile.totalFrames} frames
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Avg Render: </span>
                    <span className="text-gray-200">
                      {profile.averageRenderTime.toFixed(1)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Peak: </span>
                    <span className="text-gray-200">
                      {profile.peakRenderTime.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
      
      {/* WebGL Metrics */}
      {metrics?.webgl && (
        <CollapsibleSection title="WebGL Metrics">
          <div className="bg-gray-750 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Renderer: </span>
                <span className="text-gray-200">{metrics.webgl.renderer}</span>
              </div>
              <div>
                <span className="text-gray-400">Vendor: </span>
                <span className="text-gray-200">{metrics.webgl.vendor}</span>
              </div>
              <div>
                <span className="text-gray-400">Extensions: </span>
                <span className="text-gray-200">{metrics.webgl.extensions.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Draw Calls: </span>
                <span className="text-gray-200">{metrics.webgl.drawCalls}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

/**
 * Simple performance charts component
 */
const PerformanceCharts: React.FC<{
  history: {
    fps: Array<{ timestamp: number; value: number }>;
    memory: Array<{ timestamp: number; value: number }>;
    renderTime: Array<{ timestamp: number; value: number }>;
  };
}> = ({ history }) => {
  const maxPoints = 60; // Show last 60 data points
  
  const createMiniChart = (data: Array<{ timestamp: number; value: number }>, color: string, suffix: string = '') => {
    const recentData = data.slice(-maxPoints);
    if (recentData.length < 2) return null;
    
    const maxValue = Math.max(...recentData.map(d => d.value));
    const minValue = Math.min(...recentData.map(d => d.value));
    const range = maxValue - minValue || 1;
    
    const points = recentData.map((point, index) => {
      const x = (index / (recentData.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="bg-gray-750 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            {data === history.fps ? 'FPS' : data === history.memory ? 'Memory' : 'Render Time'}
          </span>
          <span className="text-sm text-gray-200">
            {recentData[recentData.length - 1]?.value.toFixed(1)}{suffix}
          </span>
        </div>
        
        <div className="relative h-16">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{minValue.toFixed(1)}{suffix}</span>
          <span>{maxValue.toFixed(1)}{suffix}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {createMiniChart(history.fps, '#10b981')}
      {createMiniChart(history.memory, '#f59e0b', '%')}
      {createMiniChart(history.renderTime, '#3b82f6', 'ms')}
    </div>
  );
};

export default PerformanceMonitor;