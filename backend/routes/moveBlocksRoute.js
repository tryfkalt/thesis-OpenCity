const express = require("express");
const { moveBlocks } = require("../utils/move-blocks");
const router = express.Router();

router.post("/move-blocks", async (req, res) => {
  try {
    const { amount } = req.body;
    await moveBlocks(amount);
    res.json({ success: true, message: `Moved ${amount} blocks.` });
  } catch (error) {
    console.error("Error moving blocks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;