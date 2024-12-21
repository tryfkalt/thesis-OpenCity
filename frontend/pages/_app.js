import { MoralisProvider } from "react-moralis";
import { NotificationProvider } from "web3uikit";
import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/dist/styles.min.css";
import "../styles/globals.css";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import Head from "next/head";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: "https://api.studio.thegraph.com/query/68690/opencity/version/latest",
});

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Global Head settings */}
      <Head>
        <title>OpenCity</title>
        <meta name="description" content="Proposal Map App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MoralisProvider initializeOnMount={false}>
        <ApolloProvider client={client}>
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
        </ApolloProvider>
      </MoralisProvider>
    </>
  );
}

export default MyApp;
