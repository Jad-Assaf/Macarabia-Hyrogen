// CustomAnalyticsIntegration.jsx
import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

// Retrieve your tracking IDs from environment variables (or another config)
const GA_TRACKING_ID = 'G-3PZN80E9FJ';
const META_PIXEL_ID = '321309553208857';

export function CustomAnalyticsIntegration() {
  const analytics = useAnalytics();

  useEffect(() => {
    const unsubscribe = analytics.subscribe((event) => {
      console.log('Analytics event received:', event);

      // Forward event to Google Analytics (GA4)
      if (typeof window.gtag === 'function' && GA_TRACKING_ID) {
        window.gtag('event', event.event_name, event.payload);
      }

      // Forward event to Meta Pixel
      if (typeof fbq === 'function' && META_PIXEL_ID) {
        // Map Hydrogen event names to Meta Pixel event names if necessary.
        let mappedEventName = null;
        let mappedParams = {};

        switch (event.event_name) {
          case 'page_viewed':
          case 'page_view':
            mappedEventName = 'PageView';
            break;
          case 'product_viewed':
          case 'view_item':
            mappedEventName = 'ViewContent';
            mappedParams = {
              content_ids: event.payload.product_ids,
              value: event.payload.value,
              currency: event.payload.currency,
              ...event.payload,
            };
            break;
          case 'search':
            mappedEventName = 'Search';
            mappedParams = {
              search_string: event.payload.query || event.payload.search_query,
            };
            break;
          case 'add_to_cart':
            mappedEventName = 'AddToCart';
            mappedParams = {
              content_ids: event.payload.product_ids,
              value: event.payload.value,
              currency: event.payload.currency,
            };
            break;
          case 'begin_checkout':
            mappedEventName = 'InitiateCheckout';
            mappedParams = {
              value: event.payload.value,
              currency: event.payload.currency,
            };
            break;
          case 'add_payment_info':
            mappedEventName = 'AddPaymentInfo';
            mappedParams = {
              value: event.payload.value,
              currency: event.payload.currency,
            };
            break;
          case 'purchase':
            mappedEventName = 'Purchase';
            mappedParams = {
              content_ids: event.payload.product_ids,
              value: event.payload.value,
              currency: event.payload.currency,
            };
            break;
          default:
            // For events you don’t want to forward, do nothing.
            break;
        }
        if (mappedEventName) {
          fbq('track', mappedEventName, mappedParams);
        }
      }
    });

    return () => unsubscribe();
  }, [analytics]);

  return null;
}
