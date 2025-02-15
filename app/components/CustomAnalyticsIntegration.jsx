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

      // -----------------------------
      // Send event to Google Analytics (GA4)
      // -----------------------------
      if (typeof window.gtag === 'function' && GA_TRACKING_ID) {
        // You might want to map event names if necessary;
        // here we send the event name directly along with its payload.
        window.gtag('event', event.event_name, event.payload);
      }

      // -----------------------------
      // Send event to Meta Pixel
      // -----------------------------
      if (typeof fbq === 'function' && META_PIXEL_ID) {
        // Map Hydrogen event names to Meta Pixel standard event names.
        let metaEvent = null;
        let metaParams = {};

        switch (event.event_name) {
          case 'page_viewed':
          case 'page_view':
            metaEvent = 'PageView';
            break;
          case 'product_viewed':
          case 'view_item':
            metaEvent = 'ViewContent';
            metaParams = {
              content_ids: event.payload.product_ids, // Expect an array of product IDs
              value: event.payload.value,
              currency: event.payload.currency,
              ...event.payload,
            };
            break;
          case 'search':
            metaEvent = 'Search';
            metaParams = {
              search_string: event.payload.query || event.payload.search_query,
              ...event.payload,
            };
            break;
          case 'add_to_cart':
            metaEvent = 'AddToCart';
            metaParams = {
              content_ids: event.payload.product_ids,
              value: event.payload.value,
              currency: event.payload.currency,
              ...event.payload,
            };
            break;
          case 'begin_checkout':
            metaEvent = 'InitiateCheckout';
            metaParams = {
              value: event.payload.value,
              currency: event.payload.currency,
              ...event.payload,
            };
            break;
          case 'add_payment_info':
            metaEvent = 'AddPaymentInfo';
            metaParams = {
              value: event.payload.value,
              currency: event.payload.currency,
              ...event.payload,
            };
            break;
          case 'purchase':
            metaEvent = 'Purchase';
            metaParams = {
              content_ids: event.payload.product_ids,
              value: event.payload.value,
              currency: event.payload.currency,
              ...event.payload,
            };
            break;
          // For other events such as "click", "first_visit", "form_start", "form_submit",
          // "scroll", "session_start", "view_search_results", etc., you can choose to ignore them
          // for Meta Pixel or handle them as custom events.
          default:
            // Optionally, send as a custom event (or do nothing)
            // metaEvent = event.event_name;
            // metaParams = event.payload;
            break;
        }

        if (metaEvent) {
          fbq('track', metaEvent, metaParams);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [analytics]);

  return null;
}

export default CustomAnalyticsIntegration;
