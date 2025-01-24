// src/utils/metaPixelEvents.js

/**
 * Utility function to extract the numeric ID from Shopify's global ID (gid).
 * Example: "gid://shopify/Product/123456789" => "123456789"
 * @param {string} gid - The global ID from Shopify.
 * @returns {string} - The extracted numeric ID.
 */
const parseGid = (gid) => { // **Updated: Renamed from extractNumericId to parseGid**
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
    // Fallback to a simple unique ID generator
    return (
      Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    );
  }
};

/**
 * Helper function to generate a combined ID from product and variant IDs.
 * @param {string} productGid - The global ID of the product.
 * @param {string} variantGid - The global ID of the variant.
 * @returns {string} - The combined ID in the format "productId_variantId".
 */
const getCombinedId = (productGid, variantGid) => { // **Added: Helper function for combinedId**
  const productId = parseGid(productGid);
  const variantId = parseGid(variantGid);
  return `${productId}_${variantId}`;
};

/**
 * Tracks a ViewContent event when a product is viewed.
 * @param {Object} product - The product details.
 */
export const trackViewContent = (product) => {
  const productId = parseGid(product.id); // **Updated: Extract Product ID**
  const variantId = parseGid(product.selectedVariant?.id); // **Added: Extract Variant ID**
  const combinedId = getCombinedId(product.id, product.selectedVariant?.id); // **Added: Generate combinedId**
  const price = product.price?.amount || 0; // **Updated: Use product.price instead of selectedVariant**
  const currency = product.price?.currencyCode || 'USD'; // **Updated: Use product.price instead of selectedVariant.currencyCode**

  const eventId = generateEventId(); // **Added event_id**

  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [combinedId], // **Updated: Use combinedId**
      content_type: 'product', // **Updated: Change from 'product_variant' to 'product'**
      event_id: eventId, // **Added event_id**
    });
  }
};

/**
 * Tracks an AddToCart event when a product is added to the cart.
 * @param {Object} product - The product details.
 */
export const trackAddToCart = (product) => {
  const productId = parseGid(product.id); // **Updated: Extract Product ID**
  const variantId = parseGid(product.selectedVariant?.id); // **Added: Extract Variant ID**
  const combinedId = getCombinedId(product.id, product.selectedVariant?.id); // **Added: Generate combinedId**
  const price = product.price?.amount || 0; // **Updated: Use product.price instead of selectedVariant**
  const currency = product.price?.currencyCode || 'USD'; // **Updated: Use product.price instead of selectedVariant.currencyCode**

  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      value: parseFloat(price),
      currency: currency,
      content_ids: [combinedId], // **Updated: Use combinedId**
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
      content_ids: order.items.map((item) => getCombinedId(item.productId, item.variantId)), // **Updated: Use combinedId**
      content_type: 'product', // **Ensure content_type is 'product'**
      currency: 'USD',
      value: order.total,
      num_items: order.items.length,
      contents: order.items.map((item) => ({
        id: getCombinedId(item.productId, item.variantId), // **Updated: Use combinedId**
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
  const eventId = generateEventId(); // **Added event_id**

  if (typeof fbq === 'function') {
    fbq('track', 'Search', {
      search_string: query,
      content_category: 'Search',
      event_id: eventId, // **Added event_id**
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
      const combinedIds = cart.items?.map((item) => getCombinedId(item.productId, item.variantId)) || []; // **Updated: Use combinedId**
      const value = parseFloat(cart.cost?.totalAmount?.amount) || 0;
      const currency = cart.cost?.totalAmount?.currencyCode || 'USD';
      const numItems = cart.items?.length || 0;


      fbq('track', 'InitiateCheckout', {
        content_ids: combinedIds, // **Updated: Use combinedIds**
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
