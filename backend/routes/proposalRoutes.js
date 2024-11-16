const express = require("express");
const { createProposal, getProposalData, getProposals, getGovernorSettings } = require("../controllers/proposalController.js");

// Initialize express router
const router = express.Router();

// Define the POST route to handle proposal submissions
router.post("/proposals", async (req, res) => {
  try {
    // Call createProposal, which handles sending the response
    await createProposal(req, res);
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/proposals/:proposalId", async (req, res) => {
  try {
    // Call getProposalData, which handles sending the response
    await getProposalData(req, res);
  } catch (error) {
    console.error("Error fetching proposal data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/proposals", async (req, res) => {
  try {
    // Call getProposalData, which handles sending the response
    await getProposals(req, res);
  } catch (error) {
    console.error("Error fetching proposal data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/settings", async (req, res) => {
  try {
    // Call getGovernorSettings, which handles sending the response
    await getGovernorSettings(req, res);
  } catch (error) {
    console.error("Error fetching governor settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Export the router
module.exports = router;
