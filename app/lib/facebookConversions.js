export async function sendFacebookEvent(eventName, eventData) {
  const pixelId = process.env.META_PIXEL_ID; // Use env variable instead of hardcoding
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.TEST_EVENT_CODE; // optional

  if (!pixelId || !accessToken) {
    throw new Error('Meta Pixel ID or Access Token is missing');
  }

  const endpoint = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`;

  const payload = {
    data: [
      {
        event_name: eventName, // e.g., "PageView", "ViewContent", etc.
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: eventData.event_source_url,
        action_source: "website",
        user_data: {
          // In production, hash sensitive data using SHA256
          em: eventData.hashed_email,
        },
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
