import React, { Component, ReactNode } from 'react';
import type { RendererDefinition } from '../renderers/types';
import { env } from '../../config';

interface RendererErrorBoundaryProps {
  children: ReactNode;
  renderer: RendererDefinition;
  fallbackRenderer?: RendererDefinition;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRecover?: () => void;
}

interface RendererErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  isRecovering: boolean;
}

/**
 * Specialized Error Boundary for renderer components
 * Provides graceful degradation and recovery mechanisms
 */
export class RendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  RendererErrorBoundaryState
> {
  private retryTimeoutId?: number;

  constructor(props: RendererErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RendererErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { renderer, onError } = this.props;
    
    console.error(`[RENDERER ERROR] ${renderer.id}:`, error);
    console.error('Error Info:', errorInfo);
    
    this.setState({ errorInfo });

    // Call renderer's error handler if provided
    if (renderer.onError) {
      try {
        renderer.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in renderer error handler:', handlerError);
      }
    }

    // Call external error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in external error handler:', handlerError);
      }
    }

    // Auto-retry with exponential backoff (max 3 times)
    if (this.state.retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000);
      
      if (env.debug.validation) {
        console.log(`[RENDERER ERROR] Auto-retry in ${delay}ms (attempt ${this.state.retryCount + 1}/3)`);
      }
      
      this.retryTimeoutId = window.setTimeout(() => {
        this.handleRetry();
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { renderer, onRecover } = this.props;
    
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      isRecovering: true
    }));

    // Call renderer's recovery handler if provided
    if (renderer.onRecover) {
      try {
        renderer.onRecover();
      } catch (handlerError) {
        console.error('Error in renderer recovery handler:', handlerError);
      }
    }

    // Call external recovery handler
    if (onRecover) {
      try {
        onRecover();
      } catch (handlerError) {
        console.error('Error in external recovery handler:', handlerError);
      }
    }

    // Reset recovery state after a short delay
    setTimeout(() => {
      this.setState({ isRecovering: false });
    }, 500);
  };

  handleManualRetry = () => {
    this.setState({ retryCount: 0 }); // Reset retry count for manual retry
    this.handleRetry();
  };

  render() {
    const { children, renderer, fallbackRenderer } = this.props;
    const { hasError, error, errorInfo, retryCount, isRecovering } = this.state;

    if (hasError) {
      // If we have a fallback renderer and haven't exceeded retry limit, try fallback
      if (fallbackRenderer && retryCount >= 3) {
        if (env.debug.validation) {
          console.log(`[RENDERER ERROR] Using fallback renderer: ${fallbackRenderer.id}`);
        }
        
        const FallbackComponent = fallbackRenderer.component;
        return (
          <div className="relative">
            <FallbackComponent className="opacity-75" />
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
              Fallback Mode
            </div>
          </div>
        );
      }

      // Render error UI
      return (
        <div className="flex items-center justify-center h-full bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-lg font-semibold mb-2">
              Renderer Error
            </div>
            <div className="text-red-300 text-sm mb-4">
              {renderer.name} encountered an error
            </div>
            
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded p-3 mb-4 text-left">
                <div className="text-red-200 text-xs font-mono break-words">
                  {error.message}
                </div>
                {env.debugMode && errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-300 text-xs cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-red-200 text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleManualRetry}
                disabled={isRecovering}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
              >
                {isRecovering ? 'Retrying...' : 'Retry'}
              </button>
              
              {fallbackRenderer && retryCount < 3 && (
                <button
                  onClick={() => this.setState({ retryCount: 3 })} // Force fallback
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                >
                  Use Fallback
                </button>
              )}
            </div>
            
            {retryCount > 0 && (
              <div className="text-red-300 text-xs mt-2">
                Retry attempt: {retryCount}/3
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook to wrap renderer components with error boundary
 */
export const useRendererErrorBoundary = (
  renderer: RendererDefinition,
  fallbackRenderer?: RendererDefinition
) => {
  return {
    ErrorBoundary: ({ children, ...props }: { children: ReactNode }) => (
      <RendererErrorBoundary
        renderer={renderer}
        fallbackRenderer={fallbackRenderer}
        {...props}
      >
        {children}
      </RendererErrorBoundary>
    )
  };
};

/**
 * Higher-order component to wrap renderers with error boundary
 */
export const withRendererErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  renderer: RendererDefinition,
  fallbackRenderer?: RendererDefinition
) => {
  const WithErrorBoundary = (props: P) => (
    <RendererErrorBoundary
      renderer={renderer}
      fallbackRenderer={fallbackRenderer}
    >
      <WrappedComponent {...props} />
    </RendererErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withRendererErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundary;
};