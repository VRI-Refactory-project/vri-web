import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function InterpreterRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decision, setDecision] = useState(null);

  const accept = () => {
    setDecision("accepted");
    setTimeout(() => navigate("/interpreter/sessions"), 350);
  };

  return (
    <div className="sc-page sc-details-page">
      <button className="sc-back" onClick={() => navigate(-1)}>← Back to dashboard</button>
      <div className="sc-request-state">● Waiting for Interpreters</div>
      <h1>General interpreting request</h1>
      <p className="sc-request-id">Request ID: <strong>VRI-{id || "02467"}</strong></p>

      <div className="sc-details-grid">
        <section className="sc-panel">
          <h2>Session information</h2>
          <div className="sc-info-grid">
            <div><span>Communication</span><strong>Video relay</strong></div>
            <div><span>Language</span><strong>USL + English</strong></div>
            <div><span>Session type</span><strong>On-demand</strong></div>
            <div><span>Context</span><strong>General</strong></div>
            <div><span>Requested by</span><strong>Deaf user</strong></div>
          </div>
          <hr />
          <h3>Participants</h3>
          <div className="sc-participants">
            <span>◉ 1 Deaf participant</span>
            <span>◉ 1 Hearing participant</span>
          </div>
          <hr />
          <h3>Request note</h3>
          <div className="sc-note-box">Please support the participant with general communication.</div>
        </section>

        <aside className="sc-panel sc-decision-panel">
          <span>Waiting time</span>
          <strong>02:18</strong>
          <p>Requested today · 13:24</p>
          <hr />
          <button className="sc-primary-btn wide" disabled={decision === "accepted"} onClick={accept}>
            ✓ {decision === "accepted" ? "Accepted" : "Accept request"}
          </button>
          <button className="sc-outline-btn wide" onClick={() => setDecision("declined")}>Decline</button>
          <small>Declining returns the request to the queue for another interpreter.</small>
        </aside>
      </div>
    </div>
  );
}
