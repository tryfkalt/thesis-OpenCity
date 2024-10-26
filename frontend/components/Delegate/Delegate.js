import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Modal, Input, Button } from "web3uikit";
import { abiGovernanceToken, contractAddressesGovernanceToken } from "../../constants";

const DelegateComponent = () => {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomAddressModalOpen, setIsCustomAddressModalOpen] = useState(false);
  const [delegateToSelf, setDelegateToSelf] = useState(true);
  const [customAddress, setCustomAddress] = useState("");
  const [votingPower, setVotingPower] = useState("0");

  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const { runContractFunction } = useWeb3Contract();
  const { Moralis } = useMoralis();

  const governanceTokenAddress =
    chainId in contractAddressesGovernanceToken
      ? contractAddressesGovernanceToken[chainId][0]
      : null;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openCustomAddressModal = () => setIsCustomAddressModalOpen(true);
  const closeCustomAddressModal = () => setIsCustomAddressModalOpen(false);

  const handleClaimTokens = async () => {
    const claimTokensOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "claimTokens",
      params: {},
    };

    try {
      const tx = await runContractFunction({
        params: claimTokensOptions,
        onSuccess: handleSuccessClaimTokens,
        onError: handleErrorClaimTokens,
      });
    } catch (error) {
      console.error("Error claiming tokens: ", error);
    }
  };

  const handleSuccessClaimTokens = async (tx) => {
    await tx.wait(1);
    setIsClaimed(true); // Mark the tokens as claimed
    fetchVotingPower(); // Update voting power after claiming tokens
  };

  const handleErrorClaimTokens = (error) => {
    console.error("Error claiming tokens: ", error);
  };

  const handleDelegateToSelf = () => {
    setDelegateToSelf(true);
    setIsCustomAddressModalOpen(false);
  };

  const handleDelegateToAddress = () => {
    setDelegateToSelf(false);
    openCustomAddressModal();
  };

  const handleDelegate = async () => {
    if (!governanceTokenAddress) {
      console.error("Governance token contract address not found for this chain.");
      return;
    }

    // const provider = new ethers.providers.Web3Provider(Moralis.provider);
    // const signer = provider.getSigner();

    const addressToDelegate = delegateToSelf ? account : customAddress;

    const delegateOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "delegate",
      params: {
        delegatee: addressToDelegate,
      },
    };

    try {
      await runContractFunction({
        params: delegateOptions,
        onSuccess: (tx) => handleSuccess(tx),
        onError: handleError,
      });
    } catch (error) {
      console.error("Error delegating voting power: ", error);
    }
  };

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    closeModal();
    fetchVotingPower();
  };

  const handleError = (error) => {
    console.error("Error delegating voting power: ", error);
  };

  const fetchVotingPower = async () => {
    const balanceOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    };

    try {
      const balance = await runContractFunction({ params: balanceOptions });
      console.log("Token balance:", balance.toString());
    } catch (error) {
      console.error("Error fetching token balance: ", error);
    }

    const delegateOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "delegates",
      params: {
        account: account,
      },
    };

    try {
      const delegatee = await runContractFunction({ params: delegateOptions });
      console.log("Delegatee:", delegatee);
    } catch (error) {
      console.error("Error fetching delegatee: ", error);
    }
    try {
      const votingPowerOptions = {
        abi: abiGovernanceToken,
        contractAddress: governanceTokenAddress,
        functionName: "getVotes",
        params: {
          account: account,
        },
      };

      const votes = await runContractFunction({ params: votingPowerOptions });
      console.log("votes", votes.toString());
      setVotingPower(votes.toString());
    } catch (error) {
      console.error("Error fetching voting power: ", error);
    }
    const numCheckpointsOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "numCheckpoints",
      params: {
        account: account,
      },
    };
    const checkpoints = await runContractFunction({ params: numCheckpointsOptions });
    console.log(`Checkpoints: ${checkpoints}`);
  };

  const handleGetVotes = () => {
    fetchVotingPower();
  };

  useEffect(() => {
    if (Moralis.provider) {
      fetchVotingPower();
    }
  }, [Moralis.provider, chainId]);

  return (
    <div>
      <Button
        text="Claim Tokens"
        theme="primary"
        onClick={handleClaimTokens}
        disabled={!isWeb3Enabled || !account || isClaimed}
      />
      <Button onClick={openModal} text="Delegate" theme="primary" />

      <div>
        <h3>Your Voting Power: {votingPower}</h3>
      </div>

      <Modal
        isVisible={isModalOpen}
        onCancel={closeModal}
        onCloseButtonPressed={closeModal}
        onOk={handleDelegate}
        title="Delegate Voting Power"
        okText="Confirm Delegation"
        cancelText="Cancel"
      >
        <div>
          <p>Delegate voting power to:</p>
          <Button onClick={handleDelegateToSelf} text="Myself" theme="secondary" />
          <Button onClick={handleDelegateToAddress} text="Custom Address" theme="secondary" />
        </div>
      </Modal>

      <Modal
        isVisible={isCustomAddressModalOpen}
        onCancel={closeCustomAddressModal}
        onCloseButtonPressed={closeCustomAddressModal}
        onOk={handleDelegate}
        title="Enter Custom Address"
        okText="Confirm Address & Delegate"
        cancelText="Cancel"
      >
        <Input
          label="Custom Address"
          value={customAddress}
          onChange={(e) => setCustomAddress(e.target.value)}
          placeholder="Enter ETH address to delegate"
        />
      </Modal>

      <Button onClick={handleGetVotes} text="Get Voting Power" />
    </div>
  );
};

export default DelegateComponent;
