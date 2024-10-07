import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import styles from "../../styles/Home.module.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "/marker.png",
  iconSize: [100, 100],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const Map = ({ markers, onMapClick }) => {
  const [mapMarkers, setMapMarkers] = useState(markers || []);
  // const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setMapMarkers(markers); // Sync markers with props
  }, [markers]);
  // useEffect(() => {
  //   // Set isClient to true when the component is mounted
  //   setIsClient(true);
  // }, []);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        onMapClick(e.latlng);
      },
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
        {/* {mapMarkers.map((marker, idx) => (
          <Marker key={idx} position={marker} icon={markerIcon}>
            <Popup>
              Coordinates: {marker.lat}, {marker.lng}
            </Popup>
          </Marker>
        ))} */}
        <MapClickHandler />
      </MapContainer>
    </div>
  );
};

export default Map;