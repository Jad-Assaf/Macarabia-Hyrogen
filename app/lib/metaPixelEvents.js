// src/utils/metaPixelEvents.js

/**
 * Tracks a ViewContent event when a product is viewed.
 * @param {Object} product - The product details.
 */
export const trackViewContent = (product) => {
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      content_name: product.title,
      content_category: product.category,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'USD',
    });
  }
};

/**
 * Tracks an AddToCart event when a product is added to the cart.
 * @param {Object} product - The product details.
 */
export const trackAddToCart = (product) => {
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      content_name: product.title,
      content_category: product.category,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'USD',
    });
  }
};

/**
 * Tracks a Purchase event after a successful purchase.
 * @param {Object} order - The order details.
 */
export const trackPurchase = (order) => {
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_ids: order.items.map((item) => item.id),
      content_type: 'product',
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      contents: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
    });
  }
};

/**
 * Tracks a Search event when a user performs a search.
 * @param {string} query - The search query.
 */
export const trackSearch = (query) => {
  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
    });
  }
};

/**
 * Tracks an InitiateCheckout event when a user starts the checkout process.
 * @param {Object} cart - The cart details.
 */
export const trackInitiateCheckout = (cart) => {
  if (typeof fbq === 'function') {
    fbq('track', 'InitiateCheckout', {
      content_ids: cart.items.map((item) => item.id),
      content_type: 'product',
      value: cart.total,
      currency: 'USD',
      num_items: cart.items.length,
    });
  }
};

/**
 * Tracks an AddPaymentInfo event when a user adds payment information.
 * @param {Object} order - The order details.
 */
export const trackAddPaymentInfo = (order) => {
  if (typeof fbq === 'function') {
    fbq('track', 'AddPaymentInfo', {
      currency: 'USD',
      value: order.total,
    });
  }
};
