"use client";

import { useState } from "react";
import styles from "./ai-room.module.css";
import { useParams } from "next/navigation";

export default function AIInterviewRoom() {
  const params = useParams();
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: "ai", content: "Hello! I am the AI Recruiter. I've reviewed your resume and match score. Let's start the interview. Can you tell me about your experience with Data Analysis?" }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    // Simulate AI follow-up
    setTimeout(() => {
      setMessages([...newMessages, { role: "ai", content: "That's very interesting. How did you handle situations where the data was messy or incomplete?" }]);
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>AI Interview Room</h2>
        <span className={styles.pulse}>Live Recording</span>
      </div>

      <div className={styles.chatArea}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${msg.role === 'ai' ? styles.aiMessage : styles.userMessage}`}>
            <div className={styles.avatar}>{msg.role === 'ai' ? '🤖' : '👤'}</div>
            <div className={styles.content}>{msg.content}</div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
