"use client";

import Link from "next/link";
import styles from "./layout.module.css";
import { tokenStorage } from "../../lib/api";

export default function RecruiterLayout({
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
        <div className={styles.logo}>AI Recruiter</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navItem}>Dashboard</Link>
          <Link href="/recruiter-jobs" className={styles.navItem}>Jobs</Link>
          <Link href="/candidates" className={styles.navItem}>Candidates</Link>
          <Link href="/recruiter-interviews" className={styles.navItem}>Interviews</Link>
          <Link href="/reports" className={styles.navItem}>Reports Analytics</Link>
          <Link href="/settings" className={styles.navItem}>Settings</Link>
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
