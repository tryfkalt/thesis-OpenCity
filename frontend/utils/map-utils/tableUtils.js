import L from "leaflet";

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

export {
  getStatusText,
  getMarkerIcon,
  defaultMarkerIcon,
};
