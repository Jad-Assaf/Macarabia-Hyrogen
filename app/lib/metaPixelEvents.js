/**
 * Example parse function for Shopify GID -> numeric ID
 */
function parseGid(gid) {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

/**
 * Generate a unique event ID for deduplication
 */
function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Hit our /facebookConversions route to trigger server-side CAPI.
 */
async function sendToServerCapi(eventData) {
  try {
    const res = await fetch('/facebookConversions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    console.log('[Client -> Server] /facebookConversions status:', res.status);
    const data = await res.json();
    console.log('[Client -> Server] /facebookConversions response:', data);
    return data;
  } catch (error) {
    console.error('[Client -> Server] CAPI error:', error);
  }
}

/**
 * 1) ViewContent
 */
export function trackViewContent({ product, userEmail, userPhone }) {
  if (!product || !product.selectedVariant) {
    console.error(
      "trackViewContent: product or product.selectedVariant is undefined",
      product
    );
    return;
  }
  
  const variantId = parseGid(product.selectedVariant.id);
  const price = parseFloat(product.price?.amount) || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  // Client-Side Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      value: price,
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      event_id: eventId,
    });
  }

  // Server-Side CAPI
  sendToServerCapi({
    action_source: 'website',
    event_name: 'ViewContent',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      email: userEmail || '',
      phone: userPhone || '',
      // The server route will override IP/UA with real server data
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      value: price,
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
    },
  });
}

/**
 * 2) AddToCart
 */
export function trackAddToCart({ product, userEmail, userPhone }) {
  if (!product || !product.selectedVariant) {
    console.error(
      "trackAddToCart: product or product.selectedVariant is undefined",
      product
    );
    return;
  }
  
  const variantId = parseGid(product.selectedVariant.id);
  const price = parseFloat(product.price?.amount) || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      value: price,
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
      email: userEmail || '',
      phone: userPhone || '',
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      value: price,
      currency,
      content_ids: [variantId],
      content_type: 'product_variant',
    },
  });
}

/**
 * 3) Purchase
 */
export function trackPurchase({ order, userEmail, userPhone }) {
  if (!order || !order.items || !order.items.length) {
    console.error("trackPurchase: order or order.items is undefined", order);
    return;
  }

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
      email: userEmail || '',
      phone: userPhone || '',
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
 * 4) Search
 */
export function trackSearch({ query, userEmail, userPhone }) {
  if (!query) {
    console.error("trackSearch: query is undefined");
    return;
  }
  
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
      email: userEmail || '',
      phone: userPhone || '',
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      search_string: query,
    },
  });
}

/**
 * 5) InitiateCheckout
 */
export function trackInitiateCheckout({ cart, userEmail, userPhone }) {
  if (!cart || !cart.items || !cart.items.length) {
    console.error("trackInitiateCheckout: cart or cart.items is undefined", cart);
    return;
  }
  
  const eventId = generateEventId();
  const variantIds = cart.items.map((item) => parseGid(item.variantId)) || [];
  const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
  const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
  const numItems = cart.items.length;

  if (typeof fbq === 'function') {
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
      email: userEmail || '',
      phone: userPhone || '',
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      content_ids: variantIds,
      content_type: 'product_variant',
      value,
      currency,
      num_items: numItems,
    },
  });
}

/**
 * 6) AddPaymentInfo
 */
export function trackAddPaymentInfo({ order, userEmail, userPhone }) {
  if (!order) {
    console.error("trackAddPaymentInfo: order is undefined", order);
    return;
  }
  
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
      email: userEmail || '',
      phone: userPhone || '',
      client_ip_address: '0.0.0.0',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
    },
  });
}
