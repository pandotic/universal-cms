import { AlertsDashboard } from "./home/alerts-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";

export default function HubHomePage() {
  return (
    <ErrorBoundary>
      <AlertsDashboard />
    </ErrorBoundary>
  );
}
