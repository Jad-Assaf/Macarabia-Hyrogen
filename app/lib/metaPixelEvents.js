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
export const trackViewContent = (product, customerData = {}) => {
  // Guard: Prevent multiple ViewContent events per page load.
  if (window.__viewContentTracked) return;
  window.__viewContentTracked = true;

  const variantId = parseGid(product.selectedVariant?.id);
  const price = product.price?.amount || 0;
  const currency = product.price?.currencyCode || 'USD';
  const eventId = generateEventId();

  // Retrieve fbp and fbc from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  // Destructure customerData passed in (from your loader or context)
  const {
    email = '', 
    phone = '',
    external_id = customerData.id || '', // Use customer.id as external_id if available
    fb_login_id = '', // Only available if using Facebook Login
  } = customerData;

  // Optionally, you can also extract fbclid from URL:
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid') || '';

  // New fields as per required naming
  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';

  // Client-side Facebook Pixel with updated field names and extra identifiers
  if (typeof fbq === 'function') {
    fbq(
      'track',
      'ViewContent',
      {
        URL,
        "Event id": eventId,
        value: parseFloat(price),
        currency: currency,
        content_ids: [variantId],
        content_type: 'product_variant',
        content_name,
        content_category,
        fbp,
        fbc,
        external_id,
        email,
        phone,
        fb_login_id,
        fbclid,
      },
      { eventID: eventId }
    );
  }

  // Server-side Conversions API with updated field names and extra identifiers
  sendToServerCapi({
    action_source: 'website',
    event_name: 'ViewContent',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '', // Will be replaced with the real IP by sendToServerCapi
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      URL,
      "Event id": eventId,
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      content_name,
      content_category,
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

  // Retrieve fbp and fbc from cookies for extra identifiers
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const external_id = ''; // No customerData provided in this function

  // New fields as per required naming
  const URL = window.location.href;
  const content_name = product.title || '';
  const content_category = product.productType || '';
  const num_items = product.quantity || 1; // default to 1 if quantity is not provided

  // Client-side Facebook Pixel with updated field names and extra identifiers
  if (typeof fbq === 'function') {
    fbq(
      'track',
      'AddToCart',
      {
        URL,
        "Event id": eventId,
        value: parseFloat(price),
        currency: currency,
        content_ids: [variantId],
        content_type: 'product_variant',
        content_name,
        content_category,
        num_items,
        fbp,
        fbc,
        external_id,
      },
      { eventID: eventId }
    );
  }

  // Server-side Conversions API with updated field names and extra identifiers
  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddToCart',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      URL,
      "Event id": eventId,
      value: parseFloat(price),
      currency: currency,
      content_ids: [variantId],
      content_type: 'product_variant',
      content_name,
      content_category,
      num_items,
    },
  });
};

/**
 * Tracks a Purchase event after a successful purchase.
 * @param {Object} order - The order details.
 */
export const trackPurchase = (order) => {
  const eventId = generateEventId();

  // Retrieve fbp and fbc from cookies for extra identifiers
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const external_id = ''; // No customerData provided in this function

  // Client-side Facebook Pixel with updated extra identifiers
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
      fbp,
      fbc,
      external_id,
    }, {
      eventID: eventId
    });
  }

  // Server-side Conversions API with updated extra identifiers
  sendToServerCapi({
    action_source: 'website',
    event_name: 'Purchase',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
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

  // Retrieve fbp and fbc from cookies for extra identifiers
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const external_id = ''; // No customerData provided in this function

  // Client-side Facebook Pixel with updated extra identifiers
  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
      fbp,
      fbc,
      external_id,
    }, {
      eventID: eventId
    });
  }

  // Server-side Conversions API with updated extra identifiers
  sendToServerCapi({
    action_source: 'website',
    event_name: 'Search',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
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
  const num_items = cart.items?.length || 0;
  const URL = window.location.href;

  // Retrieve fbp and fbc from cookies for extra identifiers
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const external_id = ''; // No customerData provided in this function

  // Client-side Facebook Pixel with updated field names and extra identifiers
  if (typeof fbq === 'function') {
    try {
      fbq(
        'track',
        'InitiateCheckout',
        {
          URL,
          "Event id": eventId,
          value,
          currency,
          content_ids: variantIds,
          content_type: 'product_variant',
          num_items,
          fbp,
          fbc,
          external_id,
        },
        { eventID: eventId }
      );
    } catch (error) {
      console.error('Error tracking InitiateCheckout:', error);
    }
  }

  // Server-side Conversions API with updated field names and extra identifiers
  sendToServerCapi({
    action_source: 'website',
    event_name: 'InitiateCheckout',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      URL,
      "Event id": eventId,
      value,
      currency,
      content_ids: variantIds,
      content_type: 'product_variant',
      num_items,
    },
  });
};

/**
 * Tracks an AddPaymentInfo event when a user adds payment information.
 * @param {Object} order - The order details.
 */
export const trackAddPaymentInfo = (order) => {
  const eventId = generateEventId();

  // Retrieve fbp and fbc from cookies for extra identifiers
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const external_id = ''; // No customerData provided in this function

  // Client-side Facebook Pixel with updated extra identifiers
  if (typeof fbq === 'function') {
    fbq('track', 'AddPaymentInfo', {
      currency: 'USD',
      value: order.total,
      fbp,
      fbc,
      external_id,
    }, {
      eventID: eventId
    });
  }

  // Server-side Conversions API with updated extra identifiers
  sendToServerCapi({
    action_source: 'website',
    event_name: 'AddPaymentInfo',
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      client_ip_address: '',
      client_user_agent: navigator.userAgent,
      fbp,
      fbc,
      external_id,
    },
    custom_data: {
      currency: 'USD',
      value: order.total,
    },
  });
};
