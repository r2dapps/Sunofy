import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear out potentially corrupted local storage caches 
    // that usually cause PWA stale state rendering issues
    localStorage.removeItem('sunofy_sync_room_code');
    localStorage.removeItem('sunofy_sync_is_host');
    sessionStorage.clear();
    
    // Hard reload the PWA to fresh state
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] bg-[var(--bg-sunofy)] text-[var(--text-sunofy)] flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--bg-sunofy, #0a0a0c)', color: 'var(--text-sunofy, #ffffff)' }}>
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <RefreshCcw size={48} className="text-red-400" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
            Oops, something broke!
          </h1>
          
          <p className="text-gray-400 max-w-md mb-8 text-base sm:text-lg">
            It looks like the app ran into an unexpected error. This usually happens when the app wakes up from sleep and loses connection to its state.
          </p>

          <button 
            onClick={this.handleReset}
            className="flex items-center gap-3 px-8 py-4 bg-[var(--accent-sunofy)] text-white rounded-full font-bold shadow-lg hover:shadow-[var(--accent-sunofy)]/30 hover:-translate-y-1 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent-sunofy, #f97316)' }}
          >
            <Home size={20} />
            Return to Discover
          </button>
          
          <div className="mt-12 text-xs text-gray-600 max-w-sm truncate opacity-50">
            Error details: {this.state.errorMsg}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
