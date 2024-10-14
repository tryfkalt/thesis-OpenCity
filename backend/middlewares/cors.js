const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000", // Allow only your frontend origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
  credentials: true, // Allows cookies and auth headers if needed
};

module.exports = cors(corsOptions);
