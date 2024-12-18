import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} remixContext
 * @param {AppLoadContext} context
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
  context,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    directives: {
      defaultSrc: ["'self'"], // Default policy for other types of content
      scriptSrc: [
        "'self'", // Allow scripts from the same origin
        `'nonce-${nonce}'`, // Allow inline scripts with the generated nonce
        'https://www.clarity.ms', // Allow Microsoft Clarity scripts
        'https://www.googletagmanager.com', // Allow Google Tag Manager
      ],
      connectSrc: [
        "'self'",
        'https://www.clarity.ms',
        'https://www.google-analytics.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (if needed)
      imgSrc: ["'self'", 'https://www.clarity.ms'], // Allow images
      frameSrc: ['https://www.youtube.com'], // Example for iframe sources
    },
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error('Error during server-side rendering:', error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
/** @typedef {import('@shopify/remix-oxygen').AppLoadContext} AppLoadContext */
