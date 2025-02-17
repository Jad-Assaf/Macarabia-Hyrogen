// facebookConversions.server.js

/**
 * Helper to hash sensitive data with SHA-256 using the Web Crypto API.
 * @param {string} data - The data to hash.
 * @returns {Promise<string|undefined>} - A promise that resolves to the hashed string in hex, or undefined if no data.
 */
async function hashData(data) {
  if (!data) return undefined;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sendFacebookEvent(eventName, eventData) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.TEST_EVENT_CODE; // optional for testing

  if (!pixelId || !accessToken) {
    throw new Error('Meta Pixel ID or Access Token is missing');
  }

  const endpoint = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`;

  // Build the user_data object conditionally
  const userData = {};

  if (eventData.client_ip_address) {
    userData.client_ip_address = eventData.client_ip_address;
  }
  if (eventData.client_user_agent) {
    userData.client_user_agent = eventData.client_user_agent;
  }
  if (eventData.fbp) {
    userData.fbp = eventData.fbp;
  }
  if (eventData.fbc) {
    userData.fbc = eventData.fbc;
  }
  // Only hash and include sensitive data if provided
  if (eventData.email) {
    const hashedEmail = await hashData(eventData.email);
    if (hashedEmail) userData.em = hashedEmail;
  }
  if (eventData.facebookLoginId) {
    const hashedFbLoginId = await hashData(eventData.facebookLoginId);
    if (hashedFbLoginId) userData.fb_login_id = hashedFbLoginId;
  }
  if (eventData.externalId) {
    const hashedExternalId = await hashData(eventData.externalId);
    if (hashedExternalId) userData.external_id = hashedExternalId;
  }

  const payload = {
    data: [
      {
        event_name, // e.g., "PageView", "ViewContent", etc.
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: eventData.event_source_url,
        action_source: "website",
        user_data,
        custom_data: {
          value: eventData.value,
          currency: eventData.currency,
          content_ids: eventData.product_ids,
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
