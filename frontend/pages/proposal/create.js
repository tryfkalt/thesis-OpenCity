import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { useDispatch, useSelector } from "react-redux";
import { setUserLocation } from "../../store/userLocationSlice";
import ProposalForm from "../../components/Proposal/CreateProposal";
import ProposalSlider from "../../components/Proposal/Slider";
import Map from "../../components/Map";
import Header from "../../components/Header";
import Spinner from "../../components/Spinner/Spinner";
import styles from "../../styles/CreateProposalPage.module.css";
import { useRouter } from "next/router";

const supportedChains = ["31337", "11155111"];

const CreateProposalPage = () => {
  const router = useRouter();
  const { lat, lng } = router.query;
  const { isWeb3Enabled, chainId } = useMoralis();
  const [proposals, setProposals] = useState([]);

  const dispatch = useDispatch();
  const userLocation = useSelector((state) => state.userLocation); // Access the global state
  // const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [selectedCoords, setSelectedCoords] = useState({
    lat: lat || userLocation.lat,
    lng: lng || userLocation.lng,
  });
  const [radius, setRadius] = useState(50); // Default radius

  const [isStatic, setIsStatic] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          dispatch(
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          );
        },
        (error) => {
          console.error("Error fetching location: ", error);
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [dispatch]);

  // Set isStatic to false after the initial render
  useEffect(() => {
    const timer = setTimeout(() => setIsStatic(false), 500); // Ensure one render with isStatic=true
    setTimeout(() => setLoading(false), 500);

    return () => clearTimeout(timer);
  }, []);

  const handleProposalSubmit = (proposalData) => {
    setProposals([...proposals, proposalData]);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Header />

          <div className={styles.loaderOverlay}>
            <div className={styles.loader}></div>
          </div>

          {isWeb3Enabled ? (
            <div>
              {supportedChains.includes(parseInt(chainId).toString()) ? (
                <div className={styles.content}>
                  <div className={styles.proposalForm}>
                    <ProposalForm
                      onProposalSubmit={handleProposalSubmit}
                      coordinates={selectedCoords ?? userLocation}
                      userLocation={userLocation}
                      range={radius}     
                    />
                    <ProposalSlider onRadiusChange={handleRadiusChange} />
                  </div>

                  <div className={styles.map}>
                    {isStatic ? (
                      <Map
                        userLocation={userLocation}
                        markers={proposals}
                        onMapClick={setSelectedCoords}
                        createCoords={
                          lat && lng
                            ? { lat, lng }
                            : userLocation.lat && userLocation.lng
                            ? userLocation
                            : { lat: 51.505, lng: -0.09 }
                        }
                        staticMarker={isStatic}
                        range={radius || 50}
                      />
                    ) : (
                      <Map
                        userLocation={userLocation}
                        markers={proposals}
                        onMapClick={setSelectedCoords}
                        staticMarker={isStatic}
                        range={radius || 50}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div>{`Please switch to a supported chain. Supported Chain Ids: ${supportedChains.join(
                  ", "
                )}`}</div>
              )}
            </div>
          ) : (
            <div>Please connect to a Wallet</div>
          )}
        </>
      )}
      <footer className={styles.footer}>© 2024 Open City. All rights reserved.</footer>
    </div>
  );
};

export default CreateProposalPage;
