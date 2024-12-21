const extractIpfsHash = (description) => {
    const parts = description.split("#");
    return parts.length > 1 ? parts[1] : null;
};

export default extractIpfsHash;