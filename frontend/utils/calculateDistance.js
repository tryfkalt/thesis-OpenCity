const calculateDistance = (location1, location2) => {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRadians(location2.lat - location1.lat);
    const dLon = toRadians(location2.lng - location1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(location1.lat)) * Math.cos(toRadians(location2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
  
    return distance;
  };

export default calculateDistance;