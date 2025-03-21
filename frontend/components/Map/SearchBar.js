import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";
import "leaflet/dist/leaflet.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const SearchBar = ({ onSearchResult }) => {
  const map = useMap();
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const geocoderContainerRef = useRef(null);

  useEffect(() => {
    if (!map || !geocoderContainerRef.current) return;

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxAccessToken,
      marker: false,
      mapboxgl: mapboxgl,
    });

    // Update map view and add a marker when search result is found
    geocoder.on("result", (e) => {
      const { center, place_name } = e.result;
      map.setView([center[1], center[0]], 13);

      onSearchResult({ lat: center[1], lng: center[0], place_name });
    });

    geocoderContainerRef.current.appendChild(geocoder.onAdd(map));

    return () => {
      geocoder.onRemove(map);
    };
  }, [map, mapboxAccessToken, onSearchResult]);

  return (
    <div
      ref={geocoderContainerRef}
      style={{
        position: "absolute",
        top: "20px",
        right: "10px", // Aligns the search bar to the right side of the map
        zIndex: 3000,
        width: "300px", // Set a fixed width to avoid shifting elements
      }}
    ></div>
  );
};

export default SearchBar;
