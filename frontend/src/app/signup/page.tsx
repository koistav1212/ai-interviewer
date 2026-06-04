"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import styles from "../login/login.module.css";
import { useRouter, useSearchParams } from "next/navigation";

import { api, tokenStorage } from "../../lib/api";

function SignUpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = searchParams.get("role") || "recruiter";
  
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.signup({
        name,
        email,
        password,
        role: role.toUpperCase()
      });

      // Save token and user details
      tokenStorage.setToken(response.token);
      tokenStorage.setUser(response.user);

      // Redirect based on role
      if (response.user.role === 'CANDIDATE') {
        window.location.href = '/jobs';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || "Failed to create an account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Create an Account</h2>
          <p>Join the future of AI-driven hiring.</p>
        </div>

        {error && (
          <div style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", border: "1px solid #fee2e2" }}>
            {error}
          </div>
        )}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Sign Up As:</label>
            <div className={styles.roleSelection}>
              <label className={`${styles.roleLabel} ${role === 'recruiter' ? styles.active : ''}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="recruiter" 
                  checked={role === 'recruiter'} 
                  onChange={() => setRole('recruiter')} 
                  id="role-recruiter"
                  disabled={loading}
                />
                Recruiter
              </label>
              <label className={`${styles.roleLabel} ${role === 'candidate' ? styles.active : ''}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="candidate" 
                  checked={role === 'candidate'} 
                  onChange={() => setRole('candidate')} 
                  id="role-candidate"
                  disabled={loading}
                />
                Candidate
              </label>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="John Doe" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

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
            id="btn-signup-submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>
        
        <p className={styles.footer}>
          Already have an account? <Link href="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--foreground)' }}>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
