"use client";

import { useState } from "react";
import styles from "./create.module.css";

export default function CreateJob() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const handleJDUpload = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const jdText = e.target.value;
    if (jdText.length > 50) {
      setIsProcessing(true);
      // Simulate AI JD Intelligence Module parsing
      setTimeout(() => {
        setAiAnalysis({
          skills: [
            { name: "SQL", weight: 30 },
            { name: "Python", weight: 30 },
            { name: "Power BI", weight: 20 },
            { name: "Communication", weight: 20 }
          ],
          keywords: ["Data Analysis", "Reporting", "Dashboards"]
        });
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Create New Job</h1>
      
      <div className={styles.grid}>
        <div className={styles.formSection}>
          <form className={styles.form}>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Job Title</label>
                <input type="text" placeholder="e.g. Data Analyst" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Department</label>
                <input type="text" placeholder="e.g. Data Science" required />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Location</label>
                <input type="text" placeholder="e.g. New York, NY" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Salary Range</label>
                <input type="text" placeholder="e.g. $90k - $120k" required />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Vacancies</label>
                <input type="number" placeholder="5" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Experience Required</label>
                <input type="text" placeholder="e.g. 2-4 Years" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Job Description (Paste JD here for AI Analysis)</label>
              <textarea 
                rows={6} 
                placeholder="Paste the full job description here..."
                onChange={handleJDUpload}
              ></textarea>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Publish Job
            </button>
          </form>
        </div>

        <div className={styles.aiSection}>
          <div className={styles.aiCard}>
            <h3>✨ AI JD Intelligence Module</h3>
            
            {isProcessing && (
              <div className={styles.processing}>
                <span className={styles.spinner}></span>
                Extracting requirements...
              </div>
            )}

            {!isProcessing && !aiAnalysis && (
              <p className={styles.placeholderText}>
                Paste a Job Description on the left to automatically extract required skills, experience, and weightages.
              </p>
            )}

            {!isProcessing && aiAnalysis && (
              <div className="animate-fade-in">
                <h4 className={styles.sectionHeading}>Extracted Skills</h4>
                <div className={styles.skillList}>
                  {aiAnalysis.skills.map((s: any, i: number) => (
                    <div key={i} className={styles.skillRow}>
                      <span>{s.name}</span>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${s.weight}%` }}></div>
                      </div>
                      <span className={styles.weight}>{s.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
