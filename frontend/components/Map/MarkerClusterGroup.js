// components/MarkerClusterGroup.js
import { useEffect } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { useMap, Marker, Popup } from "react-leaflet";

const MarkerClusterGroup = ({ children, iconCreateFunction }) => {
  const map = useMap();

  useEffect(() => {
    const markers = L.markerClusterGroup({
      iconCreateFunction,
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [map, iconCreateFunction]);

  return <>{children && children}</>;
};

export default MarkerClusterGroup;
