const express = require("express");
const { createProposal } = require("../controllers/proposalController.js");

// Initialize express router
const router = express.Router();

// Define the POST route to handle proposal submissions
router.post("/", async (req, res) => {
  try {
    // Call createProposal, which handles sending the response
    await createProposal(req, res);
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Export the router
module.exports = router;
