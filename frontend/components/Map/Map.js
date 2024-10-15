import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import styles from "../../styles/Home.module.css";
import L from "leaflet";

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

const Map = ({ markers, onMapClick }) => {
  const [mapMarkers, setMapMarkers] = useState([]);
  const [draggableMarker, setDraggableMarker] = useState({
    position: { lat: 51.505, lng: -0.09 }, // Initial position
    draggable: true,
    icon: defaultMarkerIcon,
  });

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
              Proposal: {marker.title}
              <br />
              Coordinates: {marker.coordinates.lat.toFixed(4)}, {marker.coordinates.lng.toFixed(4)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;