import {Money} from '@shopify/hydrogen';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice}) {
  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="product-price-on-sale">
          {price?.amount === '0' || price?.amount === '0.0' ? (
            <span>Call for price</span>
          ) : price ? (
            <Money data={price} />
          ) : null}
          <s>
            <Money data={compareAtPrice} />
          </s>
        </div>
      ) : price?.amount === '0' || price?.amount === '0.0' ? (
        <span>Call for price</span>
      ) : price ? (
        <Money data={price} />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
