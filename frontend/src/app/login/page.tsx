import Link from "next/link";
import styles from "./login.module.css";

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Welcome Back</h2>
          <p>Login to access your AI Interviewer dashboard.</p>
        </div>
        
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="you@example.com" required />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required />
          </div>
          
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        
        <p className={styles.footer}>
          Don't have an account? <Link href="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
