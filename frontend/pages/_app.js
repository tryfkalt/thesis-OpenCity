import { MoralisProvider } from "react-moralis";
import { NotificationProvider } from "web3uikit";
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
// import '../styles/Cluster.module.css';
import '../styles/globals.css'; // Your global styles

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider initializeOnMount={false}>
      <NotificationProvider>
        <Component {...pageProps} />
      </NotificationProvider>
    </MoralisProvider>
  );
}

export default MyApp;