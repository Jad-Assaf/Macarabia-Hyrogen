import {json} from '@shopify/remix-oxygen'; // or the appropriate import in your setup

export async function action({request}) {
  if (request.method !== 'POST') {
    // Return a 405 if it's not POST
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    // 1. Get the event data from the request
    const eventData = await request.json(); 
    console.log('Received eventData from client:', eventData);

    // 2. Prepare payload for Facebook CAPI
    const payload = {
      data: [eventData], 
      test_event_code: 'TEST31560', 
    };

    console.log('Prepared payload for Meta CAPI:', payload);

    // 3. Define Pixel and Access Token
    const pixelId = '321309553208857';
    const accessToken =
      'EAAbtKZAEu758BOZCpvs6XBxvEDH2k6347fSMxt7aYdlBV5zUwZAOXbFTL9WEX2TjZChGAOKaqw08qoihZCdYHCyOftlaieOT4Bgite7zRcCVnwfeojeZAZCCnRUpk0V1QZBwERiM3V5X6ZABWGZBfFqRjeV8WxH5TxMDSayZAgaGZBSNLSrMP1xAmSkaMH7gEZCbaJAt5cgZDZD';

    // 4. Send POST request to Meta CAPI
    const response = await fetch(
      `https://graph.facebook.com/v12.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      }
    );

    console.log('Meta CAPI status:', response.status);

    // 5. Parse the JSON response from Meta
    const result = await response.json();
    console.log('Meta CAPI response:', result);

    // 6. Return the result to the client
    return json({success: true, result});
  } catch (error) {
    console.error('Error in meta-capi action:', error);
    return json({success: false, error: error.message}, {status: 500});
  }
}
