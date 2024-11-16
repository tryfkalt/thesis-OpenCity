import { ConnectButton } from "web3uikit";
import Link from "next/link";
import styles from "../styles/Header.module.css";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [governanceSettings, setGovernanceSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const openModal = async () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false); // Close dropdown when opening modal
    await fetchGovernorSettings();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGovernanceSettings(null); // Clear settings on close
  };

  const fetchGovernorSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:5000/api/settings");
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to fetch governance settings");
      }

      const data = await response.json();
      setGovernanceSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Dropdown Menu */}
        <div className={styles.moreDropdown}>
          <button className={styles.moreButton} onClick={toggleDropdown}>
            More
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdownContent}>
              <button className={styles.dropdownItem} onClick={openModal}>
                Contracts and Parameters
              </button>
            </div>
          )}
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
            <h2>Contracts and Parameters</h2>

            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : governanceSettings ? (
              <div className={styles.parameters}>
                <p>
                  <strong>Proposal Threshold:</strong> {governanceSettings.proposalThreshold}
                </p>
                <p>
                  <strong>Quorum Needed:</strong> {governanceSettings.quorum}
                </p>
                <p>
                  <strong>Proposal Delay:</strong> {governanceSettings.proposalDelay}
                </p>
                <p>
                  <strong>Voting Period:</strong> {governanceSettings.votingPeriod}
                </p>
                <h3>Token Details</h3>
                <p>
                  <strong>Token Name:</strong> {governanceSettings.tokenName}
                </p>
                <p>
                  <strong>Token Symbol:</strong> {governanceSettings.tokenSymbol}
                </p>
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
