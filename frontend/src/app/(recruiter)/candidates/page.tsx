"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard/dashboard.module.css";
import { api, tokenStorage } from "../../../lib/api";

export default function RecruiterCandidates() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Scheduler state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTimeOnly, setScheduleTimeOnly] = useState("");
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [schedulerError, setSchedulerError] = useState("");
  const [schedulerSuccess, setSchedulerSuccess] = useState(false);

  // Custom picker state
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  const emptySlots = Array(firstDayIndex).fill(null);
  const daySlots = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const allSlots = [...emptySlots, ...daySlots];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    setScheduleDate(`${currentYear}-${m}-${d}`);
    setShowCalendar(false);
  };

  const fetchApplications = async () => {
    try {
      setError("");
      const data = await api.applications.getRecruiterApplications();
      setApplications(data);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("Authorization")) {
        tokenStorage.logout();
        window.location.href = "/login";
      } else {
        setError(err.message || "Failed to load candidate applications.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      setLoading(true);
      await api.applications.updateStatus(id, status);
      await fetchApplications();
    } catch (err: any) {
      alert("Failed to update candidate status: " + err.message);
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTimeOnly) {
      setSchedulerError("Please select both a date and a time.");
      return;
    }

    setSchedulerLoading(true);
    setSchedulerError("");

    try {
      const datetimeString = `${scheduleDate}T${scheduleTimeOnly}`;
      await api.jobs.scheduleInterview(selectedApp.id, {
        scheduledTime: new Date(datetimeString).toISOString(),
      });

      setSchedulerSuccess(true);
      setTimeout(async () => {
        setSelectedApp(null);
        setScheduleDate("");
        setScheduleTimeOnly("");
        setSchedulerSuccess(false);
        await fetchApplications();
      }, 1200);
    } catch (err: any) {
      setSchedulerError(err.message || "Failed to schedule interview.");
    } finally {
      setSchedulerLoading(false);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading applications...</span>
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
        <h3>Error Loading Candidates</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: "1rem" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Candidates & Applications</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Screen applicants, inspect AI matching scores, and schedule interviews.</p>
      </div>

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }}>👥</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>No Applications Yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Once candidates apply to your job postings, they will appear here with matching index intelligence.</p>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '1rem' }}>Candidate</th>
                <th style={{ padding: '1rem' }}>Position</th>
                <th style={{ padding: '1rem' }}>Match Index</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Applied Date</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const matchScore = app.matchScore !== null && app.matchScore !== undefined ? app.matchScore : 50;
                
                // Color coding for match score
                let scoreColor = '#3b82f6'; // Blue
                if (matchScore >= 80) scoreColor = '#10b981'; // Green
                else if (matchScore < 60) scoreColor = '#f59e0b'; // Amber

                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{app.candidate?.name || "Anonymous Candidate"}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{app.candidate?.email || "N/A"}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{app.job?.title || "AI Role"}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: scoreColor, fontWeight: 700, fontSize: '0.95rem' }}>
                        {matchScore}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontWeight: 500,
                        border: '1px solid var(--border)',
                        color: app.status === 'SELECTED' ? '#10b981' : app.status === 'REJECTED' ? '#ef4444' : app.status.includes('INTERVIEW') ? '#3b82f6' : 'var(--text)'
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {app.status === 'APPLIED' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')} 
                              className="btn btn-outline" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#10b981', color: '#10b981' }}
                            >
                              Shortlist
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(app.id, 'REJECTED')} 
                              className="btn btn-outline" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {app.status === 'SHORTLISTED' && (
                          <button 
                            onClick={() => {
                              setSelectedApp(app);
                              setScheduleDate("");
                              setScheduleTimeOnly("");
                              setShowCalendar(false);
                              setShowTimeDropdown(false);
                              setCurrentMonth(new Date().getMonth());
                              setCurrentYear(new Date().getFullYear());
                              setSchedulerSuccess(false);
                              setSchedulerError("");
                            }} 
                            className="btn btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Schedule AI Interview
                          </button>
                        )}
                        {app.status === 'INTERVIEW_COMPLETED' && (
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'SELECTED')} 
                            className="btn btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                          >
                            Hire Candidate
                          </button>
                        )}
                        {['REJECTED', 'SELECTED'].includes(app.status) && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px 10px' }}>Processed</span>
                        )}
                        {app.status === 'INTERVIEW_SCHEDULED' && (
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6', padding: '4px 10px' }}>Interview Pending</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Scheduler Modal */}
      {selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '550px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} className="animate-fade-in">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--foreground)' }}>Schedule AI Interview</h3>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            {schedulerSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
                <h4>Interview Scheduled Successfully!</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Notification sent to candidate.</p>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {schedulerError && (
                  <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    {schedulerError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Candidate</label>
                    <div style={{ fontWeight: 600, marginTop: '0.25rem', color: 'var(--foreground)' }}>{selectedApp.candidate?.name}</div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Applied Position</label>
                    <div style={{ fontWeight: 600, marginTop: '0.25rem', color: 'var(--foreground)' }}>{selectedApp.job?.title}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Custom Date Picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Select Date *</label>
                    <div 
                      onClick={() => {
                        if (schedulerLoading) return;
                        setShowCalendar(!showCalendar);
                        setShowTimeDropdown(false);
                      }}
                      style={{ 
                        padding: '0.6rem 0.8rem', 
                        borderRadius: '8px', 
                        border: '1px solid ' + (showCalendar ? 'var(--primary)' : 'var(--border)'), 
                        background: 'var(--background)', 
                        color: scheduleDate ? 'var(--foreground)' : 'var(--text-muted)', 
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9rem',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <span>
                        {scheduleDate ? new Date(scheduleDate + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Choose date..."}
                      </span>
                      <span>📅</span>
                    </div>

                    {showCalendar && (
                      <div style={{
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginTop: '0.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                      }} className="animate-fade-in">
                        {/* Month Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button 
                            type="button" 
                            onClick={prevMonth} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontSize: '1.1rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            &larr;
                          </button>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9rem' }}>
                            {months[currentMonth]} {currentYear}
                          </span>
                          <button 
                            type="button" 
                            onClick={nextMonth} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontSize: '1.1rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            &rarr;
                          </button>
                        </div>

                        {/* Weekday Labels */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {daysOfWeek.map(d => <div key={d}>{d}</div>)}
                        </div>

                        {/* Month Days Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                          {allSlots.map((day, idx) => {
                            if (day === null) {
                              return <div key={`empty-${idx}`} />;
                            }
                            
                            const m = String(currentMonth + 1).padStart(2, "0");
                            const d = String(day).padStart(2, "0");
                            const dateStr = `${currentYear}-${m}-${d}`;
                            const isSelected = scheduleDate === dateStr;
                            
                            return (
                              <button
                                key={`day-${day}`}
                                type="button"
                                onClick={() => selectDay(day)}
                                style={{
                                  padding: '6px 0',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: isSelected ? 'var(--primary)' : 'transparent',
                                  color: isSelected ? 'white' : 'var(--foreground)',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? '600' : 'normal',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'var(--border)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Time Picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>Select Time *</label>
                    <div 
                      onClick={() => {
                        if (schedulerLoading) return;
                        setShowTimeDropdown(!showTimeDropdown);
                        setShowCalendar(false);
                      }}
                      style={{ 
                        padding: '0.6rem 0.8rem', 
                        borderRadius: '8px', 
                        border: '1px solid ' + (showTimeDropdown ? 'var(--primary)' : 'var(--border)'), 
                        background: 'var(--background)', 
                        color: scheduleTimeOnly ? 'var(--foreground)' : 'var(--text-muted)', 
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9rem',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <span>
                        {scheduleTimeOnly ? (() => {
                          const [hrs, mins] = scheduleTimeOnly.split(":");
                          const h = parseInt(hrs, 10);
                          const ampm = h >= 12 ? "PM" : "AM";
                          const displayH = h % 12 === 0 ? 12 : h % 12;
                          return `${String(displayH).padStart(2, "0")}:${mins} ${ampm}`;
                        })() : "Choose time..."}
                      </span>
                      <span>⏱️</span>
                    </div>

                    {showTimeDropdown && (
                      <div style={{
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginTop: '0.25rem',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                      }} className="animate-fade-in">
                        {(() => {
                          const slots = [];
                          for (let h = 8; h <= 20; h++) {
                            const hrStr = String(h).padStart(2, "0");
                            slots.push(`${hrStr}:00`);
                            slots.push(`${hrStr}:30`);
                          }
                          return slots.map((slot) => {
                            const [hrs, mins] = slot.split(":");
                            const hNum = parseInt(hrs, 10);
                            const ampm = hNum >= 12 ? "PM" : "AM";
                            const displayH = hNum % 12 === 0 ? 12 : hNum % 12;
                            const isSelected = scheduleTimeOnly === slot;
                            
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  setScheduleTimeOnly(slot);
                                  setShowTimeDropdown(false);
                                }}
                                style={{
                                  padding: '8px 4px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: isSelected ? 'var(--primary)' : 'var(--border)',
                                  color: isSelected ? 'white' : 'var(--foreground)',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? '600' : 'normal',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.opacity = '0.8';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.opacity = '1';
                                }}
                              >
                                {displayH}:{mins} {ampm}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <button type="button" onClick={() => setSelectedApp(null)} className="btn btn-outline" disabled={schedulerLoading}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={schedulerLoading}>
                    {schedulerLoading ? "Scheduling..." : "Schedule Interview"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
