import styles from "./dashboard.module.css";

export default function RecruiterDashboard() {
  const kpis = [
    { label: "Total Jobs Posted", value: "24" },
    { label: "Active Jobs", value: "8" },
    { label: "Applications Received", value: "842" },
    { label: "Candidates Shortlisted", value: "156" },
    { label: "Interviews Scheduled", value: "48" },
    { label: "Offer Recommended", value: "12" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Dashboard</h1>
      
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
              <span>842</span>
            </div>
            <div className={styles.funnelStage} style={{ width: '40%' }}>
              <span>Shortlisted</span>
              <span>156</span>
            </div>
            <div className={styles.funnelStage} style={{ width: '20%' }}>
              <span>Interviewed</span>
              <span>48</span>
            </div>
            <div className={styles.funnelStage} style={{ width: '5%' }}>
              <span>Selected</span>
              <span>12</span>
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
              <strong>$4,500</strong>
            </div>
            <div className={styles.statRow}>
              <span>Hours Saved (AI)</span>
              <strong>120 Hrs</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
