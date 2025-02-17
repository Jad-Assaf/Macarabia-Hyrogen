import {json} from '@shopify/remix-oxygen';
import {createHash} from 'crypto';

function sha256Hash(value) {
  if (!value) return '';
  return createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

export async function action({request}) {
  if (request.method !== 'POST') {
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    const eventData = await request.json();
    console.log('[Server] Received from client:', eventData);

    // --- Extract real IP & UA from server request headers ---
    const ipHeader =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('client-ip') ||
      request.headers.get('cf-connecting-ip') ||
      '';
    const userAgentHeader = request.headers.get('user-agent') || '';

    // --- Hash sensitive data (email, phone) ---
    const userData = eventData.user_data || {};

    // Overwrite with server-captured IP/UA
    userData.client_ip_address = ipHeader || userData.client_ip_address;
    userData.client_user_agent = userAgentHeader || userData.client_user_agent;

    // Hash email if provided
    if (userData.email) {
      userData.em = sha256Hash(userData.email);
      delete userData.email; // remove plain text
    }
    // Hash phone if provided
    if (userData.phone) {
      userData.ph = sha256Hash(userData.phone);
      delete userData.phone; // remove plain text
    }

    eventData.user_data = userData;

    // Prepare final payload
    const payload = {
      data: [eventData],
      test_event_code: 'TEST31560', // For debugging in Meta's Test Events
    };

    console.log('[Server] Final CAPI payload:', payload);

    // Send to Meta
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    const metaResponse = await fetch(
      `https://graph.facebook.com/v12.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      }
    );

    const metaResult = await metaResponse.json();

    console.log('[Server] Meta response:', metaResult);

    return json({success: true, result: metaResult});
  } catch (err) {
    console.error('[Server] Error:', err);
    return json({success: false, error: err.message}, {status: 500});
  }
}
