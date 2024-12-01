import { ConnectButton } from "web3uikit";
import Link from "next/link";
import styles from "../styles/Header.module.css";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useMoralis } from "react-moralis";
import {
  contractAddressesGovernor,
  contractAddressesGovernanceToken,
  contractAddressesTimelock,
} from "../constants";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [governanceSettings, setGovernanceSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIcon, setCopiedIcon] = useState({});

  const { chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;
  const governanceTokenAddress =
    chainId in contractAddressesGovernanceToken
      ? contractAddressesGovernanceToken[chainId][0]
      : null;
  const timelockAddress =
    chainId in contractAddressesTimelock ? contractAddressesTimelock[chainId][0] : null;

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  const openModal = async () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false);
    await fetchGovernorSettings();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGovernanceSettings(null);
  };

  const fetchGovernorSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:5000/api/settings");
      const data = await response.data;
      setGovernanceSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle copy and icon state
  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);

    // Set icon to "copied.png" for the specific key
    setCopiedIcon((prevState) => ({ ...prevState, [key]: true }));

    // Revert icon back to "copy.png" after 2 seconds
    setTimeout(() => {
      setCopiedIcon((prevState) => ({ ...prevState, [key]: false }));
    }, 2000);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.title}>
        <Link href="/" passHref>
          <a className={styles.link}>
            <div className={styles.logoContainer}>
              <p className={styles.logoText}>OpenCity</p>
              <img src="/favicon2.png" alt="App Logo" className={styles.logo} />
            </div>
          </a>
        </Link>
      </div>

      <div className={styles.navLinks}>
        <Link href="/" passHref>
          <a className={styles.link}>Home</a>
        </Link>
        <Link href="/proposals" passHref>
          <a className={styles.link}>Proposals</a>
        </Link>
        <div className={styles.moreDropdown} ref={dropdownRef}>
          <button className={styles.moreButton} onClick={toggleDropdown}>
            More
          </button>
          <div className={`${styles.dropdownContent} ${isDropdownOpen ? styles.open : ""}`}>
            <button className={styles.dropdownItem} onClick={openModal}>
              Contracts and Parameters
            </button>
          </div>
        </div>
      </div>

      <div className={styles.connectButton}>
        <ConnectButton moralisAuth={false} />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={closeModal}>
              &times;
            </button>
            <h2 className={styles.h2Title}>Contracts and Parameters</h2>

            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : governanceSettings ? (
              <div className={styles.parameters}>
                <div className={styles.parametersBox}>
                  <h3>Parameters</h3>
                  <div className={styles.parameterRow}>
                    <p>
                      <strong>Proposal Threshold:</strong>
                    </p>
                    <p>{governanceSettings.proposalThreshold} TT</p>
                  </div>
                  <div className={styles.parameterRow}>
                    <p>
                      <strong>Quorum Needed:</strong>
                    </p>
                    <p>{governanceSettings.quorumPercentage}% to pass vote</p>
                  </div>
                  <div className={styles.parameterRow}>
                    <p>
                      <strong>Proposal Delay:</strong>
                    </p>
                    <p>{governanceSettings.votingDelay} blocks</p>
                  </div>
                  <div className={styles.parameterRow}>
                    <p>
                      <strong>Voting Period:</strong>
                    </p>
                    <p>{governanceSettings.votingPeriod} blocks</p>
                  </div>
                </div>

                <div>
                  <h3>Contracts</h3>
                  {/* Governor Contract Row */}
                  <div className={styles.contractRow}>
                    <p>
                      <strong>Governor Contract:</strong> {governorAddress}
                    </p>
                    <div className={styles.iconContainer}>
                      <img
                        src={copiedIcon["governor"] ? "/copied.png" : "/copy.png"}
                        alt="Copy Governor Address"
                        className={`${styles.copyIcon} ${
                          copiedIcon["governor"] ? styles.animate : ""
                        }`}
                        onClick={() => handleCopy("governor", governorAddress)}
                      />
                      <span className={styles.tooltipCopy}>
                        {copiedIcon["governor"] ? "Address Copied!" : "Copy to Clipboard"}
                      </span>
                    </div>
                    <div className={styles.iconContainer}>
                      <a
                        className={styles.redirectButton}
                        href={`https://sepolia.etherscan.io/address/${governorAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="/etherscan.png"
                          alt="Etherscan"
                          className={styles.etherscanIcon}
                        />
                      </a>
                      <span className={styles.tooltipEther}>View on Etherscan</span>
                    </div>
                  </div>

                  {/* GovernanceToken Contract Row */}
                  <div className={styles.contractRow}>
                    <p>
                      <strong>GovernanceToken Contract:</strong> {governanceTokenAddress}
                    </p>
                    <div className={styles.iconContainer}>
                      <img
                        src={copiedIcon["token"] ? "/copied.png" : "/copy.png"}
                        alt="Copy Token Address"
                        className={`${styles.copyIcon} ${
                          copiedIcon["token"] ? styles.animate : ""
                        }`}
                        onClick={() => handleCopy("token", governanceTokenAddress)}
                      />
                      <span className={styles.tooltipCopy}>
                        {copiedIcon["token"] ? "Address Copied!" : "Copy to Clipboard"}
                      </span>
                    </div>
                    <div className={styles.iconContainer}>
                      <a
                        className={styles.redirectButton}
                        href={`https://sepolia.etherscan.io/address/${governanceTokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="/etherscan.png"
                          alt="Etherscan"
                          className={styles.etherscanIcon}
                        />
                      </a>
                      <span className={styles.tooltipEther}>View on Etherscan</span>
                    </div>
                  </div>
                   {/* TimeLock Contract Row */}
                   <div className={styles.contractRow}>
                    <p>
                      <strong>TimeLock Contract:</strong> {timelockAddress}
                    </p>
                    <div className={styles.iconContainer}>
                      <img
                        src={copiedIcon["token"] ? "/copied.png" : "/copy.png"}
                        alt="Copy Token Address"
                        className={`${styles.copyIcon} ${
                          copiedIcon["token"] ? styles.animate : ""
                        }`}
                        onClick={() => handleCopy("token", governanceTokenAddress)}
                      />
                      <span className={styles.tooltipCopy}>
                        {copiedIcon["token"] ? "Address Copied!" : "Copy to Clipboard"}
                      </span>
                    </div>
                    <div className={styles.iconContainer}>
                      <a
                        className={styles.redirectButton}
                        href={`https://sepolia.etherscan.io/address/${timelockAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="/etherscan.png"
                          alt="Etherscan"
                          className={styles.etherscanIcon}
                        />
                      </a>
                      <span className={styles.tooltipEther}>View on Etherscan</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
