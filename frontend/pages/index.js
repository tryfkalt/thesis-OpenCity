import Head from "next/head";
import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import { useMoralis } from "react-moralis";
import Map from "../components/Map";
import Proposal from "../components/CreateProposal";
import { useState } from "react";

const supportedChains = ["31337", "11155111"];

export default function Home() {
  const { isWeb3Enabled, chainId } = useMoralis();
  const [proposals, setProposals] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const handleProposalSubmit = (proposalData) => {
    setProposals([...proposals, proposalData]);
  };

  const handleMapClick = (coords) => {
    setSelectedCoords(coords);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Open World</title>
        <meta name="description"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {isWeb3Enabled ? (
        <div>
          {supportedChains.includes(parseInt(chainId).toString()) ? (
            <div className="flex flex-row"></div>
          ) : (
            <div>{`Please switch to a supported chainId. The supported Chain Ids are: ${supportedChains}`}</div>
          )}
        </div>
      ) : (
        <div>Please connect to a Wallet</div>
      )}

      <div>
        <Proposal onProposalSubmit={handleProposalSubmit} />
        <Map onMapClick={handleMapClick} />
      </div>
    </div>
  );
}
