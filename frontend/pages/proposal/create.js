import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import ProposalForm from "../../components/Proposal/CreateProposal";
import Map from "../../components/Map";
import Header from "../../components/Header";
import styles from "../../styles/CreateProposalPage.module.css";
import { useRouter } from "next/router";

const supportedChains = ["31337", "11155111"];

const CreateProposalPage = () => {
  const router = useRouter();
  const { lat, lng } = router.query;
  const { isWeb3Enabled, chainId } = useMoralis();
  const [proposals, setProposals] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState({ lat: lat ?? 51.505, lng: lng ?? -0.09 });
  const [isStatic, setIsStatic] = useState(true); // Start with true

  // Set isStatic to false after the initial render
  useEffect(() => {
    if (isStatic) {
      setIsStatic(false);
    }
  }, []);

  const handleProposalSubmit = (proposalData) => {
    setProposals([...proposals, proposalData]);
  };

  return (
    <div className={styles.container}>
      <Header />
      {isWeb3Enabled ? (
        <div>
          {supportedChains.includes(parseInt(chainId).toString()) ? (
            <div className={styles.content}>
              <div className={styles.proposalForm}>
                <ProposalForm
                  onProposalSubmit={handleProposalSubmit}
                  coordinates={selectedCoords}
                />
              </div>
              <div className={styles.map}>
                {isStatic ? (
                  <Map
                    markers={proposals}
                    onMapClick={setSelectedCoords}
                    createCoords={{ lat: lat ?? 51.505, lng: lng ?? -0.09 }}
                    staticMarker={isStatic}
                  />
                ) : (
                  <Map markers={proposals} onMapClick={setSelectedCoords} staticMarker={isStatic} />
                )}
              </div>
            </div>
          ) : (
            <div>{`Please switch to a supported chain. Supported Chain Ids: ${supportedChains.join(
              ", "
            )}`}</div>
          )}
        </div>
      ) : (
        <div>Please connect to a Wallet</div>
      )}
      <footer className={styles.footer}>© 2024 Open World. All rights reserved.</footer>
    </div>
  );
};

export default CreateProposalPage;
