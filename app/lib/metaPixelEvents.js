/**
 * Utility function to extract the numeric ID from Shopify's global ID (gid).
 * Example: "gid://shopify/Product/123456789" => "123456789"
 * @param {string} gid - The global ID from Shopify.
 * @returns {string} - The extracted numeric ID.
 */
const parseGid = (gid) => {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

/**
 * Helper function to generate unique event IDs.
 * Uses crypto.randomUUID if available, otherwise falls back to a custom method.
 * @returns {string} - A unique event ID.
 */
const generateEventId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

/**
 * Fetches the real IP address using the ipify API.
 * @returns {Promise<string>} The real IP address.
 */
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

/**
 * Sends event data to our /facebookConversions endpoint (server-side).
 * It fetches the real IP and injects it into the payload before sending.
 * @param {Object} eventData - The event data payload.
 */
const sendToServerCapi = async (eventData) => {
  // Fetch the real IP and override the client_ip_address
  const ip = await getRealIp();
  eventData.user_data = eventData.user_data || {};
  eventData.user_data.client_ip_address = ip;

  fetch('/facebookConversions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
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

/**
 * Tracks a ViewContent event when a product is viewed.
 * A guard prevents firing the same event multiple times on the same page load.
 * @param {Object} product - The product details.
 */
export const trackViewContent = (product) => {
  // Guard: Prevent multiple ViewContent events per page load.
  if (window.__viewContentTracked) return;
  window.__viewContentTracked = true;

  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  // Client-side Facebook Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      event_id: eventId,
    });
  }

  // Server-side Conversions API
  sendToServerCapi({
    action_source: 'website',
    event_name: 'ViewContent',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      // The real IP will be injected by sendToServerCapi
      client_ip_address: '', 
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
    },
  });
};

/**
 * Tracks an AddToCart event when a product is added to the cart.
 * @param {Object} product - The product details.
 */
export const trackAddToCart = (product) => {
  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  // Client-side Facebook Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      event_id: eventId,
    });
  }

  // Server-side Conversions API
  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddToCart',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
    },
  });
};

/**
 * Tracks a Purchase event after a successful purchase.
 * @param {Object} order - The order details.
 */
export const trackPurchase = (order) => {
  const eventId = generateEventId();

  // Client-side Facebook Pixel
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

  // Server-side Conversions API
  sendToServerCapi({
    action_source: 'website',
    event_name: 'Purchase',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
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
};

/**
 * Tracks a Search event when a user performs a search.
 * @param {string} query - The search query.
 */
export const trackSearch = (query) => {
  const eventId = generateEventId();

  // Client-side Facebook Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
      event_id: eventId,
    });
  }

  // Server-side Conversions API
  sendToServerCapi({
    action_source: 'website',
    event_name: 'Search',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      search_string: query,
    },
  });
};

/**
 * Tracks an InitiateCheckout event when a user starts the checkout process.
 * @param {Object} cart - The cart details.
 */
export const trackInitiateCheckout = (cart) => {
  const eventId = generateEventId();
  const variantIds = cart.items?.map((item) => parseGid(item.variantId)) || [];
  const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
  const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
  const numItems = cart.items?.length || 0;

  // Client-side Facebook Pixel
  if (typeof fbq === 'function') {
    try {
      fbq('track', 'InitiateCheckout', {
        content_ids: variantIds,
        content_type: 'product_variant',
        value: value,
        currency: currency,
        num_items: numItems,
        event_id: eventId,
      });
    } catch (error) {
      console.error('Error tracking InitiateCheckout:', error);
    }
  }

  // Server-side Conversions API
  sendToServerCapi({
    action_source: 'website',
    event_name: 'InitiateCheckout',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      content_ids: variantIds,
      content_type: 'product_variant',
      value: value,
      currency: currency,
      num_items: numItems,
    },
  });
};

/**
 * Tracks an AddPaymentInfo event when a user adds payment information.
 * @param {Object} order - The order details.
 */
export const trackAddPaymentInfo = (order) => {
  const eventId = generateEventId();

  // Client-side Facebook Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'AddPaymentInfo', {
      currency: 'USD',
      value: order.total,
      event_id: eventId,
    });
  }

  // Server-side Conversions API
  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddPaymentInfo',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
    },
  });
};
