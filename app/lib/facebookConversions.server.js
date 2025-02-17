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

/**
 * Safely extracts the numeric ID from a Shopify global ID (gid).
 * Example: "gid://shopify/Product/123456789" => "123456789"
 * @param {string} gid - The global ID.
 * @returns {string} - The extracted numeric ID or an empty string if not available.
 */
export function parseGid(gid) {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Sends an event to Facebook's Conversions API.
 * @param {string} eventName - The name of the event (e.g., "ViewContent", "PageView", etc.)
 * @param {object} eventData - An object containing event details.
 *   Expected properties include:
 *     - event_source_url (string)
 *     - client_ip_address (string, optional)
 *     - client_user_agent (string, optional)
 *     - fbp (string, optional)
 *     - fbc (string, optional)
 *     - email (string, optional)
 *     - facebookLoginId (string, optional)
 *     - externalId (string, optional)
 *     - value (number, optional)
 *     - currency (string, optional)
 *     - product_ids (array, optional)
 *     - event_id (string, optional) for deduplication
 * @returns {Promise<object>} - The JSON response from the Facebook API.
 */
export async function sendFacebookEvent(eventName, eventData) {
  const pixelId = "321309553208857";
  const accessToken = "EAAbtKZAEu758BOZCpvs6XBxvEDH2k6347fSMxt7aYdlBV5zUwZAOXbFTL9WEX2TjZChGAOKaqw08qoihZCdYHCyOftlaieOT4Bgite7zRcCVnwfeojeZAZCCnRUpk0V1QZBwERiM3V5X6ZABWGZBfFqRjeV8WxH5TxMDSayZAgaGZBSNLSrMP1xAmSkaMH7gEZCbaJAt5cgZDZD";
  const testEventCode = process.env.TEST_EVENT_CODE; // optional for testing

  if (!pixelId || !accessToken) {
    throw new Error('Meta Pixel ID or Access Token is missing');
  }

  const endpoint = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`;

  // Build the user_data object conditionally:
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
  // Hash and include sensitive data if provided
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

  // Build the event payload
  const eventPayload = {
    event_name, // e.g., "ViewContent", "PageView", etc.
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: eventData.event_source_url,
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: eventData.value,
      currency: eventData.currency,
      content_ids: eventData.product_ids,
    },
  };

  // Add deduplication event_id if provided
  if (eventData.event_id) {
    eventPayload.event_id = eventData.event_id;
  }

  // Build the full payload object
  const payload = {
    data: [eventPayload],
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error sending Facebook event:", error);
    throw error;
  }
}
