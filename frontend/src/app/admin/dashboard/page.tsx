import styles from "../../(recruiter)/dashboard/dashboard.module.css";

export default function AdminDashboard() {
  const kpis = [
    { label: "Total Users", value: "1,248" },
    { label: "Active Recruiters", value: "342" },
    { label: "Total Jobs Platform", value: "8,432" },
    { label: "AI Interviews Conducted", value: "45,210" },
    { label: "MRR", value: "$42,500" },
    { label: "Active Subscriptions", value: "310" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Platform Overview</h1>
      
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
          <h3>User Growth</h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
            <div style={{ width: '40px', height: '40%', background: 'var(--primary)', borderRadius: '4px' }}></div>
            <div style={{ width: '40px', height: '60%', background: 'var(--primary)', borderRadius: '4px' }}></div>
            <div style={{ width: '40px', height: '80%', background: 'var(--primary)', borderRadius: '4px' }}></div>
            <div style={{ width: '40px', height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
