import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
  Polyline,
  Circle,
} from "react-leaflet";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "../../styles/Home.module.css";
import L, { divIcon, point } from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useMoralis, useWeb3Contract } from "react-moralis";
import calculateDistance from "../../utils/calculateDistance";
import { Modal, Button } from "web3uikit";
import { abiGovernor, contractAddressesGovernor } from "../../constants";
import range from "../../constants/variables";
import VoteDetails from "../Vote/VoteDetails";
import SearchBar from "./SearchBar";
import VoteForm from "../Vote/VoteForm";
import Spinner from "../Spinner/Spinner";
import { useRouter } from "next/router";
import { useQuery, useLazyQuery } from "@apollo/client";
import { GET_PROPOSALS, GET_PROPOSAL_BY_ID } from "../../constants/subgraphQueries";

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

const Map = ({
  userLocation,
  onMapClick,
  proposalStatus,
  createCoords,
  staticMarker,
  idCoords,
}) => {
  const router = useRouter();
  const { isWeb3Enabled, chainId: chainIdHex, account, enableWeb3 } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const { runContractFunction } = useWeb3Contract();
  const voteProposalRef = useRef(null);

  // State Variables
  const [mapMarkers, setMapMarkers] = useState([]);
  const [defaultMarkerPosition, setDefaultMarkerPosition] = useState(
    createCoords || userLocation || { lat: 51.505, lng: -0.09 }
  );
  const [useUserLocation, setUseUserLocation] = useState(userLocation ? true : false);
  const [defaultMarkerPopupContent, setDefaultMarkerPopupContent] =
    useState("New Proposal Location");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Contract Address
  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  // GraphQL Queries
  const { error, data: proposalsFromGraph } = useQuery(GET_PROPOSALS);
  const [getProposalFromGraph, { data: proposalFromGraph }] = useLazyQuery(GET_PROPOSAL_BY_ID);

  // Hooks
  useEffect(() => {
    if (createCoords) {
      console.log("HELP");
      setDefaultMarkerPosition(createCoords);
    }
  }, [createCoords]);

  if (chainId == 31337) {
    useEffect(() => {
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
              const distance =
                userLocation && calculateDistance(userLocation, ipfsResponse.data.coordinates);
              const isInRange = distance && distance <= range; // 10 km range
              return { ...proposal, ...ipfsResponse.data, status, distance, isInRange };
            })
          );

          setMapMarkers(proposalDetails);
        } catch (error) {
          console.error("Error fetching proposals:", error);
        }
      };
      if (isWeb3Enabled && governorAddress) {
        fetchProposalsMetadata();
      }
    }, [isWeb3Enabled, governorAddress]);
  } else {
    useEffect(() => {
      const fetchProposalsFromGraph = async () => {
        try {
          if (!proposalsFromGraph) return;
          const extractIpfsHash = (description) => {
            const parts = description.split("#");
            return parts.length > 1 ? parts[1] : null;
          };

          const proposalDetails = await Promise.all(
            proposalsFromGraph.proposalCreateds.map(async (proposal) => {
              const ipfsHash = proposal?.ipfsHash || extractIpfsHash(proposal.description);
              if (!ipfsHash) {
                console.warn(`No IPFS hash found in description: ${proposal.description}`);
                return null;
              }

              try {
                const ipfsResponse = await axios.get(
                  `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
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
                  onSuccess: (state) => (proposalState = state),
                  onError: (error) => console.error("Error fetching proposal state:", error),
                });

                const status = getStatusText(proposalState);
                const distance =
                  userLocation && calculateDistance(userLocation, ipfsResponse.data.coordinates);
                console.log("distance", distance);
                const isInRange = distance && distance <= range;

                return { ...proposal, ...ipfsResponse.data, status, distance, isInRange };
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
      if (isWeb3Enabled && governorAddress) {
        fetchProposalsFromGraph();
      }
    }, [isWeb3Enabled, governorAddress, proposalsFromGraph]);
  }
  // Helper Functions
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

  const fetchProposalDetails = async (proposalId) => {
    try {
      const response = await axios.get(`http://localhost:5000/proposals/${proposalId}`);
      setSelectedProposal(response.data);
    } catch (error) {
      console.error("Error fetching proposal details:", error);
    }
  };

  const fetchProposalDetailsFromGraph = async (proposal) => {
    try {
      const ipfsHash = proposal.description.split("#")[1];
      const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      setSelectedProposal({ ...proposal, ...ipfsResponse.data });
    } catch (error) {
      console.error("Error fetching proposal details from The Graph:", error);
    }
  };

  // Event Handlers
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
    if (!isWeb3Enabled) {
      await enableWeb3();
    }
    if (account === proposal.proposer) {
      alert("You cannot vote on your own proposal.");
      return;
    }
    if (chainId == 31337) {
      await fetchProposalDetails(proposal.proposalId);
    } else {
      getProposalFromGraph({ variables: { proposalId: proposal.proposalId } });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (proposalFromGraph && proposalFromGraph.proposalCreateds.length > 0) {
      const fetchedProposal = proposalFromGraph.proposalCreateds[0]; // Assuming there's always at least one result
      fetchProposalDetailsFromGraph(fetchedProposal);
      setIsModalOpen(true);
    }
  }, [proposalFromGraph]);

  const handleSearchResult = ({ lat, lng, place_name }) => {
    setDefaultMarkerPosition({ lat, lng });
    setDefaultMarkerPopupContent(place_name);
  };

  const handleVoteSubmit = async () => {
    if (voteProposalRef.current) {
      setLoading(true);
      await voteProposalRef.current(); // Calls voteProposal in VoteForm
      setLoading(false);
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
        setUseUserLocation(false);
        onMapClick(newCoords);
      }
    });
    return null;
  };
  const dottedLineCoords =
    userLocation && idCoords ? [userLocation, [idCoords.lat, idCoords.lng]] : null;

  return (
    <div>
      <MapContainer
        className={styles["map-container"]}
        center={
          idCoords
            ? idCoords
            : createCoords
            ? createCoords
            : useUserLocation && userLocation.lat !== null && userLocation.lng !== null
            ? userLocation
            : [51.505, -0.09]
        }
        zoom={13}
        whenReady={() => console.log("Map is ready")}
        onClick={(e) => {
          if (!staticMarker) {
            const coords = e.latlng;
            setDefaultMarkerPosition(coords);
            onMapClick(coords);
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {userLocation && userLocation.lat !== null && userLocation.lng !== null && (
          <Marker
            position={userLocation || [51.505, -0.09]}
            icon={L.divIcon({
              className: styles["current-location-container"],
              html: `
              <div class="${styles["outer-circle"]}"></div>
              <div class="${styles["inner-circle"]}"></div>
               `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          ></Marker>
        )}

        <SearchBar onSearchResult={handleSearchResult} />
        {userLocation && (
          <Circle
            center={userLocation}
            radius={range * 1000} // range in meters
            pathOptions={{ color: "blue", fillColor: "lightblue", fillOpacity: 0.2 }}
          />
        )}
        <MarkerClusterGroup showCoverageOnHover={false}>
          <Marker
            position={createCoords ? createCoords : defaultMarkerPosition}
            icon={defaultMarkerIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                console.log(staticMarker);
                setDefaultMarkerPosition({ lat: position.lat, lng: position.lng });
                setUseUserLocation(false);
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
            <Marker key={idx} position={marker?.coordinates} icon={getMarkerIcon(marker?.status)}>
              <Popup>
                <strong>Proposal:</strong> {marker?.title}
                <br />
                <strong>Coordinates:</strong> {marker?.coordinates.lat.toFixed(4)},{" "}
                {marker?.coordinates.lng.toFixed(4)}
                <br />
                <strong>Distance from you:</strong>{" "}
                {marker.distance ? `${marker.distance.toFixed(2)} km` : "Unknown"}
                {marker.isInRange ? (
                  <p style={{ color: "green", marginTop: "12px" }}>In range to vote</p>
                ) : (
                  <p style={{ color: "red", marginTop: "12px"}}>Outside range to vote</p>
                )}
                {marker?.status === "Pending" ? (
                  <p>Proposal vote hasn't started yet.</p>
                ) : marker?.status === "Queued" ? (
                  <p>Proposal is pending execution.</p>
                ) : marker?.status === "Defeated" ? (
                  <p>Proposal not successful.</p>
                ) : marker?.status === "Succeeded" ? (
                  <p>Proposal successful, waiting to queue.</p>
                ) : marker?.status === "Executed" ? (
                  <p>Proposal executed.</p>
                ) : account === marker?.proposer ? (
                  <p>You cannot vote on your own proposal.</p>
                ) : (
                  proposalStatus == "Active" && (
                    <div>
                      <Button
                        onClick={() => handleVoteClick(marker)}
                        text="Vote Here"
                        theme="primary"
                        size="medium"
                        style={{ margin: "auto" }}
                        disabled={!marker.isInRange}
                      />
                    </div>
                  )
                )}
                <a
                  href={`/proposal/${marker?.proposalId}`}
                  style={{ display: "block", textAlign: "center", marginTop: "10px" }}
                  // target="_blank"
                  // rel="noopener noreferrer"
                >
                  View Details
                </a>
              </Popup>
            </Marker>
          ))}

          {dottedLineCoords && (
            <Polyline
              positions={dottedLineCoords}
              pathOptions={{
                color: "blue",
                dashArray: "5, 10",
                weight: 2,
              }}
            />
          )}
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
          width: "470px",
          maxWidth: "90vw",
          padding: "730px",
          borderRadius: "12px",
          margin: "auto",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          fontFamily: "Montserrat, sans-serif",
          zIndex: "1000",
        }}
      >
        {loading ? ( // Show spinner during loading
          <div className="spinnerContainer">
            <Spinner />
            <p>Submitting your vote, please wait...</p>
          </div>
        ) : (
          selectedProposal && (
            <>
              <VoteDetails proposalDetails={selectedProposal} />
              <VoteForm
                proposalDetails={selectedProposal}
                onVoteSubmit={(voteProposal) => {
                  voteProposalRef.current = voteProposal;
                }}
                setLoading={setLoading} // Pass setLoading to VoteForm
              />
            </>
          )
        )}
      </Modal>
    </div>
  );
};

export default Map;
