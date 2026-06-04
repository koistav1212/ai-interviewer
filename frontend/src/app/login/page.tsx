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
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Welcome Back</h2>
          <p>Login to access your AI Interviewer dashboard.</p>
        </div>

        {error && (
          <div style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", border: "1px solid #fee2e2" }}>
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
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p className={styles.footer}>
          Don't have an account? <Link href="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
