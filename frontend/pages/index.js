import Head from "next/head";
import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import { useState } from "react";
import { useMoralis } from "react-moralis";
import Map from "../components/Map";
import ProposalsTable from "../components/Proposal/ProposalsTable";
import DelegateComponent from "../components/Delegate";

const supportedChains = ["31337", "11155111"];

export default function Home() {
  const { isWeb3Enabled, chainId } = useMoralis();
  const [proposals, setProposals] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState({ lat: "", lng: "" });

  const handleProposalSubmit = (proposalData) => {
    setProposals([...proposals, proposalData]);
    console.log("Proposals", proposals);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Open World</title>
        <meta name="description" content="Proposal Map App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <section className={styles.hero}>
        <h1>Open World: Decentralized Governance for the World </h1>
        <p>Explore, propose, and vote on changes to the world.</p>
      </section>

      {isWeb3Enabled ? (
        <>
          <DelegateComponent />
          {supportedChains.includes(parseInt(chainId).toString()) ? (
            <div className="flex flex-row">
              <ProposalsTable />
              <Map /*markers={proposals} */ onMapClick={setSelectedCoords} />
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
