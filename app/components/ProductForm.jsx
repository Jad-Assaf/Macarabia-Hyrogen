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
export function ProductForm({ product, selectedVariant, variants, quantity = 1 }) {
  const [selectedOptions, setSelectedOptions] = useState(
    product.options.reduce((acc, option) => {
      acc[option.name] = option.values[0].value; // Default to the first value for each option
      return acc;
    }, {})
  );

  const handleOptionChange = (name, value) => {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
  };

  const updatedVariant = variants.find((variant) =>
    Object.entries(selectedOptions).every(([name, value]) =>
      variant.selectedOptions.some((opt) => opt.name === name && opt.value === value)
    )
  );

  return (
    <>
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({ option }) => (
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
              ? [{ merchandiseId: updatedVariant.id, quantity }]
              : []
          }
        >
          {updatedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
        </AddToCartButton>
      </div>
    </>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({ option, selectedOptions, onOptionChange }) {
  return (
    <div className="product-options" key={option.name}>
      <h5 className="OptionName">
        {option.name}: <span className="OptionValue">{selectedOptions[option.name]}</span>
      </h5>
      <div className="product-options-grid">
        {option.values.map(({ value, isAvailable, isActive, to }) => (
          <button
            key={option.name + value}
            className={`product-options-item ${isActive ? 'active' : ''}`}
            disabled={!isAvailable}
            onClick={() => onOptionChange(option.name, value)}
            style={{
              border: isActive ? '1px solid #000' : '1px solid transparent',
              opacity: isAvailable ? 1 : 0.3,
              borderRadius: '20px',
              transition: 'all 0.3s ease-in-out',
              backgroundColor: isActive ? '#e6f2ff' : '#f0f0f0',
              boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transform: isActive ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <br />
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
