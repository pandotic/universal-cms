// Client-side error logging entry point. For server-side (logServerError,
// withErrorLogging, reportNextRequestError) use "@pandotic/universal-cms/error-logging/server".
export * from "./client";
export { ErrorBoundary } from "./ErrorBoundary";
export { ErrorCaptureProvider } from "./ErrorCaptureProvider";
