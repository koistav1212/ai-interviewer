import styles from "./jobs.module.css";

export default function CandidateJobs() {
  const openPositions = [
    { id: 1, title: "Data Analyst", department: "Data Science", location: "New York, NY", experience: "2-4 Years", salary: "$90K - $120K" },
    { id: 2, title: "Senior Product Manager", department: "Product", location: "Remote", experience: "5+ Years", salary: "$140K - $180K" },
    { id: 3, title: "Marketing Specialist", department: "Marketing", location: "San Francisco, CA", experience: "1-3 Years", salary: "$70K - $90K" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Open Positions</h1>
      
      <div className={styles.jobsList}>
        {openPositions.map(job => (
          <div key={job.id} className={styles.jobCard}>
            <div className={styles.jobInfo}>
              <h2>{job.title}</h2>
              <div className={styles.tags}>
                <span className={styles.tag}>{job.department}</span>
                <span className={styles.tag}>{job.location}</span>
                <span className={styles.tag}>{job.experience}</span>
              </div>
              <p className={styles.salary}>{job.salary}</p>
            </div>
            <button className="btn btn-primary">Apply Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}
