"use client";

import { useState } from "react";
import styles from "../dashboard/dashboard.module.css";

export default function RecruiterSettings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [autoShortlist, setAutoShortlist] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState("75");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("🎉 Settings saved successfully!");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>System Settings</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Configure notifications, threshold limits, and automated screening triggers.</p>
      </div>

      {successMsg && (
        <div style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          {successMsg}
        </div>
      )}

      {/* Form Card */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Notification section */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Notification Preferences</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Send daily email digests for new candidate applications and score matches</span>
            </label>
          </div>

          {/* AI automation triggers */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>AI Agent Automations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={autoShortlist}
                  onChange={(e) => setAutoShortlist(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Automatically shortlist candidates exceeding matching threshold index</span>
              </label>

              {autoShortlist && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginLeft: '1.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Shortlisting Matching Index Threshold (%)</label>
                  <input 
                    type="number" 
                    min="50" 
                    max="100"
                    value={matchThreshold}
                    onChange={(e) => setMatchThreshold(e.target.value)}
                    style={{ padding: '0.5rem', width: '100px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>

        </form>
      </div>

    </div>
  );
}
