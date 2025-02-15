// facebookConversions.js
import crypto from 'crypto';

/**
 * Helper to hash sensitive data with SHA-256.
 * @param {string} data - The data to hash.
 * @returns {string|null} - The hashed string in hex or null if no data.
 */
function hashData(data) {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function sendFacebookEvent(eventName, eventData) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.TEST_EVENT_CODE; // optional for testing

  if (!pixelId || !accessToken) {
    throw new Error("Meta Pixel ID or Access Token is missing");
  }

  const endpoint = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`;

  // Build user_data: hash sensitive data but leave others in plain text.
  const userData = {
    // Plain text (do not hash)
    client_ip_address: eventData.client_ip_address || '',
    client_user_agent: eventData.client_user_agent || '',
    fbp: eventData.fbp || '',
    fbc: eventData.fbc || '',
    // Must be hashed
    em: hashData(eventData.email),
    ph: hashData(eventData.phone),
    fb_login_id: hashData(eventData.facebookLoginId),
    external_id: hashData(eventData.externalId),
  };

  const payload = {
    data: [
      {
        event_name, // e.g., "PageView", "ViewContent", "Search", "AddToCart"
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: eventData.event_source_url,
        action_source: "website",
        user_data: userData,
        custom_data: {
          value: eventData.value,
          currency: eventData.currency,
          content_ids: eventData.product_ids, // array of product IDs
          // ... add any other parameters as needed
        },
      },
    ],
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
}
