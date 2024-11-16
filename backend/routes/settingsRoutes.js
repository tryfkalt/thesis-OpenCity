const express = require("express");
const { getGovernorSettings } = require("../controllers/settingsController");

// Initialize express router
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    // Call getGovernorSettings, which handles sending the response
    await getGovernorSettings(req, res);
  } catch (error) {
    console.error("Error fetching governor settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;