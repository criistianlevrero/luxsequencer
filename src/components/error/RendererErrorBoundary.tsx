import React, { Component, ReactNode, ErrorInfo } from 'react';
import type { RendererDefinition } from '../renderers/types';
import { Alert, Button } from '../ui';

interface RendererErrorBoundaryProps {
  children: ReactNode;
  renderer?: RendererDefinition;
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
      const rendererName = this.props.renderer?.name || 'Unknown';
      return (
        <div className="flex items-center justify-center h-full p-4">
          <Alert
            variant="error"
            heading="Renderer Error"
            className="w-full max-w-lg text-center"
            actions={(
              <Button
                variant="danger"
                size="sm"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Retry
              </Button>
            )}
          >
            <p>The {rendererName} renderer encountered an error</p>
          </Alert>
        </div>
      );
    }

    // Handle missing renderer
    if (!this.props.renderer) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <Alert
            variant="warning"
            heading="No Renderer"
            className="w-full max-w-lg text-center"
          >
            <p>No renderer is currently selected or available</p>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified exports for compatibility
export const useRendererErrorBoundary = (renderer?: RendererDefinition) => {
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
  renderer?: RendererDefinition
) => {
  const WithErrorBoundary = (props: P) => (
    <RendererErrorBoundary renderer={renderer}>
      <WrappedComponent {...props} />
    </RendererErrorBoundary>
  );
  return WithErrorBoundary;
};