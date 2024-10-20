import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import styles from "../../styles/Home.module.css";
import L from "leaflet";
import Link from "next/link";
import { useMoralis } from "react-moralis";
import { useRouter } from "next/router";

// Custom marker icons
const defaultMarkerIcon = new L.Icon({
  iconUrl: "/marker.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

const submittedMarkerIcon = new L.Icon({
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


const Map = ({ markers, onMapClick }) => {
  const [mapMarkers, setMapMarkers] = useState([]);
  const [draggableMarker, setDraggableMarker] = useState({
    position: { lat: 51.505, lng: -0.09 }, // Initial position
    draggable: true,
    icon: defaultMarkerIcon,
  });

  const { isWeb3Enabled, enableWeb3, account } = useMoralis();
  const router = useRouter();  // Use router for navigation

  useEffect(() => {
    if (markers && markers.length) {
      setMapMarkers(markers);
    }
  }, [markers]);

  // Update the draggable marker position and notify parent component
  const handleDragEnd = (event) => {
    const { lat, lng } = event.target.getLatLng();
    setDraggableMarker((prev) => ({ ...prev, position: { lat, lng } }));
    onMapClick({ lat, lng }); // Update form coordinates
  };

  // Ensure Web3 is enabled before voting
  const handleVoteClick = async (proposalId, proposer) => {
    if (!isWeb3Enabled) {
      await enableWeb3();
    }

    // Prevent the proposer from voting
    if (account === proposer) {
      alert("You cannot vote on your own proposal.");
      return;
    }

    // Navigate to the vote page with proposalId using router
    router.push(`/vote?proposalId=${proposalId}`);
  };

  return (
    <div>
      <MapContainer className={styles["map-container"]} center={draggableMarker.position} zoom={13}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Draggable initial marker */}
        <Marker
          position={draggableMarker.position}
          draggable={draggableMarker.draggable}
          eventHandlers={{ dragend: handleDragEnd }}
          icon={draggableMarker.icon}
        >
          <Popup>
            Coordinates: {draggableMarker.position.lat.toFixed(4)}, {draggableMarker.position.lng.toFixed(4)}
          </Popup>
        </Marker>

        {/* Display submitted markers */}
        {mapMarkers.map((marker, idx) => (
          <Marker key={idx} position={marker.coordinates} icon={submittedMarkerIcon}>
            <Popup>
              <strong>Proposal:</strong> {marker.title}
              <br />
              <strong>Coordinates:</strong> {marker.coordinates.lat.toFixed(4)}, {marker.coordinates.lng.toFixed(4)}
              <br />

              {/* Only show vote button if the current user is not the proposer */}
              {account === marker.proposer ? (
                <p>You cannot vote on your own proposal.</p>
              ) : (
                <button onClick={() => handleVoteClick(marker.proposalId, marker.proposer)}>
                  Vote
                </button>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;
