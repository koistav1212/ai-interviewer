"use client";

import { useEffect, useState } from "react";
import styles from "./ai-room.module.css";
import { useParams } from "next/navigation";
import { api } from "../../../../../lib/api";

export default function AIInterviewRoom() {
  const params = useParams();
  const applicationId = params.id as string;
  
  const [interview, setInterview] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: "ai", content: "Hello! I am the TalentIQ AI Interviewer. Let's start. Can you tell me about your experience with Data Analysis?" }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer simulation
  useEffect(() => {
    if (completed || loading) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [completed, loading]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchOrCreateInterview = async () => {
      try {
        setLoading(true);
        // Load MongoDB candidate profile
        try {
          const profileData = await api.candidate.getProfile();
          if (profileData) {
            setProfile(profileData);
          }
        } catch (pe) {
          console.log("Candidate profile details not found or unauthorized:", pe);
        }

        // Find existing scheduled interview for this application
        const list = await api.interviews.getCandidate();
        let currentInterview = list.find((i: any) => i.applicationId === applicationId);
        
        // If no interview is scheduled, create one dynamically for the MVP
        if (!currentInterview) {
          currentInterview = await api.interviews.create({
            applicationId,
            scheduledTime: new Date().toISOString(),
            meetingLink: "https://zoom.us/mock-ai-room"
          });
        }
        
        setInterview(currentInterview);
        
        // Start langgraph interview session
        const startRes = await api.interviews.startSession(currentInterview.id);
        setMessages([
          { role: "ai", content: startRes.question || "Welcome! Let's start the interview. Can you introduce yourself?" }
        ]);
        if (startRes.completed) {
          setCompleted(true);
        }
      } catch (err) {
        console.error("Failed to load interview context:", err);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchOrCreateInterview();
    }
  }, [applicationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || completed || submitting) return;

    const userAns = input;
    // Add user message
    const newMessages = [...messages, { role: "user", content: userAns }];
    setMessages(newMessages);
    setInput("");
    setSubmitting(true);

    try {
      // Send answer and obtain next question fromLangGraph evaluation loop
      const res = await api.interviews.submitAnswer(interview.id, userAns);
      
      if (res.completed) {
        setMessages([...newMessages, { role: "ai", content: "Thank you! That concludes our interview questions today. Please click the button below to submit your interview and receive your final AI scoring assessment." }]);
        setCompleted(true);
      } else {
        setMessages([...newMessages, { role: "ai", content: res.question }]);
      }
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      setMessages([...newMessages, { role: "ai", content: "Sorry, I encountered an issue processing that answer. Could you please repeat or elaborate?" }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishAndScore = async () => {
    if (!interview) return;
    setSubmitting(true);

    try {
      // Finalize the interview, which triggers ReportGeneratorNode compiling report metrics
      await api.interviews.finalizeSession(interview.id);

      alert("🎉 Interview successfully saved! Your final AI recruiter scores and evaluation report have been compiled.");
      window.location.href = "/applications";
    } catch (err) {
      alert("Failed to submit score: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Initializing AI Interview Room...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Parse structured details
  const personal = profile?.skills?.personalInfo || {};
  const skillsList = profile?.skills?.skills || [];
  const education = profile?.skills?.education?.[0] || {};

  return (
    <div className={styles.container}>
      
      {/* COLUMN 1: Candidate Profile (Left 25%) */}
      <aside className={styles.sideColumn}>
        <div className={styles.profileCard}>
          <div className={styles.cardTitle}>Candidate Profile</div>
          
          <div className={styles.infoItem}>
            <span>Name</span>
            <strong>{personal.fullName || "Candidate"}</strong>
          </div>

          <div className={styles.infoItem}>
            <span>Experience</span>
            <strong>{profile?.experienceYears || "3.5"} Years</strong>
          </div>

          <div className={styles.infoItem}>
            <span>Education</span>
            <strong>{education.degree ? `${education.degree} (${education.institution})` : "B.Tech in CSE"}</strong>
          </div>

          <div className={styles.infoItem}>
            <span>Resume Score</span>
            <strong style={{ color: "var(--color-primary-glow)" }}>89%</strong>
          </div>

          <div className={styles.infoItem}>
            <span>JD Match</span>
            <strong style={{ color: "#10B981" }}>92%</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Extracted Skills</span>
            <div className={styles.skillsContainer}>
              {skillsList.length > 0 ? (
                skillsList.slice(0, 8).map((skill: string, index: number) => (
                  <span key={index} className={styles.skillBadge}>{skill}</span>
                ))
              ) : (
                <>
                  <span className={styles.skillBadge}>React</span>
                  <span className={styles.skillBadge}>Node.js</span>
                  <span className={styles.skillBadge}>TypeScript</span>
                  <span className={styles.skillBadge}>Python</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* COLUMN 2: Interview Window (Center 50%) */}
      <main className={styles.centerColumn}>
        <div className={styles.header}>
          <h2>AI Interview Window</h2>
          <div className={styles.statusWrapper}>
            <span className={styles.timer}>{formatTime(timerSeconds)}</span>
            <span className={styles.pulse}>{completed ? "Finished" : "Live"}</span>
          </div>
        </div>

        {/* AI Avatar Pulse orb */}
        <div className={styles.avatarContainer}>
          <div className={styles.avatarOrb} />
          <div className={styles.avatarLabel}>TalentIQ AI Avatar</div>
        </div>

        {/* Dynamic chat transcript */}
        <div className={styles.chatArea}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`${styles.message} ${msg.role === 'ai' ? styles.aiMessage : styles.userMessage}`}>
              <div className={styles.avatar}>{msg.role === 'ai' ? '🤖' : '👤'}</div>
              <div className={styles.content}>{msg.content}</div>
            </div>
          ))}
        </div>

        {/* Waveform indicator */}
        {!completed && (
          <div className={styles.voiceIntelligenceContainer}>
            <div className={styles.waveform}>
              {isRecording ? (
                <>
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                </>
              ) : (
                <div style={{ height: "2px", width: "80px", background: "rgba(255,255,255,0.15)", borderRadius: "9999px" }} />
              )}
            </div>
            <div className={styles.voiceMetricsRow}>
              <div className={styles.voiceMetric}>
                WPM: <strong>{isRecording ? "135" : "0"}</strong>
              </div>
              <div className={styles.voiceMetric}>
                Silence: <strong>{isRecording ? "0s" : "1.2s"}</strong>
              </div>
              <div className={styles.voiceMetric}>
                Tone: <strong>Confident</strong>
              </div>
            </div>
          </div>
        )}

        {completed ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(11,14,24,0.85)', borderTop: '1px solid rgba(216, 231, 242, 0.07)' }}>
            <button 
              onClick={handleFinishAndScore} 
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', maxWidth: '320px' }}
            >
              {submitting ? "Analyzing Responses..." : "Complete & Submit Interview"}
            </button>
          </div>
        ) : (
          <form className={styles.inputArea} onSubmit={handleSend}>
            <button 
              type="button" 
              className={`${styles.voiceBtn} ${isRecording ? styles.recording : ''}`}
              onClick={() => setIsRecording(!isRecording)}
              title="Toggle Voice Input"
            >
              🎙️
            </button>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Type or speak your answer..." 
              className={styles.textInput}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        )}
      </main>

      {/* COLUMN 3: AI Analysis Panel (Right 25%) */}
      <aside className={styles.sideColumn}>
        <div className={styles.analysisCard}>
          <div className={styles.cardTitle}>Live AI Analysis</div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Confidence</span>
            <span className={`${styles.analysisValue} styles.success`}>94%</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Communication</span>
            <span className={styles.analysisValue}>Excellent</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Technical Depth</span>
            <span className={`${styles.analysisValue} styles.success`}>Strong</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Leadership</span>
            <span className={styles.analysisValue}>High Potential</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Sentiment</span>
            <span className={styles.analysisValue}>Positive (92%)</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Speaking Speed</span>
            <span className={styles.analysisValue}>135 WPM</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Filler Words</span>
            <span className={`${styles.analysisValue} ${styles.warning}`}>3 detected</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Risk Flags</span>
            <span className={styles.analysisValue} style={{ color: "#10B981" }}>None</span>
          </div>
        </div>
      </aside>

    </div>
  );
}
