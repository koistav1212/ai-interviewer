"use client";

import Link from "next/link";
import styles from "../(recruiter)/layout.module.css";
import { tokenStorage } from "../../lib/api";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleLogout = () => {
    tokenStorage.logout();
    window.location.href = "/login";
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>AI Interviewer</div>
        <nav className={styles.nav}>
          <Link href="/jobs" className={styles.navItem}>Open Jobs</Link>
          <Link href="/applications" className={styles.navItem}>My Applications</Link>
          <Link href="/interviews" className={styles.navItem}>Interviews</Link>
        </nav>
        <div className={styles.logoutContainer}>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            Logout <span>🚪</span>
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
