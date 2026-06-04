"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../jobs/jobs.module.css";
import { api, tokenStorage } from "../../../lib/api";

export default function CandidateApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setError("");
        const data = await api.applications.getMy();
        
        // Dynamically load reports for each application to show match scores
        const appsWithReports = await Promise.all(
          data.map(async (app: any) => {
            try {
              const report = await api.reports.getCandidateReport(app.id);
              return { ...app, report };
            } catch {
              return { ...app, report: null };
            }
          })
        );
        
        setApplications(appsWithReports);
      } catch (err: any) {
        if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
          tokenStorage.logout();
          window.location.href = "/login";
        } else {
          setError(err.message || "Failed to load applications.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading your application history...</span>
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
        <h3>Error Loading Applications</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: "1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>My Applications</h1>
      
      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
          <p>You haven't submitted any job applications yet.</p>
          <Link href="/jobs" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Explore Open Jobs</Link>
        </div>
      ) : (
        <div className={styles.jobsList}>
          {applications.map((app) => (
            <div key={app.id} className={styles.jobCard}>
              <div className={styles.jobInfo}>
                <h2>{app.job?.title || "Position"}</h2>
                <div className={styles.tags}>
                  <span className={styles.tag} style={{ borderColor: app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED' ? '#10b981' : 'var(--border)' }}>
                    Status: {app.status}
                  </span>
                  {app.report && (
                    <span className={styles.tag} style={{ color: app.report.matchScore >= 80 ? '#10b981' : '#f59e0b', borderColor: app.report.matchScore >= 80 ? '#10b981' : '#f59e0b' }}>
                      AI Match: {app.report.matchScore}%
                    </span>
                  )}
                </div>
                {app.report?.gapPoints && app.report.gapPoints.length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <strong>Missing Skills Identified: </strong> 
                    {app.report.gapPoints.join(", ")}
                  </div>
                )}
              </div>
              
              {app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED' ? (
                <Link href={`/interviews/ai-room/${app.id}`} className="btn btn-primary">
                  Start AI Interview
                </Link>
              ) : app.status === 'INTERVIEW_COMPLETED' ? (
                <button className="btn btn-outline" disabled style={{ color: '#10b981', borderColor: '#10b981' }}>Interview Finished</button>
              ) : (
                <button className="btn btn-outline" disabled>Reviewing</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
