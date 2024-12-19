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
  const { open } = useAside();
  const [selectedOptions, setSelectedOptions] = useState({});
  const safeQuantity = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
  const location = useLocation();
  const isProductPage = location.pathname.includes('/products/');

  // WhatsApp SVG as a component
  const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175.216 175.552"> {/* SVG content */} </svg>
  );

  // Construct WhatsApp share URL
  const whatsappShareUrl = `https://api.whatsapp.com/send?phone=9613963961&text=Hi, I would like to buy ${product.title} https://macarabia.me${location.pathname}`;

  // Function to get available options based on selected options
  const getAvailableOptions = () => {
    const availableOptions = {};

    variants.forEach(variant => {
      const optionKey = variant.selectedOptions.map(option => option.value).join('-');
      if (!availableOptions[optionKey]) {
        availableOptions[optionKey] = variant;
      }
    });

    return availableOptions;
  };

  const availableOptions = getAvailableOptions();

  return (
    <>
      <VariantSelector
        handle={product.handle}
        options={product.options.filter((option) => option.values.length > 1)}
        variants={variants}
      >
        {({ option }) => (
          <ProductOptions
            key={option.name}
            option={option}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            availableOptions={availableOptions}
          />
        )}
      </VariantSelector>
      <div className="product-form">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={selectedVariant
            ? [
              {
                merchandiseId: selectedVariant.id,
                quantity: safeQuantity,
                selectedVariant,
              },
            ]
            : []}
        >
          {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
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
 * @param {{option: VariantOption, selectedOptions: Object, setSelectedOptions: Function, availableOptions: Object}}
 */
function ProductOptions({ option, selectedOptions, setSelectedOptions, availableOptions }) {
  const handleOptionChange = (value) => {
    setSelectedOptions(prev => ({ ...prev, [option.name]: value }));
  };

  return (
    <div className="product-options" key={option.name}>
      <h5 className='OptionName'>{option.name}:</h5>
      <div className="product-options-grid">
        {option.values.map(({ value }) => {
          const isActive = selectedOptions[option.name] === value;
          const isAvailable = Object.keys(availableOptions).some(key => {
            const selectedValues = key.split('-');
            const currentIndex = option.name === 'Option 1' ? 0 : 1; // Adjust based on your option names
            return selectedValues[currentIndex] === value;
          });

          return (
            <button
              className="product-options-item"
              key={option.name + value}
              style={{
                border: isActive ? '1px solid #000' : '1px solid transparent',
                opacity: isAvailable ? 1 : 0.3,
                borderRadius: '20px',
                transition: 'all 0.3s ease-in-out',
                backgroundColor: isActive ? '#e6f2ff' : '#f0f0f0',
                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                transform: isActive ? 'scale(0.98)' : 'scale(1)',
              }}
              onClick={() => isAvailable && handleOptionChange(value)}
              disabled={!isAvailable} // Disable button if not available
            >
              {value}
            </button>
          );
        })}
      </div>
      <br />
    </div>
  );
}
export function DirectCheckoutButton({ selectedVariant, quantity }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const handleAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setShouldRedirect(true);
    }, 300);
  };

  useEffect(() => {
    return () => {
      setShouldRedirect(false);
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