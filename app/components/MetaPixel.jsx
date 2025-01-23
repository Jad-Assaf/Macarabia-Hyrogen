import {useEffect} from 'react';

export default function MetaPixel() {
  useEffect(() => {
    // Initialize Meta Pixel
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js',
    );

    // Initialize Meta Pixel with your ID
    fbq('init', '321309553208857');
    fbq('track', 'PageView');

    // Subscribe to product_viewed event
    if (window.analytics) {
      window.analytics.subscribe('product_viewed', async (event) => {
        fbq('track', 'ViewContent', {
          content_ids: [event.data?.productVariant?.id],
          content_name: event.data?.productVariant?.title,
          currency: event.data?.productVariant?.price?.currencyCode,
          value: event.data?.productVariant?.price?.amount,
        });
      });
    }

    // Clean up (optional)
    return () => {
      delete window.fbq;
    };
  }, []);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{display: 'none'}}
        src="https://www.facebook.com/tr?id=321309553208857&ev=PageView&noscript=1"
        alt="Meta Pixel"
      />
    </noscript>
  );
}
