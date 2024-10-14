const express = require("express");
const dotenv = require("dotenv");
const proposalRoutes = require("./routes/proposalRoutes.js");
const corsMiddleware = require("./middlewares/cors.js");

dotenv.config();

const app = express();
app.use(express.json());

app.use(corsMiddleware);

// Routes
app.use("/", proposalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
