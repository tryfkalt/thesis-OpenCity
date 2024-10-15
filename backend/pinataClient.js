const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const pinJSONToIPFS = async (JSONBody) => {
  try {
    const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", JSONBody, {
      headers: {
        // pinata_api_key: PINATA_API_KEY,
        // pinata_secret_api_key: PINATA_API_SECRET,
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });
    // Return the response so caller can use the IPFS hash
    return response.data;
  } catch (error) {
    console.error("Error pinning JSON to IPFS:", error);
    return { success: false, message: error.message };
  }
};

module.exports = { pinJSONToIPFS };
