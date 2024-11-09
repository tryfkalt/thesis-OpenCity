import { useState } from "react";
import { useMoralis } from "react-moralis";
import ProposalForm from "../../components/Proposal/CreateProposal";
import Map from "../../components/Map";
import Header from "../../components/Header";
import styles from "../../styles/Home.module.css";

const supportedChains = ["31337", "11155111"];

const CreateProposalPage = () => {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const { isWeb3Enabled, chainId } = useMoralis();
  const [proposals, setProposals] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState({ lat: "", lng: "" });
  const handleMapClick = (newCoordinates) => {
    setCoordinates(newCoordinates);
  };
  const handleProposalSubmit = (proposalData) => {
    setProposals([...proposals, proposalData]);
    console.log("Proposals", proposals);
  };
  return (
    <div className={styles.container}>
      <Header />
      {isWeb3Enabled ? (
        <div>
          {supportedChains.includes(parseInt(chainId).toString()) ? (
            <div className="flex flex-row">
              <ProposalForm onProposalSubmit={handleProposalSubmit} coordinates={selectedCoords} />
              <Map markers={proposals} onMapClick={setSelectedCoords} />
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
    </div>
  );
};
export default CreateProposalPage;
