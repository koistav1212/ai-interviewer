"use client";

import dynamic from "next/dynamic";

const AIInterviewRoom = dynamic(
  () => import("../../../../../components/interview/AIInterviewRoom"),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading interview environment...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    ),
  }
);

export default function AIInterviewRoomPage() {
  return <AIInterviewRoom />;
}
