const {
  VOTING_PERIOD,
  VOTING_DELAY,
  QUORUM_PERCENTAGE,
  PROPOSAL_THRESHOLD,
} = require("../helper-hardhat-config");

/**
 * Controller function to get governor settings.
 *
 * This function handles the request to fetch the governor settings such as
 * proposal threshold, quorum percentage, voting period, and voting delay.
 * It responds with a JSON object containing these settings.
 *
 * @async
 * @function getGovernorSettings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 *
 * @throws {Error} - Throws an error if there is an issue fetching the settings
 *
 */
const getGovernorSettings = async (req, res) => {
  try {
    res.status(200).json({
      proposalThreshold: PROPOSAL_THRESHOLD,
      quorumPercentage: QUORUM_PERCENTAGE,
      votingPeriod: VOTING_PERIOD,
      votingDelay: VOTING_DELAY,
    });
  } catch (e) {
    console.error("Error fetching governor settings:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getGovernorSettings };
