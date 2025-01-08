import {CartForm, Money} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';

/**
 * @param {CartSummaryProps}
 */
export function CartSummary({cart, layout}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  // Convert subtotal to a number (defaulting to 0 if not available)
  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount ?? '0');

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4>
        <strong>Subtotal</strong>
      </h4>
      <dl className="cart-subtotal">
        <dd>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money
              data={cart.cost.subtotalAmount}
              style={{fontWeight: '500'}}
            />
          ) : (
            '-'
          )}
        </dd>
      </dl>

      <CartCheckoutActions
        checkoutUrl={cart.checkoutUrl}
        cartTotal={subtotal}
      />
    </div>
  );
}

/**
 * @param {{checkoutUrl?: string}}
 */
export default function CartCheckoutActions({checkoutUrl, cartTotal = 0}) {
  // Local state to track whether we show the popup
  const [showPopup, setShowPopup] = useState(false);

  // Hide the popup automatically if the subtotal goes below $5000
  useEffect(() => {
    if (cartTotal < 5000 && showPopup) {
      setShowPopup(false);
    }
  }, [cartTotal, showPopup]);

  // Handle the button click
  const handleCheckoutClick = (event) => {
    if (cartTotal > 5000) {
      // Prevent navigation and show the popup
      event.preventDefault();
      setShowPopup(true);
    }
  };

  return (
    <div className="cart-checkout-container">
      <a
        href={checkoutUrl}
        target="_self"
        className={`cart-checkout-button ${cartTotal > 5000 ? 'disabled' : ''}`}
        onClick={handleCheckoutClick}
      >
        <p>Continue to Checkout &nbsp; &rarr;</p>
      </a>

      {/* Simple popup/modal overlay */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>Your order is above $5000. Please contact sales to proceed.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: CartApiQueryFragment['discountCodes'];
 * }}
 */
function CartDiscounts({discountCodes}) {
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button>Remove</button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: string[];
 *   children: React.ReactNode;
 * }}
 */
function UpdateDiscountForm({discountCodes, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

/**
 * @param {{
 *   giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
 * }}
 */
function CartGiftCard({giftCardCodes}) {
  const appliedGiftCardCodes = useRef([]);
  const giftCardCodeInput = useRef(null);
  const codes =
    giftCardCodes?.map(({lastCharacters}) => `***${lastCharacters}`) || [];

  function saveAppliedCode(code) {
    const formattedCode = code.replace(/\s/g, ''); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
    giftCardCodeInput.current.value = '';
  }

  function removeAppliedCode() {
    appliedGiftCardCodes.current = [];
  }

  return (
    <div>
      {/* Have existing gift card applied, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Applied Gift Card(s)</dt>
          <UpdateGiftCardForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button onSubmit={() => removeAppliedCode}>Remove</button>
            </div>
          </UpdateGiftCardForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateGiftCardForm
        giftCardCodes={appliedGiftCardCodes.current}
        saveAppliedCode={saveAppliedCode}
      >
        <div>
          <input
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
          />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateGiftCardForm>
    </div>
  );
}

/**
 * @param {{
 *   giftCardCodes?: string[];
 *   saveAppliedCode?: (code: string) => void;
 *   removeAppliedCode?: () => void;
 *   children: React.ReactNode;
 * }}
 */
function UpdateGiftCardForm({giftCardCodes, saveAppliedCode, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
      inputs={{
        giftCardCodes: giftCardCodes || [],
      }}
    >
      {(fetcher) => {
        const code = fetcher.formData?.get('giftCardCode');
        if (code) saveAppliedCode && saveAppliedCode(code);
        return children;
      }}
    </CartForm>
  );
}

/**
 * @typedef {{
 *   cart: OptimisticCart<CartApiQueryFragment | null>;
 *   layout: CartLayout;
 * }} CartSummaryProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCart} OptimisticCart */
