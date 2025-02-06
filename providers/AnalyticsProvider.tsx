'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { trackEvent } = useAnalytics();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view whenever the route changes
    trackEvent('page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams, trackEvent]);

  return <>{children}</>;
}
