import { ConnectButton } from "web3uikit";
import Link from "next/link";
import styles from "../styles/Header.module.css";

export default function Header() {
  return (
    <nav className={styles.navbar}>
      <button className={styles.title}>Open World!</button>

      <div className={styles.navLinks}>
        <Link href="/" passHref>
          <a className={styles.link}>Home</a>
        </Link>
        <Link href="/proposals" passHref>
          <a className={styles.link}>Proposals</a>
        </Link>
      </div>

      <div className={styles.connectButton}>
        <ConnectButton moralisAuth={false} />
      </div>
    </nav>
  );
}
