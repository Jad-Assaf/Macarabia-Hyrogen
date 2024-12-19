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
  // Ensure environment variables are set
  if (!context.env.PUBLIC_CHECKOUT_DOMAIN || !context.env.PUBLIC_STORE_DOMAIN) {
    console.error(
      'Missing environment variables: PUBLIC_CHECKOUT_DOMAIN or PUBLIC_STORE_DOMAIN',
    );
    return new Response('Server Error: Missing environment variables', {
      status: 500,
    });
  }

  // Configure CSP
  let nonce, header, NonceProvider;
  try {
    const csp = createContentSecurityPolicy({
      shop: {
        checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
        storeDomain: context.env.PUBLIC_STORE_DOMAIN,
      },
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          'https://www.clarity.ms',
          'https://www.googletagmanager.com',
        ],
        connectSrc: [
          "'self'",
          'https://www.clarity.ms',
          'https://www.google-analytics.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'https://www.clarity.ms'],
        frameSrc: ['https://www.youtube.com'], // Example iframe source
      },
    });

    nonce = csp.nonce;
    header = csp.header;
    NonceProvider = csp.NonceProvider;
  } catch (error) {
    console.error('Error generating CSP:', error);
    return new Response('Server Error: Failed to generate CSP', {status: 500});
  }

  // Render the React app to a readable stream
  let body;
  try {
    body = await renderToReadableStream(
      <NonceProvider>
        <RemixServer context={remixContext} url={request.url} />
      </NonceProvider>,
      {
        nonce,
        signal: request.signal,
        onError(error) {
          console.error('Error during rendering:', error);
          responseStatusCode = 500;
        },
      },
    );

    if (isbot(request.headers.get('user-agent'))) {
      await body.allReady;
    }
  } catch (error) {
    console.error('Error during server-side rendering:', error);
    return new Response('Server Error: Rendering failed', {
      status: 500,
    });
  }

  // Set headers and return response
  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
/** @typedef {import('@shopify/remix-oxygen').AppLoadContext} AppLoadContext */
