import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className="container animate-fade-in">
      <nav className={styles.navbar}>
        <div className={styles.logo}>AI Interviewer</div>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#pricing" className={styles.navLink}>Pricing</Link>
          <Link href="#about" className={styles.navLink}>About</Link>
        </div>
        <div className={styles.authButtons}>
          <Link href="/login" className="btn btn-outline">Login</Link>
          <Link href="/signup" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      <main className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Hire Top Talent with <br /> AI Precision
        </h1>
        <p className={styles.heroSubtitle}>
          Automate resume screening, conduct AI-driven interviews, and make data-backed hiring decisions in a fraction of the time.
        </p>
        <div className={styles.heroButtons}>
          <Link href="/signup?role=recruiter" className="btn btn-primary">
            Start Hiring Now
          </Link>
          <Link href="/signup?role=candidate" className="btn btn-outline">
            I am a Candidate
          </Link>
        </div>
      </main>
    </div>
  );
}
