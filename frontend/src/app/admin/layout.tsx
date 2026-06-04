"use client";

import Link from "next/link";
import styles from "../(recruiter)/layout.module.css";
import { tokenStorage } from "../../lib/api";

export default function AdminLayout({
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
        <div className={styles.logo}>Admin Console</div>
        <nav className={styles.nav}>
          <Link href="/admin/dashboard" className={styles.navItem}>Dashboard</Link>
          <Link href="#" className={styles.navItem}>Users</Link>
          <Link href="#" className={styles.navItem}>Platform Jobs</Link>
          <Link href="#" className={styles.navItem}>Interviews</Link>
          <Link href="#" className={styles.navItem}>Revenue & Billing</Link>
          <Link href="#" className={styles.navItem}>Settings</Link>
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
