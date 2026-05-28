import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log directly to monitoring services here if needed (e.g., Sentry)
    console.error("Application Crash Captured:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 text-neutral-800 selection:bg-neutral-100">
          <div className="max-w-sm text-center">
            {/* Minimal systemic indicator */}
            <div className="mx-auto flex h-7 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-[10px] font-medium tracking-wider uppercase text-neutral-400">
              500
            </div>

            <h1 className="mt-4 text-base font-bold tracking-tight text-neutral-900">
              An unexpected error occurred
            </h1>
            
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
              The application encountered a client-side runtime exception. Try hard refreshing your connection parameters.
            </p>

            {/* Micro Inline Actions */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="h-8 rounded-lg bg-neutral-900 px-3.5 text-xs font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98]"
              >
                Reload interface
              </button>
              
              <button
                onClick={() => (window.location.href = "/")}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 active:scale-[0.98]"
              >
                Return home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}