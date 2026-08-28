import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends (React.Component as any) {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL [ErrorBoundary] caught error in React component tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      localStorage.setItem('nexus_current_screen', 'dashboard');
      localStorage.setItem('nexus_active_group', 'ai');
      localStorage.setItem('nexus_active_tab', 'llm');
    } catch (e) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected rendering error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {this.props.fallbackTitle || 'View Recovery Shield'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {this.props.fallbackDescription ||
                    'A temporary component rendering error was safely caught. The application state has been preserved.'}
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Error Details:</span>
                </span>
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] underline hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer"
                >
                  {this.state.showDetails ? 'Hide Stack' : 'Show Stack'}
                </button>
              </div>
              <p className="font-mono text-xs text-rose-700 dark:text-rose-300 break-words font-semibold">
                {errorMsg}
              </p>

              {this.state.showDetails && componentStack && (
                <pre className="text-[10px] font-mono bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 overflow-x-auto text-zinc-700 dark:text-zinc-300 max-h-48 whitespace-pre-wrap">
                  {componentStack}
                </pre>
              )}
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="cursor-pointer"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="cursor-pointer"
              >
                Reload Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                leftIcon={<Home className="h-3.5 w-3.5" />}
                className="cursor-pointer"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
