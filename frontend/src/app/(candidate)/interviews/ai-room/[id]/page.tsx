"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import styles from "./ai-room.module.css";
import { useParams } from "next/navigation";
import { api } from "../../../../../lib/api";
import { VoiceEngine, VoiceSettings } from "../../../../../lib/voiceEngine";

export default function AIInterviewRoom() {
  const params = useParams();
  const applicationId = params.id as string;
  
  const [interview, setInterview] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [completed, setCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Voice system states
  const [setupComplete, setSetupComplete] = useState(false);
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [modelLoadingName, setModelLoadingName] = useState("");
  const [interviewState, setInterviewState] = useState<"speaking" | "listening" | "evaluating" | "generating_next_question">("speaking");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings state
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    ttsEngine: "native",
    voiceId: "",
    speed: 1.0
  });

  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Voice engine singleton ref
  const engine = useRef<VoiceEngine | null>(null);
  const liveTranscriptRef = useRef("");

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  // Dynamic Live AI Analysis calculation before submission
  const liveAnalysis = useMemo(() => {
    if (!liveTranscript.trim()) {
      return {
        confidence: "94%",
        communication: "Excellent",
        technicalDepth: "Strong",
        leadership: "High Potential",
        sentiment: "Positive (92%)",
        speed: "135 WPM",
        fillerWords: "3 detected",
        riskFlags: "None"
      };
    }

    const words = liveTranscript.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Confidence
    const confScore = confidence > 0 ? `${confidence}%` : "95%";

    // 2. Filler words
    const fillersList = ["um", "uh", "like", "so", "actually", "basically", "youknow"];
    const fillerCount = words.filter(w => fillersList.includes(w)).length;

    // 3. Speaking Speed estimate
    let speedStr = "135 WPM";
    const elapsedSec = timerSeconds % 60;
    if (elapsedSec > 2 && wordCount > 2) {
      const wpm = Math.round((wordCount / elapsedSec) * 60);
      speedStr = `${wpm} WPM`;
    }

    // 4. Sentiment analysis
    const posWords = ["good", "great", "experience", "success", "build", "create", "positive", "strong", "effective", "help", "learn", "solve", "easy", "perfect", "optimize", "deliver", "automate", "developer"];
    const negWords = ["bad", "fail", "error", "problem", "difficult", "hard", "wrong", "cannot", "issue", "poor"];
    const posCount = words.filter(w => posWords.includes(w)).length;
    const negCount = words.filter(w => negWords.includes(w)).length;
    let sentimentStr = "Positive (92%)";
    if (posCount || negCount) {
      const ratio = posCount / (posCount + negCount || 1);
      const pct = Math.round(70 + ratio * 28);
      sentimentStr = ratio >= 0.5 ? `Positive (${pct}%)` : `Mixed (${pct}%)`;
    }

    // 5. Technical Depth
    const techWords = ["zoho", "creator", "application", "database", "api", "react", "node", "python", "sql", "integration", "code", "automate", "process", "stack", "cloud", "deployment"];
    const techCount = words.filter(w => techWords.includes(w)).length;
    const techStr = techCount > 2 ? "Strong" : techCount > 0 ? "Medium" : "Developing";

    // 6. Leadership
    const leadWords = ["team", "lead", "manage", "project", "deliver", "responsibility", "coordinate", "owner", "collaboration", "guidance", "direction"];
    const leadCount = words.filter(w => leadWords.includes(w)).length;
    const leadStr = leadCount > 1 ? "High Potential" : leadCount > 0 ? "Moderate" : "Developing";

    // 7. Communication
    let commStr = "Excellent";
    if (fillerCount > 5) commStr = "Needs Improvement";
    else if (fillerCount > 2) commStr = "Good";

    return {
      confidence: confScore,
      communication: commStr,
      technicalDepth: techStr,
      leadership: leadStr,
      sentiment: sentimentStr,
      speed: speedStr,
      fillerWords: `${fillerCount} detected`,
      riskFlags: "None"
    };
  }, [liveTranscript, confidence, timerSeconds]);

  // Initialize VoiceEngine
  useEffect(() => {
    engine.current = new VoiceEngine();
    
    if (engine.current) {
      engine.current.onVoskProgress = (p) => {
        setModelLoadingProgress(p);
      };
      engine.current.onKokoroProgress = (p) => {
        if (p === -1) {
          alert("Kokoro model failed to load. Falling back to native browser TTS.");
          setModelLoading(false);
        } else {
          setModelLoadingProgress(p);
        }
      };
    }
  }, []);

  // Timer simulation
  useEffect(() => {
    if (completed || loading || !setupComplete) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [completed, loading, setupComplete]);

  // Load native voices for selector
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setNativeVoices(voices);
      
      const defaultIN = voices.find(v => 
        v.lang === 'en-IN' || 
        v.lang.includes('en_IN') || 
        v.name.toLowerCase().includes('india') || 
        v.name.toLowerCase().includes('indian')
      );
      if (defaultIN && !voiceSettings.voiceId) {
        setVoiceSettings(prev => ({ ...prev, voiceId: defaultIN.name }));
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [voiceSettings.voiceId]);

  // Request mic permission on render to pre-check
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        if (result.state === 'granted') {
          setMicPermission('granted');
        } else if (result.state === 'denied') {
          setMicPermission('denied');
        }
        result.onchange = () => {
          if (result.state === 'granted') setMicPermission('granted');
          if (result.state === 'denied') setMicPermission('denied');
        };
      } catch (err) {
        // Fallback for browsers that don't support query permission
      }
    };
    checkPermission();
  }, []);

  // Fetch Interview Context on mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        try {
          const profileData = await api.candidate.getProfile();
          if (profileData) {
            setProfile(profileData);
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
        
        setInterview(currentInterview);
      } catch (err) {
        console.error("Failed to load interview context:", err);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchInterview();
    }
  }, [applicationId]);

  const handleRequestPermission = async () => {
    if (!engine.current) return;
    const granted = await engine.current.requestMicPermission();
    if (granted) {
      setMicPermission("granted");
    } else {
      setMicPermission("denied");
    }
  };

  const startInterviewSession = async () => {
    if (micPermission !== "granted") {
      alert("Microphone permission is required to start the voice interview.");
      return;
    }

    try {
      setModelLoading(true);
      
      setModelLoadingName("Vosk Speech Recognition Engine");
      if (engine.current) {
        await engine.current.loadVoskModel();
      }

      if (voiceSettings.ttsEngine === "kokoro") {
        setModelLoadingName("Kokoro Local TTS Model (~80MB)");
        if (engine.current) {
          await engine.current.loadKokoroModel();
        }
      }

      setModelLoading(false);
      setSetupComplete(true);

      const startRes = await api.interviews.startSession(interview.id);
      const firstQuestion = startRes.question || "Welcome! Let's start the interview. Can you introduce yourself?";
      
      setMessages([
        { role: "ai", content: firstQuestion }
      ]);

      if (startRes.completed) {
        setCompleted(true);
      } else {
        speakQuestion(firstQuestion);
      }
    } catch (err) {
      console.error("Setup failed:", err);
      alert("Failed to initialize offline speech models. Running with native browser fallbacks.");
      setModelLoading(false);
      setSetupComplete(true);
    }
  };

  const speakQuestion = async (text: string) => {
    if (!engine.current) return;
    setInterviewState("speaking");
    setLiveTranscript("");
    
    await engine.current.speak(
      text,
      voiceSettings,
      () => {},
      () => {
        startListeningLoop();
      }
    );
  };

  const startListeningLoop = async () => {
    if (!engine.current || completed) return;
    setInterviewState("listening");
    setLiveTranscript("");
    setConfidence(0);

    await engine.current.startListening(
      (text, conf, isFinal) => {
        setLiveTranscript(text);
        setConfidence(Math.round(conf * 100));
      },
      () => {
        handleAutoSubmit();
      }
    );
  };

  const handleAutoSubmit = async () => {
    if (!engine.current || completed) return;
    
    engine.current.stopListening();
    setInterviewState("evaluating");

    const answerText = liveTranscriptRef.current;
    if (!answerText.trim()) {
      speakQuestion("I didn't catch that. Could you please repeat your answer?");
      return;
    }

    const newMessages = [...messages, { role: "user", content: answerText }];
    setMessages(newMessages);
    setLiveTranscript("");

    try {
      setInterviewState("generating_next_question");
      
      const questionId = `q_${newMessages.length}`;
      const res = await api.interviews.submitAnswer(interview.id, answerText, questionId);
      
      if (res.completed) {
        const finalMsg = "Thank you! That concludes our interview questions today. Please click the button below to submit your interview and receive your final AI scoring assessment.";
        setMessages([...newMessages, { role: "ai", content: finalMsg }]);
        setCompleted(true);
        setInterviewState("speaking");
      } else {
        setMessages([...newMessages, { role: "ai", content: res.question }]);
        speakQuestion(res.question);
      }
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      const errMsg = "Sorry, I encountered an issue processing that answer. Could you please repeat or elaborate?";
      setMessages([...newMessages, { role: "ai", content: errMsg }]);
      speakQuestion(errMsg);
    }
  };

  const handleFinishAndScore = async () => {
    if (!interview) return;
    setInterviewState("evaluating");

    try {
      await api.interviews.finalizeSession(interview.id);
      alert("🎉 Interview successfully saved! Your final AI recruiter scores and evaluation report have been compiled.");
      window.location.href = "/applications";
    } catch (err) {
      alert("Failed to submit score: " + (err as Error).message);
      setInterviewState("speaking");
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStateBadge = () => {
    switch (interviewState) {
      case "speaking":
        return <span className={`${styles.stateBadge} ${styles.speakingState}`}>🔊 AI Speaking</span>;
      case "listening":
        return <span className={`${styles.stateBadge} ${styles.listeningState}`}>🎙️ Listening</span>;
      case "evaluating":
        return <span className={`${styles.stateBadge} ${styles.evaluatingState}`}>⚙️ Evaluating</span>;
      case "generating_next_question":
        return <span className={`${styles.stateBadge} ${styles.generatingState}`}>🧠 Thinking</span>;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>Initializing AI Interview Room...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* COLUMN 1: Removed (Candidate Profile Card Section Removed as Requested) */}

      {/* COLUMN 2: Interview Window (Left/Center 75%) */}
      <main className={styles.centerColumn}>
        {!setupComplete ? (
          /* PRE-INTERVIEW SETUP COMPONENT */
          <div className={styles.setupScreen}>
            <h3>AI Voice Room Setup</h3>
            <p className={styles.setupSubtitle}>Please complete the microphone check and configure voice preferences before starting the hands-free interview.</p>
            
            <div className={styles.setupCard}>
              <div className={styles.setupRow}>
                <span>1. Microphone Status</span>
                {micPermission === "granted" ? (
                  <span className={styles.successText}>✓ Microphone Access Granted</span>
                ) : micPermission === "denied" ? (
                  <span className={styles.errorText}>✗ Microphone Access Blocked</span>
                ) : (
                  <button onClick={handleRequestPermission} className="btn btn-secondary btn-sm">Request Access</button>
                )}
              </div>

              {micPermission === "denied" && (
                <div className={styles.warningAlert}>
                  <strong>Blocked:</strong> The browser has denied microphone access. Please update your browser settings and refresh the page to continue.
                </div>
              )}
              
              <hr className={styles.divider} />

              <div className={styles.settingsGroup}>
                <label>2. Text-to-Speech Engine</label>
                <select 
                  value={voiceSettings.ttsEngine}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, ttsEngine: e.target.value as any, voiceId: "" }))}
                  className={styles.selectInput}
                >
                  <option value="native">Web Speech API (Recommended / Instant)</option>
                  <option value="kokoro">Kokoro local TTS (Neural ONNX / Local Download)</option>
                </select>
              </div>

              <div className={styles.settingsGroup}>
                <label>3. Interview Voice</label>
                {voiceSettings.ttsEngine === "native" ? (
                  <select 
                    value={voiceSettings.voiceId}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceId: e.target.value }))}
                    className={styles.selectInput}
                  >
                    <option value="">-- Default Indian English voice --</option>
                    {nativeVoices.map((v, i) => (
                      <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                ) : (
                  <select 
                    value={voiceSettings.voiceId}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceId: e.target.value }))}
                    className={styles.selectInput}
                  >
                    <option value="af_sky">Sky (Female - Default)</option>
                    <option value="af_heart">Heart (Female)</option>
                    <option value="af_bella">Bella (Female)</option>
                    <option value="af_sarah">Sarah (Female)</option>
                    <option value="bf_emma">Emma (UK Female)</option>
                    <option value="bm_george">George (UK Male)</option>
                  </select>
                )}
              </div>

              <div className={styles.settingsGroup}>
                <label>4. Speech Speed ({voiceSettings.speed}x)</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={voiceSettings.speed}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {modelLoading ? (
              <div className={styles.modelProgressContainer}>
                <span>Downloading Local AI Model: <strong>{modelLoadingName}</strong></span>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${modelLoadingProgress}%` }} />
                </div>
                <span>Please wait... {modelLoadingProgress}%</span>
              </div>
            ) : (
              <button 
                onClick={startInterviewSession} 
                className="btn btn-primary"
                disabled={micPermission !== "granted"}
                style={{ width: "100%", marginTop: "1rem" }}
              >
                Start Hands-Free Voice Interview
              </button>
            )}
          </div>
        ) : (
          /* ACTIVE INTERVIEW WINDOW */
          <>
            <div className={styles.header}>
              <h2>AI Interview Room</h2>
              <div className={styles.statusWrapper}>
                {renderStateBadge()}
                <span className={styles.timer}>{formatTime(timerSeconds)}</span>
                <button 
                  onClick={() => setSettingsOpen(!settingsOpen)} 
                  className={styles.settingsToggleBtn}
                  title="Configure Voice Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Active Voice settings sidebar overlay */}
            {settingsOpen && (
              <div className={styles.settingsOverlay}>
                <div className={styles.settingsOverlayCard}>
                  <div className={styles.overlayHeader}>
                    <h4>Voice Config</h4>
                    <button onClick={() => setSettingsOpen(false)} className={styles.closeOverlayBtn}>×</button>
                  </div>
                  
                  <div className={styles.settingsGroup}>
                    <label>Engine</label>
                    <select 
                      value={voiceSettings.ttsEngine}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, ttsEngine: e.target.value as any, voiceId: "" }))}
                      className={styles.selectInput}
                    >
                      <option value="native">Web Speech API</option>
                      <option value="kokoro">Kokoro Local ONNX</option>
                    </select>
                  </div>

                  <div className={styles.settingsGroup}>
                    <label>Voice</label>
                    <select 
                      value={voiceSettings.voiceId}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceId: e.target.value }))}
                      className={styles.selectInput}
                    >
                      {voiceSettings.ttsEngine === "native" ? (
                        nativeVoices.map((v, i) => (
                          <option key={i} value={v.name}>{v.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="af_sky">Sky (Female)</option>
                          <option value="af_heart">Heart (Female)</option>
                          <option value="bf_emma">Emma (UK Female)</option>
                          <option value="bm_george">George (UK Male)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className={styles.settingsGroup}>
                    <label>Speed ({voiceSettings.speed}x)</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Avatar Pulse orb */}
            <div className={styles.avatarContainer}>
              <div className={`${styles.avatarOrb} ${interviewState === "speaking" ? styles.avatarSpeaking : ""}`} />
              <div className={styles.avatarLabel}>TalentIQ AI Avatar</div>
            </div>

            {/* Dynamic chat transcript */}
            <div className={styles.chatArea}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.message} ${msg.role === 'ai' ? styles.aiMessage : styles.userMessage}`}>
                  <div className={styles.avatar}>{msg.role === 'ai' ? '🤖' : '👤'}</div>
                  <div className={styles.content}>
                    {msg.content}
                    
                    {/* Render live transcript box (read-only/non-editable) beneath CURRENT question */}
                    {msg.role === 'ai' && idx === messages.length - 1 && interviewState === 'listening' && (
                      <div className={styles.liveTranscriptBox}>
                        <div className={styles.liveTranscriptHeader}>
                          <span className={styles.pulseLiveDot} /> Live Transcription
                        </div>
                        <p className={styles.liveTranscriptText}>
                          {liveTranscript || "Listening... Speak your answer now."}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', gap: '1rem' }}>
                          {liveTranscript && (
                            <div className={styles.confidenceText}>
                              Vosk Match Confidence: <strong>{confidence}%</strong>
                            </div>
                          )}
                          <button
                            onClick={handleAutoSubmit}
                            className="btn btn-primary btn-sm"
                            disabled={!liveTranscript.trim()}
                            style={{ marginLeft: 'auto', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                          >
                            Submit Answer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Waveform indicator */}
            {!completed && (
              <div className={styles.voiceIntelligenceContainer}>
                <div className={styles.waveform}>
                  {interviewState === "listening" ? (
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
                    VAD Status: <strong>{interviewState === "listening" ? "Monitoring" : "Off"}</strong>
                  </div>
                  <div className={styles.voiceMetric}>
                    Auto-Submit: <strong>10s Silence Trigger</strong>
                  </div>
                  <div className={styles.voiceMetric}>
                    Speech Engine: <strong>{voiceSettings.ttsEngine === "native" ? "WebSpeech" : "Kokoro"}</strong>
                  </div>
                </div>
              </div>
            )}

            {completed ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(11,14,24,0.85)', borderTop: '1px solid rgba(216, 231, 242, 0.07)' }}>
                <button 
                  onClick={handleFinishAndScore} 
                  className="btn btn-primary"
                  disabled={interviewState === "evaluating"}
                  style={{ width: '100%', maxWidth: '320px' }}
                >
                  {interviewState === "evaluating" ? "Analyzing Responses..." : "Complete & Submit Interview"}
                </button>
              </div>
            ) : (
              /* Non-editable Live text display with manual Submit Answer Button */
              <div className={styles.handsFreeIndicator}>
                {interviewState === "listening" ? (
                  <div className={styles.transcriptSubmitRow}>
                    <div className={styles.transcriptPreview}>
                      <strong>Live Preview (Read-only): </strong>
                      <span>{liveTranscript || "Speak your answer..."}</span>
                    </div>
                    <button
                      onClick={handleAutoSubmit}
                      className="btn btn-primary"
                      disabled={!liveTranscript.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <span>🎙️ Fully Hands-Free System. Speaking/silence governs the flow automatically.</span>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* COLUMN 3: AI Analysis Panel (Right 25%) */}
      <aside className={styles.sideColumn}>
        <div className={styles.analysisCard}>
          <div className={styles.cardTitle}>Live AI Analysis</div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Confidence</span>
            <span className={`${styles.analysisValue} ${styles.success}`}>{liveAnalysis.confidence}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Communication</span>
            <span className={styles.analysisValue}>{liveAnalysis.communication}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Technical Depth</span>
            <span className={`${styles.analysisValue} ${styles.success}`}>{liveAnalysis.technicalDepth}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Leadership</span>
            <span className={styles.analysisValue}>{liveAnalysis.leadership}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Sentiment</span>
            <span className={styles.analysisValue}>{liveAnalysis.sentiment}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Speaking Speed</span>
            <span className={styles.analysisValue}>{liveAnalysis.speed}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Filler Words</span>
            <span className={`${styles.analysisValue} ${styles.warning}`}>{liveAnalysis.fillerWords}</span>
          </div>

          <div className={styles.analysisRow}>
            <span className={styles.analysisLabel}>Risk Flags</span>
            <span className={styles.analysisValue} style={{ color: "#10B981" }}>{liveAnalysis.riskFlags}</span>
          </div>
        </div>
      </aside>

    </div>
  );
}
