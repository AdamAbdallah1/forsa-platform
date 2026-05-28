import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
          <div className="rounded-[30px] border border-[var(--forsa-border)] bg-white p-8 text-center">
            <h1 className="text-3xl font-semibold">
              Something went wrong
            </h1>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-white"
            >
              Reload
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}