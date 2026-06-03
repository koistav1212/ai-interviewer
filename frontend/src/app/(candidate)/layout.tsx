import Link from "next/link";
import styles from "../(recruiter)/layout.module.css";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>AI Interviewer</div>
        <nav className={styles.nav}>
          <Link href="/jobs" className={styles.navItem}>Open Jobs</Link>
          <Link href="/applications" className={styles.navItem}>My Applications</Link>
          <Link href="/interviews" className={styles.navItem}>Interviews</Link>
          <Link href="/profile" className={styles.navItem}>My Profile</Link>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
