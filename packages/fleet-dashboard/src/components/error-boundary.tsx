"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <h3 className="mt-3 text-sm font-semibold text-red-300">Something went wrong</h3>
        <p className="mt-1 text-xs text-red-400/80">{this.state.message}</p>
        <button
          onClick={() => this.setState({ hasError: false, message: "" })}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
        >
          <RefreshCcw className="h-3 w-3" /> Try again
        </button>
      </div>
    );
  }
}
