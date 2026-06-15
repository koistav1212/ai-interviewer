"use client";

import { useEffect, useState } from "react";
import { api, tokenStorage } from "../../../lib/api";
import styles from "../../(recruiter)/dashboard/dashboard.module.css";

export default function ResumeProfileBuilder() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Personal Info States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [rawText, setRawText] = useState("");

  // Skills tag state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Education list state
  const [educationList, setEducationList] = useState<any[]>([]);

  // Experience list state
  const [experienceList, setExperienceList] = useState<any[]>([]);

  // Projects list state
  const [projectsList, setProjectsList] = useState<any[]>([]);

  // Certifications list state
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");

  // Languages list state
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");

  const populateFields = (profileData: any) => {
    if (!profileData) return;
    setProfile(profileData);
    setRawText(profileData.resumeText || "");
    setExperienceYears(String(profileData.experienceYears || 0));

    const struct = profileData.skills || {};
    const personal = struct.personalInfo || {};

    setFullName(personal.fullName || "");
    setEmail(personal.email || "");
    setPhone(personal.phone || "");
    setLocation(personal.location || "");

    // Process skills
    if (Array.isArray(struct.skills)) {
      setSkills(struct.skills);
    } else if (struct.skills && typeof struct.skills === "object") {
      setSkills(Object.values(struct.skills).flat().map(String));
    } else {
      setSkills([]);
    }

    setEducationList(struct.education || []);
    setExperienceList(struct.experience || []);
    setProjectsList(struct.projects || []);
    setCertifications(struct.certifications || []);
    setLanguages(struct.languages || []);
  };

  const fetchProfile = async () => {
    try {
      setErrorMsg("");
      const data = await api.candidate.getProfile();
      if (data) {
        populateFields(data);
      }
    } catch (err: any) {
      if (
        err.message?.includes("401") ||
        err.message?.includes("unauthorized") ||
        err.message?.includes("Authorization")
      ) {
        tokenStorage.logout();
        window.location.href = "/login";
      } else {
        setErrorMsg("Failed to retrieve your current profile details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setParsing(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
        const response = await api.candidate.uploadResume(file);
        if (response?.profile) {
          populateFields(response.profile);
          setSuccessMsg("🎉 Resume PDF parsed and profile details pre-populated!");
        }
      } catch (err: any) {
        console.error("Resume upload error:", err);
        setErrorMsg(err.message || "Failed to parse resume PDF.");
      } finally {
        setParsing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const structuredPayload = {
        personalInfo: {
          fullName,
          email,
          phone,
          location,
        },
        skills,
        education: educationList,
        experience: experienceList,
        projects: projectsList,
        certifications,
        languages,
      };

      await api.candidate.updateProfile({
        resumeText: rawText || `Resume Profile of ${fullName}`,
        skills: structuredPayload,
        experienceYears: parseFloat(experienceYears) || 0,
      });

      setSuccessMsg("🎉 Resume Profile saved successfully & AI indexing updated!");
      // Reload profile to reflect latest DB changes
      const updated = await api.candidate.getProfile();
      if (updated) {
        populateFields(updated);
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMsg(err.message || "Failed to save profile details.");
    } finally {
      setSaving(false);
    }
  };

  // Tag list action helpers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const addCert = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const removeCert = (indexToRemove: number) => {
    setCertifications(certifications.filter((_, idx) => idx !== indexToRemove));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (indexToRemove: number) => {
    setLanguages(languages.filter((_, idx) => idx !== indexToRemove));
  };

  // Education list action helpers
  const addEducationItem = () => {
    setEducationList([
      ...educationList,
      { institution: "", degree: "", passingYear: "", score: "" },
    ]);
  };

  const updateEducationItem = (index: number, key: string, value: string) => {
    const updated = educationList.map((item, idx) => {
      if (idx === index) {
        return { ...item, [key]: value };
      }
      return item;
    });
    setEducationList(updated);
  };

  const removeEducationItem = (indexToRemove: number) => {
    setEducationList(educationList.filter((_, idx) => idx !== indexToRemove));
  };

  // Experience list action helpers
  const addExperienceItem = () => {
    setExperienceList([
      ...experienceList,
      { company: "", role: "", duration: "", responsibilities: "" },
    ]);
  };

  const updateExperienceItem = (index: number, key: string, value: string) => {
    const updated = experienceList.map((item, idx) => {
      if (idx === index) {
        return { ...item, [key]: value };
      }
      return item;
    });
    setExperienceList(updated);
  };

  const removeExperienceItem = (indexToRemove: number) => {
    setExperienceList(experienceList.filter((_, idx) => idx !== indexToRemove));
  };

  // Projects list action helpers
  const addProjectItem = () => {
    setProjectsList([...projectsList, { title: "", description: "" }]);
  };

  const updateProjectItem = (index: number, key: string, value: string) => {
    const updated = projectsList.map((item, idx) => {
      if (idx === index) {
        return { ...item, [key]: value };
      }
      return item;
    });
    setProjectsList(updated);
  };

  const removeProjectItem = (indexToRemove: number) => {
    setProjectsList(projectsList.filter((_, idx) => idx !== indexToRemove));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: "1rem", color: "var(--text-muted)" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span>Loading your Resume Profile...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "900px", margin: "0 auto", paddingBottom: "4rem" }}>
      
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>My Resume Profile</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Maintain your structured profile vectors. This details is what our Smart AI uses to personalize and calibrate interview questions specifically for you.
        </p>
      </div>

      {/* Status Badge */}
      {profile ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", color: "#10b981", fontSize: "0.85rem", fontWeight: 500 }} className="animate-fade-in">
          <span>🟢</span>
          <span>Your resume profile is active. Last updated: {new Date(profile.updatedAt).toLocaleDateString()}</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.85rem", fontWeight: 500 }} className="animate-fade-in">
          <span>🟡</span>
          <span>No resume uploaded yet. Register by uploading a PDF or entering details below.</span>
        </div>
      )}

      {/* PDF Upload / Parse Dropzone (similar design structure to Recruiter JD upload) */}
      <div style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)", border: "1px dashed var(--border)", borderRadius: "12px", padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--foreground)" }}>⚡ Auto-Extract using Resume PDF</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Upload a PDF resume to parse all sections and pre-populate the interactive builder.
          </p>
        </div>
        <div>
          {parsing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", color: "var(--primary)", fontWeight: 500 }}>
              <span style={{ width: "18px", height: "18px", border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }}></span>
              Extracting details...
            </div>
          ) : (
            <label style={{ display: "inline-block", padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, transition: "opacity 0.2s" }} className="btn btn-primary">
              Upload Resume PDF
              <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: "none" }} />
            </label>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "1rem", borderRadius: "8px", fontSize: "0.95rem", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>✅</span> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "8px", fontSize: "0.95rem", border: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>❌</span> {errorMsg}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Card 1: Personal Details */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--foreground)" }}>Personal Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--foreground)" }}>Full Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                disabled={saving || parsing}
                style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--foreground)" }}>Email Address *</label>
              <input 
                type="email" 
                required 
                placeholder="e.g. john@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving || parsing}
                style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--foreground)" }}>Phone Number</label>
              <input 
                type="text" 
                placeholder="e.g. +1 234 567 8900" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                disabled={saving || parsing}
                style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--foreground)" }}>Location (City, Country)</label>
              <input 
                type="text" 
                placeholder="e.g. New York, USA" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                disabled={saving || parsing}
                style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--foreground)" }}>Total Experience (Years)</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                placeholder="e.g. 3.5" 
                value={experienceYears} 
                onChange={(e) => setExperienceYears(e.target.value)}
                disabled={saving || parsing}
                style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Skills Tag Input */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--foreground)" }}>Skills & Competencies</h2>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              placeholder="Type a skill (e.g. React) and press Enter or click Add" 
              value={newSkill} 
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              disabled={saving || parsing}
              style={{ flex: 1, padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
            />
            <button 
              type="button" 
              onClick={addSkill}
              className="btn btn-outline"
              style={{ padding: "0 1.25rem" }}
              disabled={saving || parsing}
            >
              Add
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", minHeight: "2.5rem", padding: "0.5rem", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--background)" }}>
            {skills.length === 0 ? (
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", alignSelf: "center", marginLeft: "0.5rem" }}>No skills added yet.</span>
            ) : (
              skills.map((skill, index) => (
                <span 
                  key={index} 
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", background: "rgba(59, 130, 246, 0.15)", color: "var(--primary)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(59, 130, 246, 0.25)", fontWeight: 500 }}
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(index)} 
                    style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700, padding: 0 }}
                  >
                    &times;
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Experience List */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Work Experience</h2>
            <button 
              type="button" 
              onClick={addExperienceItem}
              className="btn btn-outline"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              disabled={saving || parsing}
            >
              ➕ Add Job History
            </button>
          </div>

          {experienceList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "8px" }}>
              No experience details parsed or entered yet. Click "Add Job History" to populate.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {experienceList.map((exp, idx) => (
                <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1.25rem", background: "var(--background)", position: "relative" }}>
                  <button 
                    type="button" 
                    onClick={() => removeExperienceItem(idx)}
                    style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#ef4444" }}
                    title="Remove Job History"
                  >
                    🗑️
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Company *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Google"
                        value={exp.company || ""}
                        onChange={(e) => updateExperienceItem(idx, "company", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Job Title / Role *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Software Engineer"
                        value={exp.role || ""}
                        onChange={(e) => updateExperienceItem(idx, "role", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Duration</label>
                      <input 
                        type="text" 
                        placeholder="e.g. June 2022 - Present"
                        value={exp.duration || ""}
                        onChange={(e) => updateExperienceItem(idx, "duration", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Responsibilities & Projects</label>
                    <textarea 
                      rows={3} 
                      placeholder="Briefly explain your key duties and accomplishments..."
                      value={exp.responsibilities || ""}
                      onChange={(e) => updateExperienceItem(idx, "responsibilities", e.target.value)}
                      disabled={saving || parsing}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.85rem", lineHeight: "1.4" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Education List */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Education Details</h2>
            <button 
              type="button" 
              onClick={addEducationItem}
              className="btn btn-outline"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              disabled={saving || parsing}
            >
              ➕ Add Education
            </button>
          </div>

          {educationList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "8px" }}>
              No education history parsed. Click "Add Education" to add one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {educationList.map((edu, idx) => (
                <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1.25rem", background: "var(--background)", position: "relative" }}>
                  <button 
                    type="button" 
                    onClick={() => removeEducationItem(idx)}
                    style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#ef4444" }}
                    title="Remove Education"
                  >
                    🗑️
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Institution / School *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. BITS Pilani"
                        value={edu.institution || ""}
                        onChange={(e) => updateEducationItem(idx, "institution", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Degree / Program *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. B.Tech in CSE"
                        value={edu.degree || ""}
                        onChange={(e) => updateEducationItem(idx, "degree", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Passing Year</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 2026"
                        value={edu.passingYear || ""}
                        onChange={(e) => updateEducationItem(idx, "passingYear", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Score / GPA</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9.1 / 10"
                        value={edu.score || ""}
                        onChange={(e) => updateEducationItem(idx, "score", e.target.value)}
                        disabled={saving || parsing}
                        style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 5: Projects List */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Key Projects</h2>
            <button 
              type="button" 
              onClick={addProjectItem}
              className="btn btn-outline"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              disabled={saving || parsing}
            >
              ➕ Add Project
            </button>
          </div>

          {projectsList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "8px" }}>
              No academic or personal projects added yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {projectsList.map((proj, idx) => (
                <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1.25rem", background: "var(--background)", position: "relative" }}>
                  <button 
                    type="button" 
                    onClick={() => removeProjectItem(idx)}
                    style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#ef4444" }}
                    title="Remove Project"
                  >
                    🗑️
                  </button>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Project Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. AI Interview Screening Bot"
                      value={proj.title || ""}
                      onChange={(e) => updateProjectItem(idx, "title", e.target.value)}
                      disabled={saving || parsing}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>Description</label>
                    <textarea 
                      rows={3} 
                      placeholder="Detail technologies used, methodologies, and quantitative results..."
                      value={proj.description || ""}
                      onChange={(e) => updateProjectItem(idx, "description", e.target.value)}
                      disabled={saving || parsing}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.85rem", lineHeight: "1.4" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 6: Certifications & Languages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          
          {/* Certifications Card */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--foreground)" }}>Certifications</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                placeholder="Google Analytics Cert" 
                value={newCert} 
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCert();
                  }
                }}
                disabled={saving || parsing}
                style={{ flex: 1, padding: "0.5rem 0.7rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "0.9rem" }}
              />
              <button type="button" onClick={addCert} className="btn btn-outline" style={{ padding: "0 1rem", fontSize: "0.9rem" }} disabled={saving || parsing}>Add</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", minHeight: "2.5rem", padding: "0.4rem", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--background)" }}>
              {certifications.length === 0 ? (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center", marginLeft: "0.5rem" }}>None added.</span>
              ) : (
                certifications.map((cert, index) => (
                  <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", background: "var(--border)", color: "var(--foreground)", padding: "2px 8px", borderRadius: "4px" }}>
                    {cert}
                    <button type="button" onClick={() => removeCert(index)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>&times;</button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Languages Card */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--foreground)" }}>Languages</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                placeholder="e.g. English" 
                value={newLanguage} 
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLanguage();
                  }
                }}
                disabled={saving || parsing}
                style={{ flex: 1, padding: "0.5rem 0.7rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "0.9rem" }}
              />
              <button type="button" onClick={addLanguage} className="btn btn-outline" style={{ padding: "0 1rem", fontSize: "0.9rem" }} disabled={saving || parsing}>Add</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", minHeight: "2.5rem", padding: "0.4rem", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--background)" }}>
              {languages.length === 0 ? (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center", marginLeft: "0.5rem" }}>None added.</span>
              ) : (
                languages.map((lang, index) => (
                  <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", background: "var(--border)", color: "var(--foreground)", padding: "2px 8px", borderRadius: "4px" }}>
                    {lang}
                    <button type="button" onClick={() => removeLanguage(index)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>&times;</button>
                  </span>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Form Footer Action */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "1rem" }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: "0.8rem 2.5rem", fontSize: "1rem", fontWeight: 600 }}
            disabled={saving || parsing}
          >
            {saving ? "Indexing Profile..." : "Save Resume Profile"}
          </button>
        </div>

      </form>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
