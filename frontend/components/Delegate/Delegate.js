import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Modal, Input, Button, Notification, Blockie } from "web3uikit";
import {
  abiGovernanceToken,
  contractAddressesGovernanceToken,
  abiTokenExchange,
  contractAddressesTokenExchange,
} from "../../constants";
import styles from "../../styles/Delegate.module.css";

const DelegateComponent = () => {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomAddressModalOpen, setIsCustomAddressModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [delegateToSelf, setDelegateToSelf] = useState(true);
  const [customAddress, setCustomAddress] = useState("");
  const [votingPower, setVotingPower] = useState("-");
  const [ethAmount, setEthAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [delegatedBalance, setDelegatedBalance] = useState("0"); // New state to track delegated tokens
  const [delegatedPower, setDelegatedPower] = useState("0");
  const [previousVotingPower, setPreviousVotingPower] = useState("0");

  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const { runContractFunction } = useWeb3Contract();

  const governanceTokenAddress =
    chainId in contractAddressesGovernanceToken
      ? contractAddressesGovernanceToken[chainId][0]
      : null;
  const tokenExchangeAddress =
    chainId in contractAddressesTokenExchange ? contractAddressesTokenExchange[chainId][0] : null;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openCustomAddressModal = () => setIsCustomAddressModalOpen(true);
  const closeCustomAddressModal = () => setIsCustomAddressModalOpen(false);
  const openExchangeModal = () => setIsExchangeModalOpen(true);
  const closeExchangeModal = () => {
    setIsExchangeModalOpen(false);
    setEthAmount("");
  };

  const handleDelegateToSelf = () => {
    setDelegateToSelf(true);
    setIsCustomAddressModalOpen(false);
  };

  const handleDelegateToAddress = () => {
    closeModal();
    setDelegateToSelf(false);
    openCustomAddressModal();
  };

  const handleDelegate = async () => {
    if (!ethers.utils.isAddress(customAddress) && !delegateToSelf) {
      Notification.error({
        message: "Invalid address",
        description: "Please enter a valid Ethereum address.",
      });
      return;
    }

    setLoading(true);

    const addressToDelegate = delegateToSelf ? account : customAddress;
    console.log("Address to delegate:", addressToDelegate);
    const delegateOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "delegate",
      params: { delegatee: addressToDelegate },
    };

    try {
      const tx = await runContractFunction({
        params: delegateOptions,
        onSuccess: handleSuccess,
        onError: handleError,
      });
      await tx.wait(1);
      fetchTokenBalance();
      fetchVotingPower();
      closeModal();
      closeCustomAddressModal();
    } catch (error) {
      console.error("Error delegating voting power:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    setTokenBalance("0");
    fetchVotingPower();
  };

  const handleError = (error) => {
    console.error("Error delegating voting power:", error);
  };

  const fetchVotingPower = async () => {
    setLoading(true);
    try {
      const votingPowerOptions = {
        abi: abiGovernanceToken,
        contractAddress: governanceTokenAddress,
        functionName: "getVotes",
        params: { account },
      };
      const votes = await runContractFunction({ params: votingPowerOptions });
      const newVotingPower = votes.toString();

      // Calculate newly delegated tokens if there was a prior delegation
      if (parseInt(previousVotingPower) < parseInt(newVotingPower)) {
        setDelegatedBalance(newVotingPower); // Manually track delegated tokens
      }
      setVotingPower(newVotingPower);
      setPreviousVotingPower(newVotingPower); // Update previous voting power
      setIsClaimed(newVotingPower !== "0");
    } catch (error) {
      console.error("Error fetching voting power:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployerBalance = async () => {
    const deployerBalanceOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "getDeployerBalance",
      params: {},
    };
    const deployerBalance = await runContractFunction({ params: deployerBalanceOptions });
    console.log("Deployer balance:", deployerBalance.toString());
  };

  const fetchTokenBalance = async () => {
    setLoading(true);
    try {
      const tokenBalanceOptions = {
        abi: abiGovernanceToken,
        contractAddress: governanceTokenAddress,
        functionName: "balanceOf",
        params: { account },
      };
      const balance = await runContractFunction({ params: tokenBalanceOptions });
      setTokenBalance(balance.toString());
      console.log("Token balance:", balance.toString());
      // console.log("Delegated Balance", delegatedBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeTokens = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      Notification.error({
        message: "Invalid ETH amount",
        description: "Please enter a valid ETH amount for the exchange.",
      });
      return;
    }
    setLoading(true);
    const exchangeOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "buyTokens",
      msgValue: ethers.utils.parseEther(ethAmount),
    };

    try {
      const tx = await runContractFunction({
        params: exchangeOptions,
        onSuccess: async (tx) => {
          await tx.wait(1);
          fetchTokenBalance();
          fetchDeployerBalance();
          fetchVotingPower();
        },
        onError: (error) => console.error("Error exchanging tokens:", error),
      });
      closeExchangeModal();
    } catch (error) {
      console.error("Error in exchange transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWeb3Enabled && account) {
      fetchDeployerBalance();
      fetchTokenBalance();
      fetchVotingPower();
    }
  }, [account, chainId, isWeb3Enabled]);

  return (
    <div className={styles.container}>
      <div className={styles.votingPowerBox}>
        <h4 className={styles.votingPowerTitle}>My Voting Power</h4>
        <div className={styles.userInfo}>
          <Blockie seed={account} size={10} scale={3} className={styles.profileImage} />
          <div className={styles.userDetails}>
            <p className={styles.userAddress}>
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
            </p>
          </div>
        </div>
        <Button
          onClick={openExchangeModal}
          text="Exchange ETH with TT"
          theme="secondary"
          className={styles.exchangeButton}
          style={{ margin: "auto", marginBottom: "1.5rem" }}
        />
        <p className={styles.votingPowerText}>
          Total voting power: <span>{votingPower !== "0" ? votingPower : "-"}</span>
        </p>
        {/* 
        <p className={styles.tokenBalance}>
          TRYF TOKENS: <span>{tokenBalance}</span>
        </p> */}
        {/* <p className={styles.delegationStatus}>
          {parseInt(tokenBalance) > parseInt(delegatedBalance)
            ? `${parseInt(tokenBalance) - parseInt(delegatedBalance)} TT not delegated`
            : parseInt(tokenBalance) === 0
            ? "0 TT not delegated"
            : `${delegatedBalance} TT delegated`}
        </p> */}
        <Button
          onClick={openModal}
          text="Delegate"
          theme="primary"
          disabled={!isWeb3Enabled || !account || loading}
          style={{ margin: "auto" }}
        />
      </div>

      {/* Delegate Voting Power Modal */}
      <Modal
        isVisible={isModalOpen}
        onCancel={closeModal}
        onCloseButtonPressed={closeModal}
        onOk={handleDelegate}
        title="Delegate Voting Power"
        okText="Confirm Delegation"
        cancelText="Cancel"
        style={{ zIndex: 2000 }}
      >
        <div className={styles.modalContent}>
          <p>Delegate voting power to:</p>
          <div className={styles.modalButtonGroup}>
            <Button
              onClick={handleDelegateToSelf}
              text="Myself"
              theme="secondary"
              size="large"
              style={{ margin: "auto" }}
            />
            <Button
              onClick={handleDelegateToAddress}
              text="Custom Address"
              theme="secondary"
              size="large"
              style={{ margin: "auto", marginTop: "1rem" }}
            />
          </div>
        </div>
      </Modal>

      {/* Custom Address Modal */}
      <Modal
        isVisible={isCustomAddressModalOpen}
        onCancel={closeCustomAddressModal}
        onCloseButtonPressed={closeCustomAddressModal}
        onOk={handleDelegate}
        title="Enter Custom Address"
        okText="Confirm Address & Delegate"
        cancelText="Cancel"
        style={{ zIndex: 2000 }}
      >
        <Input
          label="Custom Address"
          value={customAddress}
          style={{ marginBottom: "1.5rem" }}
          onChange={(e) => setCustomAddress(e.target.value)}
          placeholder="Enter ETH address to delegate"
        />
      </Modal>

      {/* Exchange Modal */}
      <Modal
        isVisible={isExchangeModalOpen}
        onCancel={closeExchangeModal}
        onCloseButtonPressed={closeExchangeModal}
        onOk={handleExchangeTokens}
        title="Exchange ETH for TryfTokens - TT"
        okText="Confirm Exchange"
        cancelText="Cancel"
        style={{ zIndex: 2000 }}
      >
        <Input
          label="ETH Amount"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          style={{ marginBottom: "1.5rem" }}
          placeholder="Enter amount in ETH"
          type="number"
        />
      </Modal>
    </div>
  );
};

export default DelegateComponent;
