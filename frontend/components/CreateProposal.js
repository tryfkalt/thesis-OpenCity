import { useState } from "react";
import styles from "../styles/Home.module.css";

const Proposal = ({ onProposalSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onProposalSubmit({ title, description, coordinates });
  };

  return (
    <form onSubmit={handleSubmit} className={styles["form-container"]}>
      <label>Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label>Latitude</label>
      <input
        type="text"
        value={coordinates.lat}
        onChange={(e) =>
          setCoordinates({ ...coordinates, lat: e.target.value })
        }
      />

      <label>Longitude</label>
      <input
        type="text"
        value={coordinates.lng}
        onChange={(e) =>
          setCoordinates({ ...coordinates, lng: e.target.value })
        }
      />

      <button type="submit">Submit Proposal</button>
    </form>
  );
};

export default Proposal;