import { useEffect, useState, useCallback, type RefObject } from 'react';

export interface HubContextPayload {
  userId: string;
  token: string;
  propertyId?: string;
  propertyName?: string;
  prefill?: {
    productName?: string;
    tagline?: string;
    description?: string;
    domainId?: string;
  };
}

export interface PMFEvent {
  event:
    | 'ready'
    | 'evaluation_started'
    | 'step_completed'
    | 'report_ready'
    | 'report_downloaded';
  sessionId?: string;
  productName?: string;
  step?: number;
  pmfScore?: number;
  dfsScore?: number;
  recommendation?: string;
  verdict?: string;
}

export function usePMFBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  pmfOrigin: string,
) {
  const [lastEvent, setLastEvent] = useState<PMFEvent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== pmfOrigin) return;
      if (e.data?.type !== 'PMF_EVENT') return;

      const payload = e.data.payload as PMFEvent;
      setLastEvent(payload);

      if (payload.event === 'ready') {
        setIsReady(true);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pmfOrigin]);

  const sendContext = useCallback(
    (payload: HubContextPayload) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'HUB_CONTEXT', payload },
        pmfOrigin,
      );
    },
    [iframeRef, pmfOrigin],
  );

  return { sendContext, lastEvent, isReady };
}
