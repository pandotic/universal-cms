"use client";

import { useEffect } from "react";
import { installClientErrorCapture, type ClientErrorCaptureOptions } from "./client";

interface Props extends ClientErrorCaptureOptions {
  children?: React.ReactNode;
}

/**
 * Client component that installs global error capture on mount. Drop this
 * inside your root layout to auto-forward uncaught errors + unhandled promise
 * rejections to the ingest endpoint.
 */
export function ErrorCaptureProvider({ children, ...options }: Props) {
  useEffect(() => {
    const uninstall = installClientErrorCapture(options);
    return () => uninstall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return children ?? null;
}
