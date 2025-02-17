/**
 * For example: parse the numeric variant ID from Shopify GID (gid://shopify/Variant/123456789).
 */
function parseGid(gid) {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

/**
 * Generate an event_id for deduplication.
 */
function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * POST to our server endpoint (facebookConversions route).
 * This sends event data for the Meta Conversions API (server side).
 */
async function sendToServerCapi(eventData) {
  try {
    const res = await fetch('/facebookConversions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    console.log('[Client -> Server] /facebookConversions status:', res.status);
    const jsonData = await res.json();
    console.log('[Client -> Server] /facebookConversions result:', jsonData);
    return jsonData;
  } catch (error) {
    console.error('[Client -> Server] /facebookConversions error:', error);
  }
}

/**
 * ViewContent
 */
export function trackViewContent({product, userEmail, userPhone}) {
  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  // 1) Client-Side Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      value: parseFloat(price),
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      event_id: eventId,
    });
  }

  // 2) Server-Side
  sendToServerCapi({
    action_source: 'website',
    event_name: 'ViewContent',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail, // real email from user
      phone: userPhone, // real phone from user
      // The server will override the IP/UA
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      value: parseFloat(price),
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
    },
  });
}

/**
 * AddToCart
 */
export function trackAddToCart({product, userEmail, userPhone}) {
  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      value: parseFloat(price),
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      event_id: eventId,
    });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddToCart',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail,
      phone: userPhone,
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      value: parseFloat(price),
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
    },
  });
}

/**
 * Purchase
 */
export function trackPurchase({order, userEmail, userPhone}) {
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_ids: order.items.map((item) => parseGid(item.variantId)),
      content_type: 'product_variant',
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      contents: order.items.map((item) => ({
        id: parseGid(item.variantId),
        quantity: item.quantity,
        item_price: item.price,
      })),
      event_id: eventId,
    });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'Purchase',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail,
      phone: userPhone,
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      content_type: 'product_variant',
      content_ids: order.items.map((item) => parseGid(item.variantId)),
      contents: order.items.map((item) => ({
        id: parseGid(item.variantId),
        quantity: item.quantity,
        item_price: item.price,
      })),
    },
  });
}

/**
 * Search
 */
export function trackSearch({query, userEmail, userPhone}) {
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
      event_id: eventId,
    });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'Search',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail,
      phone: userPhone,
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      search_string: query,
    },
  });
}

/**
 * InitiateCheckout
 */
export function trackInitiateCheckout({cart, userEmail, userPhone}) {
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    const variantIds = cart.items?.map((item) => parseGid(item.variantId)) || [];
    const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
    const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
    const numItems = cart.items?.length || 0;

    fbq('track', 'InitiateCheckout', {
      content_ids: variantIds,
      content_type: 'product_variant',
      value,
      currency,
      num_items: numItems,
      event_id: eventId,
    });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'InitiateCheckout',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail,
      phone: userPhone,
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      content_ids: cart.items?.map((item) => parseGid(item.variantId)) || [],
      content_type: 'product_variant',
      value: parseFloat(cart.cost?.totalAmount?.amount) || 0,
      currency: cart.cost?.totalAmount?.currencyCode || 'USD',
      num_items: cart.items?.length || 0,
    },
  });
}

/**
 * AddPaymentInfo
 */
export function trackAddPaymentInfo({order, userEmail, userPhone}) {
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'AddPaymentInfo', {
      currency: 'USD',
      value: order.total,
      event_id: eventId,
    });
  }

  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddPaymentInfo',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail,
      phone: userPhone,
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
    },
  });
}
