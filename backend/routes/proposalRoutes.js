const express = require("express");
const { createProposal } = require("../controllers/proposalController");
const router = express.Router();

router.post("/", createProposal);

module.exports = router;