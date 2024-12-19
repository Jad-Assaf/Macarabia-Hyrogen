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
  // Create the Content Security Policy with custom directives
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://cdn.shopify.com', 'https://shopify.com'],
      scriptSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        'https://www.clarity.ms', // Allow Microsoft Clarity scripts
      ],
      styleSrc: [
        "'self'",
        'https://cdn.shopify.com',
        'https://fonts.googleapis.com',
      ],
      imgSrc: ["'self'", 'https://cdn.shopify.com', 'data:'], // Allow inlined images
      connectSrc: ["'self'", 'https://www.clarity.ms'], // Allow Clarity connections
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Allow font loading
    },
  });

  // Render the app
  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  // Set headers for response
  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
/** @typedef {import('@shopify/remix-oxygen').AppLoadContext} AppLoadContext */
