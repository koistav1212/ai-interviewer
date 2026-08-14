"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./ai-room.module.css";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/src/lib/api";


type InterviewState =
  | "LOADING_CONTEXT"
  | "QUESTION_READY"
  | "CANDIDATE_TYPING"
  | "SUBMITTING_ANSWER"
  | "AI_ANALYZING"
  | "LOADING_NEXT_QUESTION"
  | "INTERVIEW_COMPLETED"
  | "ERROR";

export default function AIInterviewRoom() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  // Store only the interview ID instead of the full giant interview object to prevent memory bloat
  const [interviewId, setInterviewId] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  
  const [interviewState, setInterviewState] = useState<InterviewState>("LOADING_CONTEXT");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [draftAnswer, setDraftAnswer] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const svgObjRef = useRef<HTMLObjectElement>(null);

  // Preload voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Control SVG Animation
  useEffect(() => {
    const svgObj = svgObjRef.current;
    if (svgObj && svgObj.contentDocument) {
      const svgEl = svgObj.contentDocument.querySelector('svg');
      if (svgEl) {
        if (isSpeaking) {
          if ((svgEl as any).unpauseAnimations) (svgEl as any).unpauseAnimations();
        } else {
          if ((svgEl as any).pauseAnimations) (svgEl as any).pauseAnimations();
        }
      }
    }
  }, [isSpeaking]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakQuestion = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Select Indian Male Voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => 
      v.name.toLowerCase().includes("rishi") || 
      v.name.toLowerCase().includes("prabhat")
    );
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === "en-IN" && (v.name.toLowerCase().includes("male") || (!v.name.toLowerCase().includes("neerja") && !v.name.toLowerCase().includes("female"))));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === "en-IN");
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Fetch Interview Context on mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setInterviewState("LOADING_CONTEXT");
        try {
          const profileData = await api.candidate.getProfile();
          if (profileData) {
            setProfile({ name: profileData.name }); // only storing name
          }
        } catch (pe) {
          console.log("Candidate profile details not found or unauthorized:", pe);
        }

        const list = await api.interviews.getCandidate();
        let currentInterview = list.find((i: any) => i.applicationId === applicationId);
        
        if (!currentInterview) {
          currentInterview = await api.interviews.create({
            applicationId,
            scheduledTime: new Date().toISOString(),
            meetingLink: "https://zoom.us/mock-ai-room"
          });
        }
        
        setInterviewId(currentInterview.id);
        
        // Start session to get the first question
        const startRes = await api.interviews.startSession(currentInterview.id);
        if (startRes.completed) {
          setInterviewState("INTERVIEW_COMPLETED");
        } else {
          const firstQuestion = startRes.question || "Welcome! Let's start the interview. Can you introduce yourself?";
          setCurrentQuestion(firstQuestion);
          setInterviewState("QUESTION_READY");
          speakQuestion(firstQuestion);
        }
        
      } catch (err: any) {
        console.error("Failed to load interview context:", err);
        setErrorMsg(err.message || "Failed to load interview context.");
        setInterviewState("ERROR");
      }
    };

    if (applicationId) {
      fetchInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftAnswer(e.target.value);
    if (e.target.value.trim().length > 0) {
      if (interviewState === "QUESTION_READY") {
        setInterviewState("CANDIDATE_TYPING");
      }
    } else {
      if (interviewState === "CANDIDATE_TYPING") {
        setInterviewState("QUESTION_READY");
      }
    }
  };

  const handleSubmit = async () => {
    const answer = draftAnswer.trim();
    if (!answer || !interviewId) return;

    // Stop speaking if candidate submits while AI is still talking
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setInterviewState("SUBMITTING_ANSWER");
    
    // Brief transition state to show "Analyzing"
    setTimeout(() => {
      setInterviewState(prevState => prevState !== "ERROR" ? "AI_ANALYZING" : "ERROR");
    }, 500);

    try {
      const res = await api.interviews.submitAnswer(interviewId, answer);
      
      if (res.completed) {
        setInterviewState("INTERVIEW_COMPLETED");
      } else {
        setInterviewState("LOADING_NEXT_QUESTION");
        setTimeout(() => {
          setDraftAnswer("");
          setCurrentQuestion(res.question);
          setInterviewState("QUESTION_READY");
          speakQuestion(res.question);
        }, 800);
      }
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      setErrorMsg(err.message || "Failed to submit answer. Please try again.");
      setInterviewState("ERROR");
    }
  };

  const handleFinishAndScore = async () => {
    if (!interviewId) return;
    try {
      await api.interviews.finalizeSession(interviewId);
      router.push("/applications");
    } catch (err: any) {
      alert("Failed to submit score: " + err.message);
    }
  };
  
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const isGenerating = interviewState === "AI_ANALYZING" || 
                       interviewState === "SUBMITTING_ANSWER" || 
                       interviewState === "LOADING_NEXT_QUESTION";
                       
  const isInputDisabled = interviewState === "LOADING_CONTEXT" || isGenerating;

  let aiStatusText = "● Waiting for your answer";
  if (interviewState === "LOADING_CONTEXT") {
    aiStatusText = "● Joining...";
  } else if (isGenerating) {
    aiStatusText = "● Thinking...";
  } else if (isSpeaking) {
    aiStatusText = "● AI Interviewer is speaking...";
  }

  if (interviewState === "LOADING_CONTEXT") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>Joining Interview Room...</span>
      </div>
    );
  }

  if (interviewState === "ERROR") {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Occurred</h3>
        <p>{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Reload Page
        </button>
      </div>
    );
  }

  if (interviewState === "INTERVIEW_COMPLETED") {
    return (
      <div className={styles.completedContainer}>
        <div className={styles.completedCard}>
          <div className={styles.checkIcon}>✓</div>
          <h2>Interview Completed</h2>
          <p>Thank you for completing the interview.</p>
          <div className={styles.completedActions}>
            <button onClick={handleFinishAndScore} className="btn btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.meetingArea}>
        {/* Top Video Grid */}
        <div className={styles.videoGrid}>
          {/* AI Pane */}
          <div className={`${styles.videoTile} ${isSpeaking ? styles.activeSpeaker : ""}`}>
            <div className={styles.avatarWrapper}>
              <div className={`${styles.aiAvatar} ${isSpeaking ? styles.aiSpeaking : ""}`}>
                 <span className="serif-italic" style={{fontSize: '3rem', color: 'var(--accent-cyan)'}}>AI</span>
              </div>
            </div>
            <div className={styles.participantInfo}>
              <span className={styles.badge}>AI</span>
              <span className={styles.name}>AI Interviewer</span>
              <span className={styles.status}>{aiStatusText}</span>
            </div>
          </div>
          
          {/* Candidate Pane */}
          <div className={styles.videoTile}>
            <div className={styles.avatarWrapper}>
              <div className={styles.candidateAvatar}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "👤"}
              </div>
            </div>
            <div className={styles.participantInfo}>
              <span className={styles.name}>{profile?.name || "Candidate"}</span>
              <span className={styles.status}>● In Interview</span>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className={styles.questionArea}>
          <div className={styles.questionHeader}>
            <span className={styles.questionLabel}>Current Question</span>
            <div className={styles.ttsControls}>
              <button 
                onClick={() => speakQuestion(currentQuestion)} 
                className={styles.ttsBtn}
                title="Replay Question"
                disabled={isGenerating || !currentQuestion}
              >
                🔊 Replay Question
              </button>
            </div>
          </div>
          <p className={styles.questionText}>
            {isGenerating ? "Generating next question..." : currentQuestion}
          </p>
        </div>

        {/* Answer Area */}
        <div className={styles.answerArea}>
          <div className={styles.answerHeader}>
            <label htmlFor="candidateAnswer">Your Answer</label>
            <span className={styles.wordCount}>{getWordCount(draftAnswer)} words</span>
          </div>
          <textarea
            id="candidateAnswer"
            ref={textareaRef}
            className={styles.answerTextarea}
            placeholder="Type your answer here. Structure your response clearly and use examples where relevant..."
            value={draftAnswer}
            onChange={handleDraftChange}
            disabled={isInputDisabled}
          />
          <div className={styles.answerActions}>
            <button 
              className="btn btn-secondary" 
              disabled={isInputDisabled || !draftAnswer.trim()}
              onClick={() => { /* Local state holds the draft */ }}
            >
              Save Draft
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isInputDisabled || !draftAnswer.trim()}
            >
              {isGenerating ? "Processing..." : "Submit Answer →"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Meeting Controls */}
      <div className={styles.controlBar}>
        <div className={styles.controlGroup}>
          <button className={styles.controlBtn}>
            <span className={styles.icon}>ℹ️</span>
            <span>Interview Info</span>
          </button>
          <button className={styles.controlBtn}>
            <span className={styles.icon}>📄</span>
            <span>Resume</span>
          </button>
          <button className={styles.controlBtn}>
            <span className={styles.icon}>💼</span>
            <span>Job Description</span>
          </button>
        </div>
        
        <div className={styles.controlGroup}>
          <button className={`${styles.controlBtn} ${styles.activeMode}`}>
            <span className={styles.icon}>⌨️</span>
            <span>Text Interview</span>
          </button>
          <button className={styles.controlBtn}>
            <span className={styles.icon}>💬</span>
            <span>Chat / Help</span>
          </button>
        </div>
        
        <div className={styles.controlGroup}>
          <button className={styles.endBtn} onClick={() => {
            if(confirm("Are you sure you want to end the interview early?")) {
              setInterviewState("INTERVIEW_COMPLETED");
            }
          }}>
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
}
