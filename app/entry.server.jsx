import { RemixServer } from '@remix-run/react';
import isbot from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { createContentSecurityPolicy } from '@shopify/hydrogen';

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
  const { nonce, header, NonceProvider } = createContentSecurityPolicy({
    shop: {
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    directives: {
      scriptSrc: [
        "'self'", // Allow scripts from the same origin
        "'nonce-" + nonce + "'", // Allow scripts with the correct nonce
        'https://www.clarity.ms', // Allow scripts from Microsoft Clarity
        'https://www.googletagmanager.com', // Allow Google Tag Manager
        // Add any other trusted script sources here
      ],
      connectSrc: [
        "'self'",
        'https://www.clarity.ms',
        'https://www.google-analytics.com',
        // Add other connect sources if needed
      ],
      // Add other CSP directives if necessary
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
        // eslint-disable-next-line no-console
        console.error(error);
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
