// In your root component (e.g., root.jsx)
import {useEffect} from 'react';

export default function RootLayout({children}) {
  useEffect(() => {
    window.SearchaniseAdmin = {
      host: 'https://searchserverapi.com',
      PrivateKey: '9c9A3t3j7A',
      ReSyncLink: 'https://your_store/admin/searchanise/start_resync',
      LastRequest: '12.06.2022', // or dynamically generate the timestamp
      LastResync: '12.06.2022',
      ConnectLink: 'https://your_store/admin/searchanise/connect',
      AddonStatus: 'enabled',
      ShowResultsControlPanel: true,
      Engines: [
        {
          PrivateKey: '7i4P6A4r3u7m2L7y1f5p',
          LangCode: 'EN',
          Name: 'English',
          ExportStatus: 'done',
          PriceFormat: {
            rate: 1.0,
            symbol: '$',
            decimals: 2,
            decimals_separator: '.',
            thousands_separator: ',',
            after: false,
          },
        },
        // Add more engines if your store supports additional languages
      ],
    };
  }, []);

  return (
    <html lang="en">
      <head>
        {/* Insert the Searchanise script */}
        <script
          type="text/javascript"
          src="https://searchserverapi.com/js/init.js"
          async
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
