"use client";

import * as React from "react";
import { reportError } from "./client";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Endpoint the captured error is POSTed to. Defaults to `/api/errors`. */
  endpoint?: string;
  /** Name used as `component` in the report. Defaults to "ErrorBoundary". */
  name?: string;
  /**
   * Custom fallback UI. Receives the captured error and a `reset` callback
   * that clears the boundary so the subtree can try to re-render.
   */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    void reportError(
      {
        message: error.message || String(error),
        stack: `${error.stack ?? ""}\n\nComponent stack:${info.componentStack ?? ""}`,
        component: this.props.name ?? "ErrorBoundary",
        severity: "error",
        category: "ui",
      },
      this.props.endpoint
    );
  }

  private reset = () => this.setState({ error: null });

  render(): React.ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div
          role="alert"
          style={{
            padding: "1rem",
            borderRadius: 8,
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(239, 68, 68, 0.05)",
            color: "inherit",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <strong>Something went wrong.</strong>
          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
            {this.state.error.message}
          </div>
          <button
            type="button"
            onClick={this.reset}
            style={{
              marginTop: 8,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
