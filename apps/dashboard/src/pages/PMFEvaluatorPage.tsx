import React, { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePMFBridge } from '../hooks/usePMFBridge';

const PMF_URL = import.meta.env.VITE_PMF_EVALUATOR_URL as string | undefined;

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

export function PMFEvaluatorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, session } = useAuth();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const pmfOrigin = PMF_URL ? getOrigin(PMF_URL) : '';
  const { sendContext, lastEvent } = usePMFBridge(iframeRef, pmfOrigin);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    if (user && session) {
      sendContext({
        userId: user.id,
        token: session.access_token,
      });
    }
  };

  if (!PMF_URL) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            PMF Evaluator Not Configured
          </h3>
          <p className="text-sm text-gray-500">
            Set the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">VITE_PMF_EVALUATOR_URL</code> environment
            variable to the PMF Evaluator&apos;s URL to enable this tool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Loading overlay */}
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading PMF Evaluator&hellip;</p>
          </div>
        </div>
      )}

      {/* Status bar */}
      {lastEvent && lastEvent.event === 'report_ready' && (
        <div className="absolute top-3 right-3 z-20 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800 shadow-sm">
          Report ready{lastEvent.productName ? ` for ${lastEvent.productName}` : ''}
          {lastEvent.pmfScore != null && ` — PMF Score: ${lastEvent.pmfScore}`}
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={PMF_URL}
        className="w-full h-full border-0"
        allow="clipboard-write"
        onLoad={handleIframeLoad}
        title="PMF Evaluator"
      />
    </div>
  );
}
