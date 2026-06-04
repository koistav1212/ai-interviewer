"use client";

import { useEffect, useState } from "react";
import styles from "./jobs.module.css";
import { api, tokenStorage } from "../../../lib/api";

export default function CandidateJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setError("");
        const data = await api.candidate.getActiveJobs();
        setJobs(data);
      } catch (err: any) {
        if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
          tokenStorage.logout();
          window.location.href = "/login";
        } else {
          setError(err.message || "Failed to load positions.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalLoading(true);

    try {
      // 1. Submit job application
      const applyRes = await api.candidate.apply(selectedJob.id);
      
      // 2. Dynamically trigger match score report generation
      if (applyRes.application?.id) {
        await api.reports.generate(applyRes.application.id);
      }

      setModalSuccess(true);
      setTimeout(() => {
        // Redirect to candidate applications page
        window.location.href = "/applications";
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading open opportunities...</span>
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
        <h3>Error Loading Positions</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: "1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Open Positions</h1>
      
      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
          <p>No job postings are currently active. Check back later!</p>
        </div>
      ) : (
        <div className={styles.jobsList}>
          {jobs.map((job) => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobInfo}>
                <h2>{job.title}</h2>
                <div className={styles.tags}>
                  <span className={styles.tag}>{job.location || "Remote"}</span>
                  <span className={styles.tag}>{job.salaryRange || "Competitive Salary"}</span>
                  <span className={styles.tag}>Active</span>
                </div>
                {job.skills && job.skills.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {job.skills.map((s: any, i: number) => (
                      <span key={i} style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedJob(job);
                  setModalSuccess(false);
                  setModalError("");
                }}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Application Modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--foreground)' }}>Apply for {selectedJob.title}</h2>
              <button 
                onClick={() => setSelectedJob(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                disabled={modalLoading}
              >
                &times;
              </button>
            </div>

            {modalSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                <h3>Application Submitted Successfully!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Analyzing matching index & redirecting...</p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {modalError && (
                  <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    {modalError}
                  </div>
                )}

                <p style={{ fontSize: '0.95rem', color: 'var(--foreground)', lineHeight: '1.6' }}>
                  Are you sure you want to apply for the position of <strong>{selectedJob.title}</strong>?
                  Your registered candidate profile details will be submitted to the recruiter.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectedJob(null)} 
                    className="btn btn-outline"
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Submitting..." : "Confirm & Apply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
