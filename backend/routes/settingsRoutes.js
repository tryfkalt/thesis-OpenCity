const express = require("express");
const { getGovernorSettings } = require("../controllers/settingsController");

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    await getGovernorSettings(req, res);
  } catch (error) {
    console.error("Error fetching governor settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;