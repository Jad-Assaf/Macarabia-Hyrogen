import {useEffect} from 'react';

export default function SearchanisePage() {
  useEffect(() => {
    window.SearchaniseAdmin = {
      host: 'https://searchserverapi.com',
      PrivateKey: '7i4P6A4r3u7m2L7y1f5p',
      ReSyncLink:
        'https://d40293-4.myshopify.com/admin/searchanise/start_resync',
      LastRequest: '12.06.2022', // or dynamically generate the timestamp
      LastResync: '12.06.2022',
      ConnectLink: 'https://d40293-4.myshopify.com/admin/searchanise/connect',
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
      ],
    };
  }, []);

  return (
    <div>
      <h1>Searchanise Admin Panel</h1>
      {/* Container for the Searchanise widget */}
      <div className="snize" id="snize_container"></div>
      {/* Load the Searchanise script */}
      <script
        type="text/javascript"
        src="https://searchserverapi.com/js/init.js"
        async
      ></script>
    </div>
  );
}
