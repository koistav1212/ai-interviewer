"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../jobs/jobs.module.css";
import { api, tokenStorage } from "../../../lib/api";

export default function CandidateInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal duration picker state
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [duration, setDuration] = useState<number>(15);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setError("");
        const data = await api.interviews.getCandidate();
        setInterviews(data);
      } catch (err: any) {
        if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
          tokenStorage.logout();
          window.location.href = "/login";
        } else {
          setError(err.message || "Failed to load interviews.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const handleStartInterviewSubmit = async () => {
    if (!selectedInterview) return;
    setModalLoading(true);
    setModalError("");
    try {
      await api.interviews.start(selectedInterview.id, { duration });
      // Redirect to the AI room
      window.location.href = `/interviews/ai-room/${selectedInterview.applicationId}`;
    } catch (err: any) {
      setModalError(err.message || "Failed to start interview. Please try again.");
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading your interviews schedule...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
        <h3>Error Loading Interviews</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: "1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Scheduled AI Interviews</h1>
      
      {interviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
          <p>No interviews are currently scheduled for you.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Submit applications to open positions and wait for recruiters to shortlist you.</p>
          <Link href="/jobs" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Explore Open Jobs</Link>
        </div>
      ) : (
        <div className={styles.jobsList}>
          {interviews.map((item) => (
            <div key={item.id} className={styles.jobCard}>
              <div className={styles.jobInfo}>
                <h2>{item.application?.job?.title || "AI Interview Assessment"}</h2>
                <div style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <div>📅 <strong>Scheduled:</strong> {new Date(item.scheduledTime).toLocaleString()}</div>
                  {item.duration && (
                    <div style={{ marginTop: '0.25rem' }}>⏱️ <strong>Selected Duration:</strong> {item.duration} minutes</div>
                  )}
                </div>
                <div className={styles.tags}>
                  <span className={styles.tag} style={{ borderColor: item.status === 'COMPLETED' ? '#10b981' : 'var(--border)', color: item.status === 'COMPLETED' ? '#10b981' : 'var(--text)' }}>
                    Status: {item.status}
                  </span>
                  {item.score && (
                    <span className={styles.tag} style={{ borderColor: '#10b981', color: '#10b981' }}>
                      Overall Score: {item.score.overallScore}/10
                    </span>
                  )}
                </div>
              </div>
              
              {item.status === 'SCHEDULED' ? (
                <button 
                  onClick={() => {
                    setSelectedInterview(item);
                    setDuration(item.duration || 15);
                    setModalError("");
                    setModalLoading(false);
                  }}
                  className="btn btn-primary"
                >
                  Start AI Interview
                </button>
              ) : (
                <button className="btn btn-outline" disabled>Completed</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Duration Selector Modal */}
      {selectedInterview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '450px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--foreground)' }}>Choose Interview Duration</h3>
              <button 
                onClick={() => setSelectedInterview(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                disabled={modalLoading}
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--foreground)', lineHeight: '1.5' }}>
                Select your preferred duration for the AI interview. The AI interviewer will pace the conversation based on this choice.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    disabled={modalLoading}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid ' + (duration === mins ? 'var(--primary)' : 'var(--border)'),
                      background: duration === mins ? 'rgba(37, 99, 235, 0.1)' : 'var(--background)',
                      color: duration === mins ? 'var(--primary)' : 'var(--foreground)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.95rem'
                    }}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button 
                type="button" 
                onClick={() => setSelectedInterview(null)} 
                className="btn btn-outline"
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleStartInterviewSubmit}
                className="btn btn-primary"
                disabled={modalLoading}
              >
                {modalLoading ? "Starting..." : "Start Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
