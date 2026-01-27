import React, { Component, ReactNode, ErrorInfo } from 'react';
import type { RendererDefinition } from '../renderers/types';

interface RendererErrorBoundaryProps {
  children: ReactNode;
  renderer: RendererDefinition;
  fallbackRenderer?: RendererDefinition;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecover?: () => void;
}

interface RendererErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Simplified Error Boundary for renderer components
 */
export class RendererErrorBoundary extends Component<RendererErrorBoundaryProps, RendererErrorBoundaryState> {
  constructor(props: RendererErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RendererErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RendererErrorBoundary] Renderer crashed:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-red-900 text-red-200">
          <div className="text-center p-4">
            <h2 className="text-lg font-bold mb-2">Renderer Error</h2>
            <p className="text-sm mb-4">The renderer encountered an error</p>
            <button
              className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified exports for compatibility
export const useRendererErrorBoundary = (renderer: RendererDefinition) => {
  return {
    ErrorBoundary: ({ children }: { children: ReactNode }) => (
      <RendererErrorBoundary renderer={renderer}>
        {children}
      </RendererErrorBoundary>
    )
  };
};

export const withRendererErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  renderer: RendererDefinition
) => {
  const WithErrorBoundary = (props: P) => (
    <RendererErrorBoundary renderer={renderer}>
      <WrappedComponent {...props} />
    </RendererErrorBoundary>
  );
  return WithErrorBoundary;
};