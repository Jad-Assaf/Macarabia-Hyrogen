// src/hooks/useCustomerTrackingData.js
import { useLoaderData } from '@remix-run/react';

export const useCustomerTrackingData = () => {
  // Helper to read a cookie
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };

  // Get fbp and fbc from cookies
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  // If your loader returns customer data, grab it here.
  // (Make sure your loader includes a 'customer' field.)
  const loaderData = useLoaderData();
  const customer = loaderData?.customer || {};

  const email = customer.email || '';
  const phone = customer.phone || '';
  const external_id = customer.id || ''; // or hash the email if preferred
  const fb_login_id = customer.fbLoginId || ''; // if applicable

  // Optionally, extract fbclid from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid') || '';

  return { fbp, fbc, email, phone, external_id, fb_login_id, fbclid };
};
