"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard/dashboard.module.css";
import { api, tokenStorage } from "../../../lib/api";

export default function RecruiterReports() {
  const [reportStats, setReportStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setError("");
      const data = await api.reports.getDashboard();
      setReportStats(data);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
        tokenStorage.logout();
        window.location.href = "/login";
      } else {
        setError(err.message || "Failed to load report analytics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading report statistics...</span>
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
        <h3>Error Loading Reports</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: "1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Reports & AI Analytics</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Evaluate hiring quality, screen match distributions, and automated metrics.</p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* KPI 1 */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Reports Analyzed</h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.5rem' }}>
            {reportStats?.totalReportsGenerated || 0}
          </p>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 500 }}>
            📈 +100% automated screening
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Average Match Index</h3>
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.5rem' }}>
            {reportStats?.averageMatchScore || 0}%
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Target threshold: 65% for interview shortlisting
          </div>
        </div>

      </div>

      {/* Metrics breakdown card */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Screening Insights & Trends</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span>High Matching Candidates (&gt;80% score)</span>
              <strong>62%</strong>
            </div>
            <div style={{ height: '8px', background: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#10b981', width: '62%' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span>Moderate Matching Candidates (60% - 80%)</span>
              <strong>28%</strong>
            </div>
            <div style={{ height: '8px', background: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary)', width: '28%' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span>Low Matching Candidates (&lt;60%)</span>
              <strong>10%</strong>
            </div>
            <div style={{ height: '8px', background: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#f59e0b', width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
