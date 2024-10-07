import { useState } from "react";
import axios from "axios"; // Import Axios for HTTP requests
import styles from "../styles/Home.module.css";

const Proposal = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const [message, setMessage] = useState(""); // State for success/error messages

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the proposal data
    const proposalData = {
      title,
      description,
      coordinates,
    };

    try {
      // Send a POST request to the backend to save the proposal data
      const response = await axios.post("http://localhost:5000/api/proposals", proposalData);
      
      // Show success message
      setMessage("Proposal submitted successfully!");
      // Clear the form fields
      setTitle("");
      setDescription("");
      setCoordinates({ lat: "", lng: "" });
    } catch (error) {
      // Show error message if the request fails
      console.error("Error submitting proposal:", error);
      setMessage("Failed to submit proposal. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles["form-container"]}>
      <label>Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <label>Latitude</label>
      <input
        type="text"
        value={coordinates.lat}
        onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
        required
      />

      <label>Longitude</label>
      <input
        type="text"
        value={coordinates.lng}
        onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
        required
      />

      <button type="submit">Submit Proposal</button>

      {/* Display success or error message */}
      {message && <p>{message}</p>}
    </form>
  );
};

export default Proposal;