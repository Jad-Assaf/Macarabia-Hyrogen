import { Link, useLocation } from '@remix-run/react';
import { CartForm, VariantSelector } from '@shopify/hydrogen';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { AddToCartButton } from '~/components/AddToCartButton';
import { useAside } from '~/components/Aside';

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Array<ProductVariantFragment>;
 * }}
 */
export function ProductForm({
  product,
  selectedVariant: initialSelectedVariant,
  variants,
  quantity = 1,
}) {
  const {open} = useAside();
  const location = useLocation();

  // Track selected options state
  const [selectedOptions, setSelectedOptions] = useState(
    product.options.reduce((acc, option) => {
      acc[option.name] = option.values[0]?.value || ''; // Default to the first value
      return acc;
    }, {}),
  );

  // Update selected options on change
  const handleOptionChange = (name, value) => {
    setSelectedOptions((prev) => ({...prev, [name]: value}));
  };

  // Determine the updated selected variant
  const updatedVariant = variants.find((variant) =>
    Object.entries(selectedOptions).every(([name, value]) =>
      variant.selectedOptions.some(
        (opt) => opt.name === name && opt.value === value,
      ),
    ),
  );

  // Ensure fallback quantity is safe
  const safeQuantity =
    typeof quantity === 'number' && quantity > 0 ? quantity : 1;

  // Check if we're on the product page
  const isProductPage = location.pathname.includes('/products/');

  // WhatsApp SVG as a component
  const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175.216 175.552">
      {/* Add your gradient, filters, and paths here */}
    </svg>
  );

  // Construct WhatsApp share URL
  const whatsappShareUrl = `https://api.whatsapp.com/send?phone=9613963961&text=Hi, I would like to buy ${product.title} https://macarabia.me${location.pathname}`;

  return (
    <>
      <VariantSelector
        handle={product.handle}
        options={product.options.filter((option) => option.values.length > 1)}
        variants={variants}
      >
        {({option}) => (
          <ProductOptions
            key={option.name}
            option={option}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
          />
        )}
      </VariantSelector>
      <div className="product-form">
        <AddToCartButton
          disabled={!updatedVariant || !updatedVariant.availableForSale}
          onClick={() => open('cart')}
          lines={
            updatedVariant
              ? [{merchandiseId: updatedVariant.id, quantity: safeQuantity}]
              : []
          }
        >
          {updatedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
        </AddToCartButton>
        {isProductPage && (
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-share-button"
            aria-label="Share on WhatsApp"
          >
            <WhatsAppIcon />
          </a>
        )}
      </div>
    </>
  );
}

/**
 * @param {{option: VariantOption, selectedOptions: Object, onOptionChange: Function}}
 */
function ProductOptions({option, selectedOptions, onOptionChange}) {
  return (
    <div className="product-options" key={option.name}>
      <h5 className="OptionName">
        {option.name}:{' '}
        <span className="OptionValue">{selectedOptions[option.name]}</span>
      </h5>
      <div className="product-options-grid">
        {option.values.map(({value, isAvailable}) => (
          <button
            key={option.name + value}
            className={`product-options-item ${
              selectedOptions[option.name] === value ? 'active' : ''
            }`}
            disabled={!isAvailable}
            onClick={() => onOptionChange(option.name, value)}
            style={{
              border:
                selectedOptions[option.name] === value
                  ? '1px solid #000'
                  : '1px solid transparent',
              opacity: isAvailable ? 1 : 0.3,
              borderRadius: '20px',
              transition: 'all 0.3s ease-in-out',
              backgroundColor:
                selectedOptions[option.name] === value ? '#e6f2ff' : '#f0f0f0',
              boxShadow:
                selectedOptions[option.name] === value
                  ? '0 2px 4px rgba(0,0,0,0.1)'
                  : 'none',
              transform:
                selectedOptions[option.name] === value
                  ? 'scale(0.98)'
                  : 'scale(1)',
            }}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DirectCheckoutButton({ selectedVariant, quantity }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false); // Track whether redirect is needed

  const handleAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setShouldRedirect(true); // Allow redirection after animation
    }, 300); // Complete animation before redirecting
  };

  useEffect(() => {
    return () => {
      setShouldRedirect(false); // Reset redirection when leaving the component
    };
  }, []);

  const isUnavailable = !selectedVariant?.availableForSale;

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [
          {
            merchandiseId: selectedVariant?.id,
            quantity: quantity,
            selectedOptions: selectedVariant?.selectedOptions,
          },
        ],
      }}
    >
      {(fetcher) => {
        if (shouldRedirect && fetcher.data?.cart?.checkoutUrl) {
          window.location.href = fetcher.data.cart.checkoutUrl;
        }

        return (
          <motion.button
            type="submit"
            disabled={isUnavailable || fetcher.state !== 'idle'}
            className={`buy-now-button ${isUnavailable ? 'disabled' : ''}`}
            onClick={handleAnimation}
            animate={isAnimating ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            Buy Now
          </motion.button>
        );
      }}
    </CartForm>
  );
}

/** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
