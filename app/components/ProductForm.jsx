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
  const [selectedOptions, setSelectedOptions] = useState(() => {
    const initialOptions = {};
    product.options.forEach((option) => {
      initialOptions[option.name] = option.values[0]?.value || '';
    });
    return initialOptions;
  });

  // Update selected options dynamically based on availability
  const handleOptionChange = (optionName, value) => {
    const updatedOptions = { ...selectedOptions, [optionName]: value };

    // Check if the new combination is valid
    const isValidCombination = variants.some((variant) =>
      variant.selectedOptions.every(
        (opt) => updatedOptions[opt.name] === opt.value
      )
    );

    // If valid, update options; otherwise, adjust dependent options
    if (isValidCombination) {
      setSelectedOptions(updatedOptions);
    } else {
      const adjustedOptions = adjustOptions(updatedOptions, variants);
      setSelectedOptions(adjustedOptions);
    }
  };

  // Adjust dependent options to find a valid combination
  const adjustOptions = (options, variants) => {
    const validVariant = variants.find((variant) =>
      variant.selectedOptions.every(
        (opt) => options[opt.name] === opt.value || !options[opt.name]
      )
    );

    if (validVariant) {
      const adjustedOptions = {};
      validVariant.selectedOptions.forEach(
        (opt) => (adjustedOptions[opt.name] = opt.value)
      );
      return adjustedOptions;
    }

    return options; // Fallback to current options
  };

  return (
    <div className="product-form">
      {product.options.map((option) => (
        <div key={option.name} className="product-option">
          <h5>
            {option.name}: {selectedOptions[option.name]}
          </h5>
          <div className="option-values">
            {option.values.map((value) => {
              const isActive = selectedOptions[option.name] === value.value;
              const isAvailable = variants.some((variant) =>
                variant.selectedOptions.every(
                  (opt) =>
                    (opt.name === option.name && opt.value === value.value) ||
                    selectedOptions[opt.name] === opt.value
                )
              );

              return (
                <button
                  key={value.value}
                  onClick={() => handleOptionChange(option.name, value.value)}
                  disabled={!isAvailable}
                  style={{
                    background: isActive ? '#e6f2ff' : '#f0f0f0',
                    opacity: isAvailable ? 1 : 0.3,
                  }}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity,
                  selectedOptions,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({ option }) {
  return (
    <div className="product-options" key={option.name}>
      <h5 className='OptionName'>{option.name}: <span className='OptionValue'>{option.value}</span></h5>
      <div className="product-options-grid">
        {option.values.map(({ value, isAvailable, isActive, to, variant }) => {
          // Check if the option is 'Color' and if the variant has an image
          const isColorOption = option.name.toLowerCase() === 'color';
          const variantImage = isColorOption && variant?.image?.url;

          return (
            <Link
              className="product-options-item"
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
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
              {variantImage ? (
                <img
                  src={variantImage}
                  alt={value}
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                />
              ) : (
                value
              )}
            </Link>
          );
        })}
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
