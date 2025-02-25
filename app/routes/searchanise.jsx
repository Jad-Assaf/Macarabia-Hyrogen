import {useState} from 'react';

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();

    // Prepare URL-encoded parameters
    const params = new URLSearchParams();
    params.append('api_key', '2q4z1o1Y1r7H9Z0R6w6X'); // your correct API key
    params.append('query', query);
    // Append other parameters if required by your API docs

    try {
      const response = await fetch(
        'https://searchserverapi.com/api/search/json',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        },
      );
      const data = await response.json();
      // Adjust this based on the actual structure of the response
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div>
        {results.length ? (
          results.map((item) => (
            <div key={item.id}>
              <h3>{item.title}</h3>
              <img
                src={item.image}
                alt={item.title}
                style={{maxWidth: '200px'}}
              />
              {/* Render additional product details as needed */}
            </div>
          ))
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
}
