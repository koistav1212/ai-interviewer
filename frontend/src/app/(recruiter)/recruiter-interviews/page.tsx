"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard/dashboard.module.css";
import { api, tokenStorage } from "../../../lib/api";

export default function RecruiterInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInterviews = async () => {
    try {
      setError("");
      const data = await api.interviews.getRecruiter();
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

  useEffect(() => {
    fetchInterviews();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading interviews log...</span>
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>AI Interviews Management</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track scheduled interviews and inspect completed AI performance assessments.</p>
      </div>

      {interviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🤖</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>No Interviews Logged</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Once you schedule interviews for shortlisted candidates, they will appear here.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {interviews.map((item) => {
            const hasScore = item.status === 'COMPLETED' && item.score;
            
            return (
              <div key={item.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      {item.application?.candidate?.name || "Anonymous Candidate"}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Position: <strong>{item.application?.job?.title || "AI Role"}</strong> | Candidate Email: <strong>{item.application?.candidate?.email}</strong>
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontWeight: 500,
                    border: '1px solid var(--border)',
                    color: item.status === 'COMPLETED' ? '#10b981' : '#3b82f6',
                    borderColor: item.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    background: item.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(59, 130, 246, 0.05)'
                  }}>
                    {item.status}
                  </span>
                </div>

                {/* Logistics */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', padding: '0.75rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    📅 <strong>Scheduled:</strong> {new Date(item.scheduledTime).toLocaleString()}
                  </div>
                  {item.duration && (
                    <div>
                      ⏱️ <strong>Duration:</strong> {item.duration} mins
                    </div>
                  )}
                </div>

                {/* Score Grid if completed */}
                {hasScore ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                      
                      <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Technical</div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{item.score.technicalScore}/10</strong>
                      </div>
                      
                      <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Communication</div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{item.score.communicationScore}/10</strong>
                      </div>
                      
                      <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Leadership</div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{item.score.leadershipScore}/10</strong>
                      </div>
                      
                      <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Business Acumen</div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{item.score.businessAcumenScore}/10</strong>
                      </div>

                      <div style={{ padding: '0.5rem', border: '1px solid var(--primary)', borderRadius: '8px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 600 }}>Overall Fit</div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{item.score.overallScore}/10</strong>
                      </div>

                    </div>

                    {item.score.feedback && (
                      <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--background)', borderLeft: '3px solid var(--primary)', fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: '1.4' }}>
                        <strong>🤖 AI Interviewer Feedback:</strong> "{item.score.feedback}"
                      </div>
                    )}
                  </div>
                ) : (
                  item.status === 'COMPLETED' && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      Assessment scoring data is loading or not recorded.
                    </div>
                  )
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
