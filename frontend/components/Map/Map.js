import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import styles from "../../styles/Home.module.css";
import L from "leaflet";

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "/marker.png",
  iconSize: [50, 50], // Adjust icon size
  iconAnchor: [25, 50], // Adjust anchor to point tip at the location
  popupAnchor: [0, -50],
});

const Map = ({ markers, onMapClick }) => {
  const [mapMarkers, setMapMarkers] = useState(markers || []);
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");

  useEffect(() => {
    setMapMarkers(markers); // Sync markers with props
  }, [markers]);

  const updateMarkerPosition = (newPosition) => {
    setMapMarkers([newPosition]);
    setInputLat(newPosition.lat);
    setInputLng(newPosition.lng);
  };

  // Handle map click to add marker
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        onMapClick(e.latlng);
        updateMarkerPosition(e.latlng);
      },
    });
    return null;
  };

  // Handle manual coordinates submission
  const handleAddMarker = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newMarker = { lat, lng };
      updateMarkerPosition(newMarker);
    } else {
      alert("Please enter valid latitude and longitude values.");
    }
  };

  return (
    <div>
      {/* Input fields for Latitude and Longitude */}
      <div className={styles["input-container"]}>
        <label>
          Latitude:
          <input
            type="text"
            value={inputLat}
            onChange={(e) => setInputLat(e.target.value)}
            placeholder="Enter latitude"
          />
        </label>
        <label style={{ marginLeft: "10px" }}>
          Longitude:
          <input
            type="text"
            value={inputLng}
            onChange={(e) => setInputLng(e.target.value)}
            placeholder="Enter longitude"
          />
        </label>
        <button onClick={handleAddMarker} style={{ marginLeft: "10px" }}>
          Add Marker
        </button>
      </div>

      {/* Map with markers */}
      <MapContainer className={styles["map-container"]} center={[51.505, -0.09]} zoom={13}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {mapMarkers.map((marker, idx) => (
          <Marker key={idx} position={marker} icon={markerIcon}>
            <Popup>
              Coordinates: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
            </Popup>
          </Marker>
        ))}
        <MapClickHandler />
      </MapContainer>
    </div>
  );
};

export default Map;
