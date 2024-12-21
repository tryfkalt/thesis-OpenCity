const express = require("express");
const {
  createProposal,
  getProposalData,
  getProposals,
  getProposalFromIPFS,
  getGovernorSettings,
  storeExecHash,
  getExecHash,
} = require("../controllers/proposalController.js");

// Initialize express router
const router = express.Router();

router.post("/proposals", async (req, res) => {
  try {
    await createProposal(req, res);
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/proposals/:proposalId", async (req, res) => {
  try {
    await getProposalData(req, res);
  } catch (error) {
    console.error("Error fetching proposal data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/proposals", async (req, res) => {
  try {
    await getProposals(req, res);
  } catch (error) {
    console.error("Error fetching proposal data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/proposals/:proposalId/txhash", async (req, res) => {
  try {
    await storeExecHash(req, res);
  } catch (error) {
    console.log("Error storing transaction hash:", error);
  }
});

router.get("/proposals/:proposalId/txhash", async (req, res) => {
  try {
    await getExecHash(req, res);
  } catch (error) {
    console.error("Error fetching transaction hash:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/proposal/ipfs", async (req, res) => {
  try {
    console.log("Fetching proposal from IPFS...");
    await getProposalFromIPFS(req, res);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/settings", async (req, res) => {
  try {
    await getGovernorSettings(req, res);
  } catch (error) {
    console.error("Error fetching governor settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
