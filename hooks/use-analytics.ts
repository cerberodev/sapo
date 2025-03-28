import { analytics } from '@/lib/firebase';
import { Analytics, logEvent } from 'firebase/analytics';
import { useEffect, useState } from 'react';

export const useAnalytics = () => {
  const [analyticsInstance, setAnalyticsInstance] = useState<Analytics | null>(null);

  useEffect(() => {
    // Initialize analytics instance when the component mounts
    if (analytics) {
      analytics.then((instance) => {
        setAnalyticsInstance(instance);
      });
    }
  }, []);

  const trackEvent = async (eventName: string, eventParams?: Record<string, any>) => {
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, eventParams);
    }
  };

  return {
    trackEvent,
  };
};
