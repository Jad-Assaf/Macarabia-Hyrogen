// src/components/CustomAnalyticsIntegration.jsx
import { useEffect } from 'react';
import { useAnalytics } from '@shopify/hydrogen';

// Ideally, these IDs should come from environment variables
const GA_TRACKING_ID = 'G-3PZN80E9FJ';
const META_PIXEL_ID = '321309553208857';

export function CustomAnalyticsIntegration() {
  const analytics = useAnalytics();

  useEffect(() => {
    // Ensure that analytics and its subscribe method exist
    if (!analytics || typeof analytics.subscribe !== 'function') {
      console.error('Analytics context is not available. Make sure your component is wrapped in <Analytics.Provider>');
      return;
    }
    
    const unsubscribe = analytics.subscribe((event) => {
      console.log('Received analytics event:', event);
      
      // Guard: Check that event.payload is an object
      const payload = event.payload || {};
      
      // --- Forward to Google Analytics (GA4) ---
      if (typeof window.gtag === 'function' && GA_TRACKING_ID) {
        // Optionally, you can map event names if needed.
        try {
          window.gtag('event', event.event_name, payload);
        } catch (e) {
          console.error('Error sending event to GA:', e);
        }
      }
      
      // --- Forward to Meta Pixel ---
      if (typeof fbq === 'function' && META_PIXEL_ID) {
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
              content_ids: payload.product_ids,
              value: payload.value,
              currency: payload.currency,
              ...payload,
            };
            break;
          case 'search':
            mappedEventName = 'Search';
            mappedParams = {
              search_string: payload.query || payload.search_query,
            };
            break;
          case 'add_to_cart':
            mappedEventName = 'AddToCart';
            mappedParams = {
              content_ids: payload.product_ids,
              value: payload.value,
              currency: payload.currency,
            };
            break;
          case 'begin_checkout':
            mappedEventName = 'InitiateCheckout';
            mappedParams = {
              value: payload.value,
              currency: payload.currency,
            };
            break;
          case 'add_payment_info':
            mappedEventName = 'AddPaymentInfo';
            mappedParams = {
              value: payload.value,
              currency: payload.currency,
            };
            break;
          case 'purchase':
            mappedEventName = 'Purchase';
            mappedParams = {
              content_ids: payload.product_ids,
              value: payload.value,
              currency: payload.currency,
            };
            break;
          // You can add more mappings if needed.
          default:
            // If you don't want to forward other events, do nothing.
            break;
        }
        
        if (mappedEventName) {
          try {
            fbq('track', mappedEventName, mappedParams);
          } catch (e) {
            console.error('Error sending event to Meta Pixel:', e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [analytics]);

  return null;
}

export default CustomAnalyticsIntegration;
