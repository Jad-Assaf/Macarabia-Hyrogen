// app/routes/api/meta-capi.jsx (or .ts)
import {json} from '@shopify/remix-oxygen'; // or the appropriate import in your setup

export async function action({request}) {
  try {
    const eventData = await request.json(); // Payload from your client or server code
    // eventData should be in the format that the CAPI expects.

    // Prepare your payload
    const payload = {
      data: [eventData], // The array of events
      // If you have a test code for debugging:
      test_event_code: "TEST31560",
      // The rest of your fields (e.g., partner_agent if needed)
    };

    // Convert payload to a query string or send as JSON, depending on your approach
    // The cURL example uses query parameters, but you could also post as JSON.
    const pixelId = "321309553208857";
    const accessToken = "EAAbtKZAEu758BOZCpvs6XBxvEDH2k6347fSMxt7aYdlBV5zUwZAOXbFTL9WEX2TjZChGAOKaqw08qoihZCdYHCyOftlaieOT4Bgite7zRcCVnwfeojeZAZCCnRUpk0V1QZBwERiM3V5X6ZABWGZBfFqRjeV8WxH5TxMDSayZAgaGZBSNLSrMP1xAmSkaMH7gEZCbaJAt5cgZDZD";

    const response = await fetch(
      `https://graph.facebook.com/v12.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    // Return the result or handle it
    return json({success: true, result});
  } catch (error) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
