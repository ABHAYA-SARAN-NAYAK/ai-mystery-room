import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const GlobalErrorBanner: React.FC = () => {
  const { globalError, setGlobalError } = useSessionStore();

  if (!globalError) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 w-full bg-danger-bg border-b border-danger px-4 py-3 text-t1 flex items-center justify-between shadow-panel backdrop-blur-md"
    >
      <div className="flex items-center space-x-3 max-w-4xl mx-auto flex-1">
        <AlertTriangle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">{globalError.message}</span>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {globalError.onRetry && (
          <button
            onClick={() => {
              const retryFn = globalError.onRetry;
              setGlobalError(null);
              if (retryFn) retryFn();
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-surface hover:bg-raised text-primary text-xs font-semibold rounded-btn border border-primary/40 focus-ring"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
        <button
          onClick={() => setGlobalError(null)}
          className="p-1 text-t2 hover:text-t1 rounded focus-ring"
          aria-label="Dismiss error banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
