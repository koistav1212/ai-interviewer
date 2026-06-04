"use client";

import { useEffect, useState } from "react";
import styles from "./ai-room.module.css";
import { useParams } from "next/navigation";
import { api } from "../../../../../lib/api";

export default function AIInterviewRoom() {
  const params = useParams();
  const applicationId = params.id as string;
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: "ai", content: "Hello! I am the TalentIQ AI Interviewer. Let's start. Can you tell me about your experience with Data Analysis?" }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchOrCreateInterview = async () => {
      try {
        setLoading(true);
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
        const durationValue = currentInterview?.duration || 15;
        setMessages([
          { role: "ai", content: `Hello! I am the TalentIQ AI Interviewer. We have scheduled a ${durationValue} minutes interview today. Let's start. Can you tell me about your experience with Data Analysis?` }
        ]);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || completed) return;

    // Add user message
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const currentStep = step + 1;
    setStep(currentStep);

    // Simulate AI follow-up based on steps
    setTimeout(() => {
      if (currentStep === 1) {
        setMessages([...newMessages, { role: "ai", content: "Great. Can you describe how you handle cleanups and validation on messy or duplicate datasets?" }]);
      } else if (currentStep === 2) {
        setMessages([...newMessages, { role: "ai", content: "Excellent. How do you lead or collaborate in team settings when there is technical friction?" }]);
      } else {
        setMessages([...newMessages, { role: "ai", content: "Thank you! That concludes our interview questions today. Please click the button below to submit your interview and receive your final AI scoring assessment." }]);
        setCompleted(true);
      }
    }, 1500);
  };

  const handleFinishAndScore = async () => {
    if (!interview) return;
    setSubmitting(true);

    try {
      // Calculate scores dynamically based on length of response and keywords
      const userAnswers = messages.filter(m => m.role === 'user').map(m => m.content).join(" ");
      const length = userAnswers.length;

      // Base scores
      let technicalScore = 7.5;
      let communicationScore = 8.0;
      let leadershipScore = 7.0;
      let businessAcumenScore = 7.5;

      // Increment scores based on depth of response
      if (length > 150) {
        technicalScore = Math.min(10, technicalScore + 1.0);
        communicationScore = Math.min(10, communicationScore + 1.0);
      }
      if (userAnswers.toLowerCase().includes("lead") || userAnswers.toLowerCase().includes("collaborate")) {
        leadershipScore = Math.min(10, leadershipScore + 1.5);
      }

      await api.interviews.submitScore(interview.id, {
        technicalScore,
        communicationScore,
        leadershipScore,
        businessAcumenScore,
        feedback: "Candidate demonstrated solid analytical skills with structured communication patterns during the conversation."
      });

      alert("Interview successfully saved! Your scores and matching matrix have been registered.");
      window.location.href = "/applications";
    } catch (err) {
      alert("Failed to submit score: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Initializing AI Interview Room...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>AI Interview Room</h2>
        <span className={styles.pulse}>{completed ? "Interview Finished" : "Live Recording"}</span>
      </div>

      <div className={styles.chatArea}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${msg.role === 'ai' ? styles.aiMessage : styles.userMessage}`}>
            <div className={styles.avatar}>{msg.role === 'ai' ? '🤖' : '👤'}</div>
            <div className={styles.content}>{msg.content}</div>
          </div>
        ))}
      </div>

      {completed ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--card-bg)', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handleFinishAndScore} 
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', maxWidth: '300px' }}
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
    </div>
  );
}
