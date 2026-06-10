"use client";

import { useState } from "react";
import { api } from "../lib/api";

interface JobPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JobPostModal({ isOpen, onClose, onSuccess }: JobPostModalProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("Google");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [skills, setSkills] = useState<any[]>([]);

  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleJDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setParsing(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
        const response = await api.jobs.uploadJD(file);
        if (response?.parsedJD) {
          const jd = response.parsedJD;
          setTitle(jd.title || "");
          setCompany(jd.company || jd.companyName || "Google");
          setDepartment(jd.department || "");
          setLocation(jd.location || "");
          setSalaryRange(jd.salaryRange || "");
          setVacancies(String(jd.vacancies || 1));
          setExperience(jd.experience || "");
          setDescription(jd.description || "");
          setRequirements(jd.requirements || "");
          setBenefits(jd.benefits || "");
          setSkills(jd.skills || []);
          setSuccessMsg("🎉 Job Description PDF parsed and fields populated successfully!");
        }
      } catch (err: any) {
        console.error("JD upload/parsing error:", err);
        setErrorMsg(err.message || "Failed to parse Job Description PDF.");
      } finally {
        setParsing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Job Title and Job Description are required.");
      return;
    }

    setPublishing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Map extracted skills into required format
      const skillsPayload = skills.map((s: any) => ({
        name: s.name,
        importance: "REQUIRED"
      }));

      await api.jobs.create({
        company,
        title,
        department,
        location,
        salaryRange,
        vacancies: parseInt(vacancies) || 1,
        experience,
        description,
        requirements,
        benefits,
        skills: skillsPayload
      });

      setSuccessMsg("🎉 Job posted successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset state
        setTitle("");
        setCompany("Google");
        setDepartment("");
        setLocation("");
        setSalaryRange("");
        setVacancies("1");
        setExperience("");
        setDescription("");
        setRequirements("");
        setBenefits("");
        setSkills([]);
        setSuccessMsg("");
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish job. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} className="animate-fade-in">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--foreground)' }}>Create & Publish New Job</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Fill details manually or upload a JD PDF to auto-populate the requirements.</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            disabled={publishing || parsing}
          >
            &times;
          </button>
        </div>

        {/* PDF Upload Section */}
        <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>⚡ Auto-Extract using JD PDF</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Extract job title, department, skills, requirements, and benefits instantly.</p>
          </div>
          <div>
            {parsing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)' }}>
                <span style={{ width: '18px', height: '18px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                Parsing PDF...
              </div>
            ) : (
              <label style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'opacity 0.2s' }}>
                Upload JD PDF
                <input type="file" accept=".pdf" onChange={handleJDUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        {successMsg && (
          <div style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Company Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Google" 
                required 
                value={company} 
                onChange={(e) => setCompany(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Job Title *</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Software Engineer" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Department</label>
              <input 
                type="text" 
                placeholder="e.g. Engineering" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Location</label>
              <input 
                type="text" 
                placeholder="e.g. New York, NY (Remote)" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Salary Range</label>
              <input 
                type="text" 
                placeholder="e.g. $120,000 - $150,000" 
                value={salaryRange} 
                onChange={(e) => setSalaryRange(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Experience Required</label>
              <input 
                type="text" 
                placeholder="e.g. 3-5 Years" 
                value={experience} 
                onChange={(e) => setExperience(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Number of Vacancies</label>
              <input 
                type="number" 
                min="1"
                value={vacancies} 
                onChange={(e) => setVacancies(e.target.value)}
                disabled={publishing}
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Job Description *</label>
            <textarea 
              rows={4} 
              placeholder="Provide a general summary of the job role..." 
              required
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              disabled={publishing}
              style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem', lineHeight: '1.4' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Job Requirements</label>
            <textarea 
              rows={3} 
              placeholder="List key requirements, qualifications, and criteria..." 
              value={requirements} 
              onChange={(e) => setRequirements(e.target.value)}
              disabled={publishing}
              style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem', lineHeight: '1.4' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Benefits & Perks</label>
            <textarea 
              rows={2} 
              placeholder="List compensation perks, health benefits, PTO, etc..." 
              value={benefits} 
              onChange={(e) => setBenefits(e.target.value)}
              disabled={publishing}
              style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem', lineHeight: '1.4' }}
            />
          </div>

          {skills.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Extracted Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map((s, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    {s.name} ({s.weight}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-outline" 
              disabled={publishing}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={publishing || parsing}
            >
              {publishing ? "Publishing..." : "Publish Job"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
