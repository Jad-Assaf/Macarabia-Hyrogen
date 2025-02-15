import {redirect} from '@shopify/remix-oxygen';

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 * Expected URL structure:
 * ```js
 * /cart/<variant_id>:<quantity>
 * ```
 *
 * More than one `<variant_id>:<quantity>` separated by a comma, can be supplied in the URL,
 * for carts with more than one product variant.
 *
 * @example
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 *
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context, params}) {
  const {cart, storefront} = context;
  const {lines} = params;
  if (!lines) return redirect('/cart');

  // Parse the URL lines into an array of variantId and quantity
  const lineEntries = lines.split(',').map((line) => {
    const [variantId, quantityStr] = line.split(':');
    const quantity = parseInt(quantityStr, 10);
    return { variantId, quantity };
  });

  // Build the array of full variant GIDs
  const variantGIDs = lineEntries.map(
    ({variantId}) => `gid://shopify/ProductVariant/${variantId}`
  );

  // Query the storefront API to get variant details
  const query = `#graphql
    query VariantDetails($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          title
          priceV2 {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const data = await storefront.query(query, { ids: variantGIDs });

  // Map variant details by their ID for quick lookup
  const variantMap = new Map();
  if (data && data.nodes) {
    data.nodes.forEach((variant) => {
      if (variant) {
        variantMap.set(variant.id, variant);
      }
    });
  }

  // Map each line entry to the format needed by cart.create,
  // including the dynamic variant details in selectedVariant
  const linesMap = lineEntries.map(({variantId, quantity}) => {
    const gid = `gid://shopify/ProductVariant/${variantId}`;
    const variantDetails = variantMap.get(gid);

    return {
      merchandiseId: gid,
      quantity,
      selectedVariant: {
        id: gid,
        title: variantDetails ? variantDetails.title : 'Unknown Variant',
        price: variantDetails ? parseFloat(variantDetails.priceV2.amount) : 0,
        currencyCode: variantDetails ? variantDetails.priceV2.currencyCode : 'USD',
      },
    };
  });

  // Handle discount code from query params if available
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const discount = searchParams.get('discount');
  const discountArray = discount ? [discount] : [];

  // Create the cart using the prepared linesMap and discount codes
  const result = await cart.create({
    lines: linesMap,
    discountCodes: discountArray,
  });

  const cartResult = result.cart;

  if (result.errors?.length || !cartResult) {
    throw new Response('Link may be expired. Try checking the URL.', {
      status: 410,
    });
  }

  // Update cart id in cookie
  const headers = cart.setCartId(cartResult.id);

  // Redirect to checkout if the URL exists
  if (cartResult.checkoutUrl) {
    return redirect(cartResult.checkoutUrl, {headers});
  } else {
    throw new Error('No checkout URL found');
  }
}

export default function Component() {
  return null;
}
