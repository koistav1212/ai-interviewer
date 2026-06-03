"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import styles from "../login/login.module.css";
import { useRouter, useSearchParams } from "next/navigation";

function SignUpForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "recruiter";
  
  const [role, setRole] = useState(initialRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy navigation for MVP
    window.location.href = role === 'candidate' ? '/jobs' : '/dashboard';
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Create an Account</h2>
          <p>Join the future of AI-driven hiring.</p>
        </div>
        
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
                />
                Candidate
              </label>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" placeholder="John Doe" required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="you@example.com" required />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required />
          </div>
          
          <button type="submit" className="btn btn-primary" id="btn-signup-submit">Sign Up</button>
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
