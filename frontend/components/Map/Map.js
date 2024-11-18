import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from "react-leaflet";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "../../styles/Home.module.css";
// import "../../styles/Cluster.module.css";
import L, { divIcon, point } from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Modal, Button } from "web3uikit";
import { abiGovernor, contractAddressesGovernor } from "../../constants";
import VoteDetails from "../Vote/VoteDetails";
import SearchBar from "./SearchBar";
import VoteForm from "../Vote/VoteForm";
import { useRouter } from "next/router";
import { useQuery, gql } from "@apollo/client";
import { GET_PROPOSALS } from "../../constants/subgraphQueries";

const pendingMarkerIcon = new L.Icon({
  iconUrl: "/Pending.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});
const activeMarkerIcon = new L.Icon({
  iconUrl: "/Active.png",
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
  iconUrl: "/Default.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

const Map = ({ onMapClick, proposalStatus, createCoords, staticMarker, idCoords }) => {
  const router = useRouter();
  const { isWeb3Enabled, chainId: chainIdHex, account, enableWeb3 } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [defaultMarkerPosition, setDefaultMarkerPosition] = useState(
    createCoords || { lat: 51.505, lng: -0.09 }
  );
  const [defaultMarkerPopupContent, setDefaultMarkerPopupContent] =
    useState("New Proposal Location");
  console.log("IDCOORDS", idCoords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const voteProposalRef = useRef(null);

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const { runContractFunction } = useWeb3Contract();

  const { loading, error, data: proposalsFromGraph } = useQuery(GET_PROPOSALS);

  useEffect(() => {
    if (createCoords) {
      setDefaultMarkerPosition(createCoords);
    }
  }, [createCoords]);

  useEffect(() => {
    if (isWeb3Enabled && governorAddress) {
      fetchProposalsFromGraph();
    }
  }, [isWeb3Enabled, governorAddress]);

  const fetchProposalsFromGraph = async () => {
    try {
      if (!proposalsFromGraph) return; // Wait for data to be available
      console.log("ProposalsGraph:", proposalsFromGraph);
      const extractIpfsHash = (description) => {
        const parts = description.split("#");
        return parts.length > 1 ? parts[1] : null;
      };

      const proposalDetails = await Promise.all(
        proposalsFromGraph.proposalCreateds.map(async (proposal) => {
          const ipfsHash = extractIpfsHash(proposal.description);
          console.log("IPFS Hash:", ipfsHash);
          if (!ipfsHash) {
            console.warn(`No IPFS hash found in description: ${proposal.description}`);
            return null;
          }

          try {
            const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
            console.log("IPFS Response:", ipfsResponse.data);
            const stateOptions = {
              abi: abiGovernor,
              contractAddress: governorAddress,
              functionName: "state",
              params: { proposalId: proposal.proposalId },
            };

            let proposalState;
            await runContractFunction({
              params: stateOptions,
              onSuccess: (state) => (proposalState = state),
              onError: (error) => console.error("Error fetching proposal state:", error),
            });

            const status = getStatusText(proposalState);

            return {
              ...proposal,
              ...ipfsResponse.data,
              status,
            };
          } catch (error) {
            console.error(`Error processing proposal ${proposal.proposalId}:`, error);
            return null; // Handle individual proposal fetch failure gracefully
          }
        })
      );
      setMapMarkers(proposalDetails);
    } catch (error) {
      console.error("Error processing proposals from The Graph:", error);
    }
  };
  // const fetchProposalsMetadata = async () => {
  //   try {
  //     const metadataResponse = await axios.get("http://localhost:5000/proposals");
  //     const metadata = metadataResponse.data;

  //     const proposalDetails = await Promise.all(
  //       metadata.map(async (proposal) => {
  //         const ipfsResponse = await axios.get(
  //           `https://gateway.pinata.cloud/ipfs/${proposal.ipfsHash}`
  //         );
  //         const stateOptions = {
  //           abi: abiGovernor,
  //           contractAddress: governorAddress,
  //           functionName: "state",
  //           params: { proposalId: proposal.proposalId },
  //         };

  //         let proposalState;
  //         await runContractFunction({
  //           params: stateOptions,
  //           onSuccess: (state) => {
  //             proposalState = state;
  //           },
  //           onError: (error) => console.error("Error fetching proposal state:", error),
  //         });

  //         const status = getStatusText(proposalState);
  //         return { ...proposal, ...ipfsResponse.data, status };
  //       })
  //     );

  //     setMapMarkers(proposalDetails);
  //   } catch (error) {
  //     console.error("Error fetching proposals:", error);
  //   }
  // };

  const fetchProposalDetails = async (proposalId) => {
    try {
      const response = await axios.get(`http://localhost:5000/proposals/${proposalId}`);
      setSelectedProposal(response.data); // Store the fetched proposal details in selectedProposal
    } catch (error) {
      console.error("Error fetching proposal details:", error);
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
      case "Active":
        return activeMarkerIcon;
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

  const handleProposalCreate = () => {
    router.push({
      pathname: "/proposal/create",
      query: {
        lat: defaultMarkerPosition.lat,
        lng: defaultMarkerPosition.lng,
      },
    });
  };
  const handleVoteClick = async (proposal) => {
    // if (!isWeb3Enabled) {
    //   await enableWeb3();
    // }
    if (account === proposal.proposer) {
      alert("You cannot vote on your own proposal.");
      return;
    }
    await fetchProposalDetails(proposal.proposalId); // Fetch details for the clicked proposal
    setIsModalOpen(true);
  };

  const handleSearchResult = ({ lat, lng, place_name }) => {
    setDefaultMarkerPosition({ lat, lng });
    setDefaultMarkerPopupContent(place_name);
  };

  const handleVoteSubmit = async () => {
    if (voteProposalRef.current) {
      console.log("Vote before submission:", voteProposalRef.current);
      await voteProposalRef.current(); // Calls voteProposal in VoteForm
    }
    setIsModalOpen(false);
  };

  const MapClickHandler = () => {
    useMapEvent("click", (e) => {
      // Check if the click originated from the search bar or its children
      const clickedElement = e.originalEvent.target;
      const isClickInsideSearchBar = clickedElement.closest(".mapboxgl-ctrl-geocoder") !== null;
      // Only update marker position if click is outside the search bar
      if (!isClickInsideSearchBar) {
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setDefaultMarkerPosition(newCoords);
        onMapClick(newCoords);
      }
    });
    return null;
  };

  return (
    <div>
      <MapContainer
        className={styles["map-container"]}
        center={createCoords || idCoords || [51.505, -0.09]}
        zoom={13}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        <SearchBar onSearchResult={handleSearchResult} />
        <MarkerClusterGroup showCoverageOnHover={false}>
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
            {!staticMarker && (
              <Popup>
                <strong style={{ color: "Green", margin: "auto" }}>New Proposal Location</strong>
                <br />
                Drag or click on the map to choose location.
                <Button
                  id="popUpNew"
                  text="+ New Proposal"
                  size="small"
                  theme="colored"
                  color="green"
                  style={{ margin: "auto", marginTop: "15px" }}
                  onClick={handleProposalCreate}
                />
              </Popup>
            )}

            {staticMarker && (
              <Popup open>
                <strong>Hello</strong>
              </Popup>
            )}
          </Marker>

          {mapMarkers.map((marker, idx) => (
            <Marker key={idx} position={marker.coordinates} icon={getMarkerIcon(marker.status)}>
              <Popup>
                <strong>Proposal:</strong> {marker.title}
                <br />
                <strong>Coordinates:</strong> {marker.coordinates.lat.toFixed(4)},{" "}
                {marker.coordinates.lng.toFixed(4)}
                <br />
                <br />
                {marker.status === "Pending" ? (
                  <p>Proposal vote hasn't started yet.</p>
                ) : marker.status === "Queued" ? (
                  <p>Proposal is pending execution.</p>
                ) : marker.status === "Defeated" ? (
                  <p>Proposal not successful.</p>
                ) : marker.status === "Succeeded" ? (
                  <p>Proposal successful, waiting to queue.</p>
                ) : marker.status === "Executed" ? (
                  <p>Proposal executed.</p>
                ) : account === marker.proposer ? (
                  <p>You cannot vote on your own proposal.</p>
                ) : (
                  proposalStatus == "Active" && (
                    <Button
                      onClick={() => handleVoteClick(marker)}
                      text="Vote Here"
                      theme="primary"
                      size="medium"
                      style={{ margin: "auto" }}
                    />
                  )
                )}
                <a
                  href={`/proposal/${marker.proposalId}`}
                  style={{ display: "block", textAlign: "center", marginTop: "10px" }}
                  // target="_blank"
                  // rel="noopener noreferrer"
                >
                  View Details
                </a>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <Modal
        isVisible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onCloseButtonPressed={() => setIsModalOpen(false)}
        title="Vote On Proposal"
        okText="Submit"
        onOk={handleVoteSubmit}
        style={{
          // display: "flex",
          // flexDirection: "column",

          width: "470px", // Set modal width
          maxWidth: "90vw", // Ensure responsiveness
          padding: "730px", // Internal spacing
          borderRadius: "12px", // Rounded corners
          margin: "auto", // Center modal
          // backgroundColor: "#fff", // Background color
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          fontFamily: "Montserrat, sans-serif",
          zIndex: "1000",
        }}
      >
        {selectedProposal && (
          <>
            <VoteDetails proposalDetails={selectedProposal} />
            <VoteForm
              proposalDetails={selectedProposal}
              onVoteSubmit={(voteProposal) => {
                voteProposalRef.current = voteProposal;
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Map;
