"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { api, tokenStorage } from "../../../lib/api";
import JobPostModal from "../../../components/JobPostModal";

export default function RecruiterDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      setError("");
      const data = await api.jobs.getRecruiterDashboard();
      setMetrics(data);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
        tokenStorage.logout();
        window.location.href = "/login";
      } else {
        setError(err.message || "Failed to load dashboard statistics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading your talent intelligence dashboard...</span>
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
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: "1rem" }}>Try Again</button>
      </div>
    );
  }

  const kpis = [
    { label: "Total Jobs Posted", value: metrics?.totalJobs || 0 },
    { label: "Active Jobs", value: metrics?.totalJobs || 0 }, // Simplified for MVP
    { label: "Applications Received", value: metrics?.totalApplications || 0 },
    { label: "Candidates Shortlisted", value: metrics?.totalShortlisted || 0 },
    { label: "Interviews Scheduled", value: metrics?.totalInterviews || 0 },
    { label: "Selected Candidates", value: metrics?.totalSelected || 0 },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header Row with Publish Job Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Dashboard Overview</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>➕</span> Post New Job
        </button>
      </div>
      
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className={styles.kpiCard}>
            <h3>{kpi.label}</h3>
            <p className={styles.kpiValue}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3>Application Funnel</h3>
          <div className={styles.funnelPlaceholder}>
            <div className={styles.funnelStage} style={{ width: '100%' }}>
              <span>Applied</span>
              <span>{metrics?.totalApplications || 0}</span>
            </div>
            <div className={styles.funnelStage} style={{ width: `${Math.min(100, Math.max(10, ((metrics?.totalShortlisted || 0) / (metrics?.totalApplications || 1)) * 100))}%` }}>
              <span>Shortlisted</span>
              <span>{metrics?.totalShortlisted || 0}</span>
            </div>
            <div className={styles.funnelStage} style={{ width: `${Math.min(100, Math.max(10, ((metrics?.totalInterviews || 0) / (metrics?.totalApplications || 1)) * 100))}%` }}>
              <span>Interviewed</span>
              <span>{metrics?.totalInterviews || 0}</span>
            </div>
            <div className={styles.funnelStage} style={{ width: `${Math.min(100, Math.max(10, ((metrics?.totalSelected || 0) / (metrics?.totalApplications || 1)) * 100))}%` }}>
              <span>Selected</span>
              <span>{metrics?.totalSelected || 0}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.chartCard}>
          <h3>Hiring Efficiency</h3>
          <div className={styles.efficiencyStats}>
            <div className={styles.statRow}>
              <span>Time To Hire</span>
              <strong>14 Days (-30%)</strong>
            </div>
            <div className={styles.statRow}>
              <span>Cost Saved</span>
              <strong>${((metrics?.totalSelected || 0) * 375).toLocaleString()}</strong>
            </div>
            <div className={styles.statRow}>
              <span>Hours Saved (AI)</span>
              <strong>{((metrics?.totalApplications || 0) * 2)} Hrs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Job Posting Modal */}
      <JobPostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setLoading(true);
          fetchMetrics();
        }}
      />
    </div>
  );
}
