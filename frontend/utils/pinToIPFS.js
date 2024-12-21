import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const pinToIPFS = async (proposalData) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const response = await axios.post(url, proposalData, {
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
        });
        return response;
    } catch (error) {
        console.error("Error pinning data to IPFS:", error);
        setMessage("Failed to pin data to IPFS.");
        throw error;
    }
};

export default pinToIPFS;
