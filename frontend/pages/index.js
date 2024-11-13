import Head from "next/head";
import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import Map from "../components/Map";
import ProposalsTable from "../components/Proposal/ProposalsTable";
import DelegateComponent from "../components/Delegate";
import { abiGovernanceToken, contractAddressesGovernanceToken } from "../constants";
const supportedChains = ["31337", "11155111"];

export default function Home() {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const [proposals, setProposals] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState({ lat: "", lng: "" });
  const [totalSupply, setTotalSupply] = useState(null);

  const { runContractFunction } = useWeb3Contract();

  useEffect(() => {
    const fetchTotalSupply = async () => {
      if (isWeb3Enabled && chainId) {
        try {
          const governanceTokenAddress = contractAddressesGovernanceToken[chainId]?.[0];
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
        }
      }
    };

    fetchTotalSupply();
  }, [isWeb3Enabled, chainId]);

  const handleProposalSubmit = (proposalData) => {
    setProposals([...proposals, proposalData]);
    console.log("Proposals", proposals);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>OpenCity</title>
        <meta name="description" content="Proposal Map App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <section className={styles.hero}>
        <h1>OpenCity: Decentralized Governance for the World </h1>
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
              <Map onMapClick={setSelectedCoords} />
            </div>
          ) : (
            <div>{`Please switch to a supported chain. Supported Chain Ids: ${supportedChains.join(
              ", "
            )}`}</div>
          )}
        </>
      ) : (
        <div>Please connect to a Wallet</div>
      )}
      <footer className={styles.footer}>© 2024 Open World. All rights reserved.</footer>
    </div>
  );
}
