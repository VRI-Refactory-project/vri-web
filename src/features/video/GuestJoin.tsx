import { useState, type FormEvent } from "react";

interface GuestJoinProps {
  roomName: string;
  error?: string | null;
  onJoin: (participantName: string) => void;
}

export function GuestJoin({ roomName, error, onJoin }: GuestJoinProps) {
  const [participantName, setParticipantName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (participantName.trim()) {
      onJoin(participantName.trim());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "2.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: "420px",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#1a202c",
            fontSize: "1.5rem",
            marginBottom: "0.5rem",
          }}
        >
          VRI Video Call
        </h2>
        <p
          style={{
            color: "#718096",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Room: <strong>{roomName}</strong>
          <br />
          Enter your name to join the call.
        </p>

        {error && (
          <p role="alert" style={{ color: "#c53030", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#4a5568",
                marginBottom: "0.35rem",
              }}
            >
              Your name:
            </label>
            <input
              type="text"
              required
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e0",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#2b6cb0",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Join Video Call
          </button>
        </form>
      </div>
    </div>
  );
}
