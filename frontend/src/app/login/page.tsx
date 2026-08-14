"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import { useRouter } from "next/navigation";
import { api, tokenStorage } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      
      // Store auth session
      tokenStorage.setToken(response.token);
      tokenStorage.setUser(response.user);

      // Route users dynamically
      if (response.user.role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else if (response.user.role === 'RECRUITER') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/jobs';
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.atmosphere} />

      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Welcome Back</h2>
          <p>Login to access your TalentIQ platform.</p>
        </div>

        {error && (
          <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.15)", padding: "0.75rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.25)", textAlign: "center" }}>
            {error}
          </div>
        )}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              placeholder="you@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className={styles.socialLoginContainer}>
          <button className={styles.socialButton} onClick={() => alert("Google login integration coming soon")}>
            <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114c-3.226 0-5.836-2.61-5.836-5.836s2.61-5.836 5.836-5.836c1.625 0 3.096.666 4.162 1.733l3.057-3.057C19.162 3.514 15.914 2.1 12.24 2.1c-5.467 0-9.9 4.433-9.9 9.9s4.433 9.9 9.9 9.9c5.7 0 9.471-4.003 9.471-9.643c0-.629-.057-1.209-.171-1.771H12.24Z" />
            </svg>
            Continue with Google
          </button>
          <button className={styles.socialButton} onClick={() => alert("LinkedIn login integration coming soon")}>
            <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            Continue with LinkedIn
          </button>
          <button className={styles.socialButton} onClick={() => alert("Microsoft login integration coming soon")}>
            <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            Continue with Microsoft
          </button>
        </div>
        
        <p className={styles.footer}>
          Don&apos;t have an account? <Link href="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
