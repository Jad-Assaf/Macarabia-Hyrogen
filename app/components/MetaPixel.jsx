// src/components/MetaPixelManual.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// --- Helper: Generate a unique event ID
const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

// --- Helper: Fetch the real IP using ipify API
const getRealIp = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching real IP:', error);
    return '0.0.0.0';
  }
};

// --- Function to send PageView event via Conversions API
const trackPageViewCAPI = async (eventId) => {
  const ip = await getRealIp();
  const payload = {
    action_source: 'website',
    event_name: 'PageView',
    event_id: eventId, // This should match the Pixel eventID
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: ip,
      client_user_agent: navigator.userAgent,
    },
    custom_data: {} // No additional data needed for PageView
  };

  fetch('/facebookConversions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      console.log('Response status from /facebookConversions:', res.status);
      return res.json();
    })
    .then((data) => {
      console.log('JSON returned from /facebookConversions:', data);
    })
    .catch((error) => {
      console.error('Error calling /facebookConversions:', error);
    });
};

const MetaPixel = ({ pixelId }) => {
  const location = useLocation();

  useEffect(() => {
    if (!pixelId) return;

    // Insert the Meta Pixel script
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );

    // Initialize the Pixel
    fbq('init', pixelId);

    // Generate one event ID for the initial PageView
    const eventId = generateEventId();

    // Track PageView via Pixel (passing eventID as the 4th parameter)
    fbq('track', 'PageView', {}, { eventID: eventId });

    // Also track PageView via Conversions API using the same event_id
    trackPageViewCAPI(eventId);
  }, [pixelId]);

  // On route changes, track PageView events again (both Pixel & CAPI)
  useEffect(() => {
    if (typeof fbq === 'function') {
      const eventId = generateEventId();
      fbq('track', 'PageView', {}, { eventID: eventId });
      trackPageViewCAPI(eventId);
    }
  }, [location]);

  return (
    <>
      {/* Meta Pixel NoScript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="Meta Pixel"
        />
      </noscript>
    </>
  );
};

export default MetaPixel;
