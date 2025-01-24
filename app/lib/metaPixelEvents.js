// src/utils/metaPixelEvents.js

/**
 * Utility function to extract the numeric ID from Shopify's global ID (gid).
 * Example: "gid://shopify/Product/123456789" => "123456789"
 * @param {string} gid - The global ID from Shopify.
 * @returns {string} - The extracted numeric ID.
 */
const extractNumericId = (gid) => {
  if (!gid) return '';
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

/**
 * Tracks a ViewContent event when a product is viewed.
 * @param {Object} product - The product details.
 */
export const trackViewContent = (product) => {
  const productId = extractNumericId(product.id); // **Updated: Extract Product ID**
  const price = product.price?.amount || 0; // **Updated: Use product.price instead of selectedVariant**
  const currency = product.price?.currencyCode || 'USD'; // **Updated: Use product.price instead of selectedVariant.currencyCode**

  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [productId], // **Updated: Use Product ID**
      content_type: 'product', // **Updated: Change from 'product_variant' to 'product'**
    });
  }
};

/**
 * Tracks an AddToCart event when a product is added to the cart.
 * @param {Object} product - The product details.
 */
export const trackAddToCart = (product) => {
  const productId = extractNumericId(product.id); // **Updated: Extract Product ID**
  const price = product.price?.amount || 0; // **Updated: Use product.price instead of selectedVariant**
  const currency = product.price?.currencyCode || 'USD'; // **Updated: Use product.price instead of selectedVariant.currencyCode**

  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [productId], // **Updated: Use Product ID**
      content_type: 'product', // **Updated: Change from 'product_variant' to 'product'**
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
      content_ids: order.items.map((item) => extractNumericId(item.productId)), // **Updated: Use Product ID**
      content_type: 'product', // **Ensure content_type is 'product'**
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      contents: order.items.map((item) => ({
        id: extractNumericId(item.productId), // **Updated: Use Product ID**
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
    try {
      const contentIds = cart.items?.map((item) => extractNumericId(item.productId)) || []; // **Updated: Use Product ID**
      const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
      const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
      const numItems = cart.items?.length || 0;

      fbq('track', 'InitiateCheckout', {
        content_ids: contentIds, // **Updated: Use Product IDs**
        content_type: 'product', // **Ensure content_type is 'product'**
        value: value,
        currency: currency,
        num_items: numItems,
      });
    } catch (error) {
      console.error('Error tracking InitiateCheckout:', error);
    }
  } else {
    console.warn('fbq is not defined. Ensure Meta Pixel is initialized correctly.');
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
