const express = require("express");
const { createProposal } = require("../controllers/proposalController");

// Initialize express router
const router = express.Router();

// Define the POST route to handle proposal submissions
router.post("/", async (req, res) => {
  try {
    await createProposal(req, res);
    return res.status(200).json({ message: "Proposal submitted successfully" });
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;