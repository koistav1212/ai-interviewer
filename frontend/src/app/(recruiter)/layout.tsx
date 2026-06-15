"use client";

import Link from "next/link";
import styles from "./layout.module.css";
import { tokenStorage } from "../../lib/api";
import { usePathname } from "next/navigation";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const handleLogout = () => {
    tokenStorage.logout();
    window.location.href = "/login";
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>TalentIQ</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link href="/recruiter-jobs" className={`${styles.navItem} ${isActive('/recruiter-jobs') ? styles.active : ''}`}>
            Jobs
          </Link>
          <Link href="/candidates" className={`${styles.navItem} ${isActive('/candidates') ? styles.active : ''}`}>
            Candidates
          </Link>
          <Link href="/recruiter-interviews" className={`${styles.navItem} ${isActive('/recruiter-interviews') ? styles.active : ''}`}>
            Interviews
          </Link>
          <Link href="/reports" className={`${styles.navItem} ${isActive('/reports') ? styles.active : ''}`}>
            Reports Analytics
          </Link>
          <Link href="/settings" className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}>
            Settings
          </Link>
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
