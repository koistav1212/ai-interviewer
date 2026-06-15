"use client";

import Link from "next/link";
import styles from "../(recruiter)/layout.module.css";
import { tokenStorage } from "../../lib/api";
import { usePathname } from "next/navigation";

export default function CandidateLayout({
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
          <Link href="/jobs" className={`${styles.navItem} ${isActive('/jobs') ? styles.active : ''}`}>
            Open Jobs
          </Link>
          <Link href="/resume" className={`${styles.navItem} ${isActive('/resume') ? styles.active : ''}`}>
            My Resume
          </Link>
          <Link href="/applications" className={`${styles.navItem} ${isActive('/applications') ? styles.active : ''}`}>
            My Applications
          </Link>
          <Link href="/interviews" className={`${styles.navItem} ${isActive('/interviews') ? styles.active : ''}`}>
            Interviews
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
