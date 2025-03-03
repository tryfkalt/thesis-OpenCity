import Head from "next/head";
import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import { useState, useEffect, use } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useDispatch, useSelector } from "react-redux";
import { setUserLocation } from "../store/userLocationSlice";
import Map from "../components/Map";
import ProposalsTable from "../components/Proposal/ProposalsTable";
import DelegateComponent from "../components/Delegate";
import Spinner from "../components/Spinner/Spinner";
import { abiGovernanceToken, contractAddressesGovernanceToken } from "../constants";
const supportedChains = ["31337", "11155111"];

export default function Home() {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  // const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [selectedCoords, setSelectedCoords] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);
  const [totalSupply, setTotalSupply] = useState(null);

  const { runContractFunction } = useWeb3Contract();

  const dispatch = useDispatch();
  const userLocation = useSelector((state) => state.userLocation); // Access the global state

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          dispatch(
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          );
        },
        (error) => {
          console.error("Error fetching location: ", error);
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [dispatch]);

  useEffect(() => {
    const fetchTotalSupply = async () => {
      if (isWeb3Enabled && chainId) {
        setLoading(true);
        try {
          const governanceTokenAddress = contractAddressesGovernanceToken[chainId]?.[0];
          if (!governanceTokenAddress) {
            console.error("Governance token address not found for this chain.");
            return;
          }
          const totalSupplyOptions = {
            abi: abiGovernanceToken,
            contractAddress: governanceTokenAddress,
            functionName: "totalSupply",
            params: {},
          };
          const totalSupply = await runContractFunction({ params: totalSupplyOptions });
          setTotalSupply(parseInt(totalSupply.toString()));
        } catch (error) {
          console.error("Error fetching total supply:", error);
        } finally {
          setLoading(false); // Always stop loading.
        }
      } else {
        setLoading(false); // Ensure `setLoading` is called even when conditions are not met.
      }
    };

    fetchTotalSupply();
  }, [isWeb3Enabled, chainId]);

  return (
    <div className={styles.container}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Head>
            <title>OpenCity</title>
            <meta name="description" content="Proposal Map App" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Header />
          <div className={styles.contentWrapper}>
            {/* Info Box */}
            <aside className={styles.infoBox}>
              <h2>How to Use OpenCity</h2>
              <ol>
                <li className={!isWeb3Enabled ? styles.activeStep : ""}>
                  Connect your wallet to begin.
                </li>
                <li className={isWeb3Enabled && !selectedCoords ? styles.activeStep : ""}>
                  Select a location on the map to make a proposal.
                </li>
                <li>Vote on proposals to shape the future.</li>
              </ol>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
              <section className={styles.hero}>
                <h1>OpenCity: Decentralized Governance for the World</h1>
                <p>Explore, propose, and vote on changes to the world.</p>
              </section>
              {isWeb3Enabled ? (
                <>
                  <div className={styles.totalSupplyBox}>
                    <h2>Total Supply</h2>
                    {totalSupply !== null ? (
                      <p>{totalSupply.toLocaleString()} Tokens</p>
                    ) : (
                      <p>Loading...</p>
                    )}
                  </div>

                  <DelegateComponent />
                  {supportedChains.includes(parseInt(chainId).toString()) ? (
                    <div className={styles.proposalsMapContainer}>
                      <ProposalsTable />
                      <Map userLocation={userLocation} onMapClick={setSelectedCoords} />
                    </div>
                  ) : (
                    <div>
                      {`Please switch to a supported chain. Supported Chain Ids: ${supportedChains.join(
                        ", "
                      )}`}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.walletConnectMessage}>Please connect to a Wallet to interact with OpenCity features.</div>
              )}
            </main>
          </div>
          <footer className={styles.footer}>© 2024 OpenCity. All rights reserved.</footer>
        </>
      )}
    </div>
  );
}
