import Link from "next/link";
import styles from "./layout.module.css";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>AI Recruiter</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navItem}>Dashboard</Link>
          <Link href="/jobs" className={styles.navItem}>Jobs</Link>
          <Link href="/candidates" className={styles.navItem}>Candidates</Link>
          <Link href="/interviews" className={styles.navItem}>Interviews</Link>
          <Link href="/reports" className={styles.navItem}>Reports Analytics</Link>
          <Link href="/settings" className={styles.navItem}>Settings</Link>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
