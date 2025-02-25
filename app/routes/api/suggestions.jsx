// app/routes/api/suggestions.jsx
import {json} from '@remix-run/node';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  if (!query) {
    return json({suggestions: []});
  }

  const apiKey = '5c3N7y6v5T';
  // According to the docs, use the /getresults endpoint with suggestions=true
  const suggestionsUrl = `https://searchserverapi.com/getresults?apiKey=${apiKey}&q=${encodeURIComponent(
    query,
  )}&output=json&suggestions=true`;

  const res = await fetch(suggestionsUrl, {
    method: 'GET',
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Suggestions API error:', errorText);
    throw new Response(errorText, {status: res.status});
  }

  const data = await res.json();
  // Return the suggestions array from the response (or an empty array)
  return json({suggestions: data.suggestions || []});
}
