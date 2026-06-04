"use client";

import { useState } from "react";
import styles from "./create.module.css";
import { api } from "../../../../lib/api";

export default function CreateJob() {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [vacancies, setVacancies] = useState("");
  const [experience, setExperience] = useState("");
  const [jdText, setJdText] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJDUpload = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJdText(text);
    if (text.length > 50) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const skillsPayload = aiAnalysis?.skills?.map((s: any) => ({
        name: s.name,
        importance: "REQUIRED"
      })) || [];

      await api.jobs.create({
        title,
        description: jdText,
        location,
        salaryRange,
        skills: skillsPayload
      });

      // Redirect back to dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to publish job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className={styles.pageTitle}>Create New Job</h1>
      
      {error && (
        <div style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", border: "1px solid #fee2e2" }}>
          {error}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.formSection}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Job Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Data Analyst" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Department</label>
                <input 
                  type="text" 
                  placeholder="e.g. Data Science" 
                  required 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. New York, NY" 
                  required 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Salary Range</label>
                <input 
                  type="text" 
                  placeholder="e.g. $90k - $120k" 
                  required 
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Vacancies</label>
                <input 
                  type="number" 
                  placeholder="5" 
                  required 
                  value={vacancies}
                  onChange={(e) => setVacancies(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Experience Required</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2-4 Years" 
                  required 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Job Description (Paste JD here for AI Analysis)</label>
              <textarea 
                rows={6} 
                placeholder="Paste the full job description here..."
                value={jdText}
                onChange={handleJDUpload}
                required
                disabled={loading}
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Job"}
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
