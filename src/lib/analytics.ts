import { getAnalytics, logEvent } from 'firebase/analytics';
import app from '@/lib/firebase';

const analytics = getAnalytics(app);

export const trackEvent = (eventName: string, parameters?: any) => {
  logEvent(analytics, eventName, parameters);
};

export const trackPageView = (pageName: string) => {
  trackEvent('page_view', { page_name: pageName });
}; 