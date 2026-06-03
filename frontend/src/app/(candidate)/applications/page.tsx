import Link from "next/link";
import styles from "../jobs/jobs.module.css";

export default function CandidateApplications() {
  const applications = [
    { 
      id: 1, 
      jobTitle: "Data Analyst", 
      status: "Shortlisted", 
      matchScore: 84, 
      missingSkills: ["AWS", "Tableau"] 
    },
    { 
      id: 2, 
      jobTitle: "Marketing Specialist", 
      status: "Applied", 
      matchScore: 65, 
      missingSkills: ["SEO", "Google Analytics"] 
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>My Applications</h1>
      
      <div className={styles.jobsList}>
        {applications.map(app => (
          <div key={app.id} className={styles.jobCard}>
            <div className={styles.jobInfo}>
              <h2>{app.jobTitle}</h2>
              <div className={styles.tags}>
                <span className={styles.tag} style={{ borderColor: app.status === 'Shortlisted' ? '#10b981' : 'var(--border)' }}>
                  Status: {app.status}
                </span>
                <span className={styles.tag} style={{ color: app.matchScore >= 80 ? '#10b981' : '#f59e0b' }}>
                  AI Match: {app.matchScore}%
                </span>
              </div>
              {app.missingSkills.length > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Missing Skills Identified: </strong> 
                  {app.missingSkills.join(", ")}
                </div>
              )}
            </div>
            
            {app.status === 'Shortlisted' ? (
              <Link href={`/interviews/ai-room/${app.id}`} className="btn btn-primary">
                Start AI Interview
              </Link>
            ) : (
              <button className="btn btn-outline" disabled>Reviewing</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
