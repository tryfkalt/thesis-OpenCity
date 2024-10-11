const express = require("express");
const { createProposal } = require("../controllers/proposalController");
const tsNode = require("ts-node");

tsNode.register({ transpileOnly: true });  // Register ts-node for TypeScript support

const { propose } = require("../scripts/propose");

const router = express.Router();

router.post("/createProposal", async (req, res) => {
    const { title, description, coordinates } = req.body;
    const args = [title, description, coordinates.lat, coordinates.lng];
    const functionToCall = "storeHazard";
    
    try {
    //   const result = await propose(args, functionToCall, description);
      res.status(200).json({ success: true, result });
    } catch (error) {
      console.error("Proposal creation error:", error);
      res.status(500).json({ success: false, message: "Failed to create proposal." });
    }
});

module.exports = router;