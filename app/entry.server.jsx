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
  try {
    const {nonce, header, NonceProvider} = createContentSecurityPolicy({
      shop: {
        checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
        storeDomain: context.env.PUBLIC_STORE_DOMAIN,
      },
      scriptSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        'https://www.clarity.ms',
        'https://*.clarity.ms',
      ],
      connectSrc: ["'self'", 'https://www.clarity.ms', 'https://*.clarity.ms'],
    });

    console.log('CSP Header:', header);

    const body = await renderToReadableStream(
      <NonceProvider>
        <RemixServer context={remixContext} url={request.url} />
      </NonceProvider>,
      {
        nonce,
        signal: request.signal,
        onError(error) {
          console.error('Render Error:', error);
          responseStatusCode = 500;
        },
      },
    );

    responseHeaders.set('Content-Security-Policy', header);
    responseHeaders.set('Content-Type', 'text/html');

    return new Response(body, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  } catch (error) {
    console.error('Server Error:', error);
    return new Response('Internal Server Error', {status: 500});
  }
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
/** @typedef {import('@shopify/remix-oxygen').AppLoadContext} AppLoadContext */
