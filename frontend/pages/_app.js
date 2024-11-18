import { MoralisProvider } from "react-moralis";
import { NotificationProvider } from "web3uikit";
import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/dist/styles.min.css";
// import '../styles/Cluster.module.css';
import "../styles/globals.css";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: "https://api.studio.thegraph.com/query/68690/opencity/version/latest",
});

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider initializeOnMount={false}>
      <ApolloProvider client={client}>
        <NotificationProvider>
          <Component {...pageProps} />
        </NotificationProvider>
      </ApolloProvider>
    </MoralisProvider>
  );
}

export default MyApp;
