const express = require("express");
const dotenv = require("dotenv");
const proposalRoutes = require("./routes/proposalRoutes");
const corsMiddleware = require("./middlewares/cors");

dotenv.config();

const app = express();
app.use(express.json());

app.use(corsMiddleware);

// Routes
app.use("/api/proposals", proposalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));