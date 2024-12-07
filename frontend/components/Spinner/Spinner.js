"use client";
import { GridLoader } from "react-spinners";
import styles from "../../styles/Spinner.module.css";

const Spinner = () => {
  return (
    <div className={styles.spinner}>
      <GridLoader color="#5ac161" 
      margin={12}
      size={20}
      />
      <p className={styles.spinnerMessage}> Please wait... </p>
    </div>
  );
};

export default Spinner;