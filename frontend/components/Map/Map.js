import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/Home.module.css";
import L from "leaflet";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Modal, Button } from "web3uikit";
import { abiGovernor, contractAddressesGovernor } from "../../constants";

const pendingMarkerIcon = new L.Icon({
  iconUrl: "/location.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});
const acceptedMarkerIcon = new L.Icon({
  iconUrl: "/Accepted.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});
const deniedMarkerIcon = new L.Icon({
  iconUrl: "/Denied.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});
const defaultMarkerIcon = new L.Icon({
  iconUrl: "/marker.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

const Map = ({ onMapClick }) => {
  const { isWeb3Enabled, chainId: chainIdHex, account, enableWeb3 } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [defaultMarkerPosition, setDefaultMarkerPosition] = useState({ lat: 51.505, lng: -0.09 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;
  const { runContractFunction } = useWeb3Contract();

  useEffect(() => {
    if (isWeb3Enabled && governorAddress) {
      fetchProposalsMetadata();
    }
  }, [isWeb3Enabled, governorAddress]);

  const fetchProposalsMetadata = async () => {
    try {
      const metadataResponse = await axios.get("http://localhost:5000/proposals");
      const metadata = metadataResponse.data;

      const proposalDetails = await Promise.all(
        metadata.map(async (proposal) => {
          const ipfsResponse = await axios.get(
            `https://gateway.pinata.cloud/ipfs/${proposal.ipfsHash}`
          );
          const stateOptions = {
            abi: abiGovernor,
            contractAddress: governorAddress,
            functionName: "state",
            params: { proposalId: proposal.proposalId },
          };

          let proposalState;
          await runContractFunction({
            params: stateOptions,
            onSuccess: (state) => {
              proposalState = state;
            },
            onError: (error) => console.error("Error fetching proposal state:", error),
          });

          const status = getStatusText(proposalState);
          return { ...proposal, ...ipfsResponse.data, status };
        })
      );

      setMapMarkers(proposalDetails);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case 0:
        return "Pending";
      case 1:
        return "Active";
      case 2:
        return "Canceled";
      case 3:
        return "Defeated";
      case 4:
        return "Succeeded";
      case 5:
        return "Queued";
      case 6:
        return "Expired";
      case 7:
        return "Executed";
      default:
        return "Unknown";
    }
  };

  const getMarkerIcon = (status) => {
    switch (status) {
      case "Pending":
        return pendingMarkerIcon;
      case "Succeeded":
      case "Executed":
        return acceptedMarkerIcon;
      case "Defeated":
      case "Canceled":
        return deniedMarkerIcon;
      default:
        return defaultMarkerIcon;
    }
  };

  const handleNewProposalSubmission = (newProposal) => {
    setMapMarkers((prevMarkers) => [...prevMarkers, { ...newProposal, status: "Pending" }]);
  };

  const handleVoteClick = async (proposalId, proposer) => {
    if (!isWeb3Enabled) {
      await enableWeb3();
    }
    if (account === proposer) {
      alert("You cannot vote on your own proposal.");
      return;
    }
    setIsModalOpen(true);
  };

  const MapClickHandler = () => {
    useMapEvent("click", (e) => {
      const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDefaultMarkerPosition(newCoords);
      onMapClick(newCoords);
    });
    return null;
  };

  return (
    <div>
      <MapContainer className={styles["map-container"]} center={[51.505, -0.09]} zoom={13}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />

        {/* Always display the default marker for new proposal location selection */}
        <Marker
          position={defaultMarkerPosition}
          icon={defaultMarkerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              setDefaultMarkerPosition({ lat: position.lat, lng: position.lng });
              onMapClick({ lat: position.lat, lng: position.lng });
            },
          }}
        >
          <Popup>
            <strong>New Proposal Location</strong>
            <br />
            Drag or click on the map to choose location.
          </Popup>
        </Marker>

        {/* Render all proposal markers from mapMarkers */}
        {mapMarkers.map((marker, idx) => (
          <Marker key={idx} position={marker.coordinates} icon={getMarkerIcon(marker.status)}>
            <Popup>
              <strong>Proposal:</strong> {marker.title}
              <br />
              <strong>Coordinates:</strong> {marker.coordinates.lat.toFixed(4)},{" "}
              {marker.coordinates.lng.toFixed(4)}
              <br />
              {account === marker.proposer ? (
                <p>You cannot vote on your own proposal.</p>
              ) : (
                <div>
                  <button onClick={() => handleVoteClick(marker.proposalId, marker.proposer)}>
                    Vote
                  </button>
                  <Modal
                    isVisible={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onCloseButtonPressed={() => setIsModalOpen(false)}
                    title="Delegate Voting Power"
                  >
                    <p>Delegate voting power to:</p>
                    <Button text="Myself" theme="secondary" />
                    <Button text="Custom Address" theme="secondary" />
                  </Modal>
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;
