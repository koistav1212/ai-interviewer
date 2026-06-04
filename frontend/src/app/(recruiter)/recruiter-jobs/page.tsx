"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard/dashboard.module.css";
import { api, tokenStorage } from "../../../lib/api";
import JobPostModal from "../../../components/JobPostModal";

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchJobs = async () => {
    try {
      setError("");
      const data = await api.jobs.getMyJobs();
      setJobs(data);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
        tokenStorage.logout();
        window.location.href = "/login";
      } else {
        setError(err.message || "Failed to load your posted positions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading your posted positions...</span>
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Posted Opportunities</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Monitor, manage, and audit all job descriptions published by you.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>➕</span> Post New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }}>💼</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>No Jobs Posted Yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Begin hiring by publishing your first job position using our smart AI JD parser.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Post Your First Job</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header Title & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>{job.title}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-block', marginTop: '0.25rem' }}>
                    Department: <strong>{job.department || "General"}</strong> | Experience Required: <strong>{job.experience || "N/A"}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', border: '1px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', fontWeight: 500 }}>
                    {job.status}
                  </span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '0.75rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Location: <strong style={{ color: 'var(--text)' }}>{job.location || "Remote"}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Salary Range: <strong style={{ color: 'var(--text)' }}>{job.salaryRange || "Competitive"}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Vacancies Available: <strong style={{ color: 'var(--text)' }}>{job.vacancies || 1}</strong>
                </div>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Job Description:</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{job.description}</p>
              </div>

              {/* Requirements & Benefits */}
              {job.requirements && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Requirements:</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{job.requirements}</p>
                </div>
              )}
              {job.benefits && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Benefits & Perks:</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{job.benefits}</p>
                </div>
              )}

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Required Competencies:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {job.skills.map((s: any, i: number) => (
                      <span key={i} style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text)' }}>
                        {s.skillName} ({s.importance || "REQUIRED"})
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Shared Job Posting Modal */}
      <JobPostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setLoading(true);
          fetchJobs();
        }}
      />
    </div>
  );
}
