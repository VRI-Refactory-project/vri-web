import React, { useState } from "react";
import { Link } from "react-router-dom";

const initialRequests = [
  {
    id: "REQ-001",
    title: "Hospital appointment",
    organisation: "Northside Medical Center",
    context: "General Interpreting",
    language: "Uganda Sign Language + English",
    participants: "1 Deaf participant and 1 Hearing participant",
    waiting: "02:18",
    priority: "routine",
  },
  {
    id: "REQ-002",
    title: "Routine check-up",
    organisation: "Lakeview Health Centre",
    context: "Health Interpreting",
    language: "Uganda Sign Language + English",
    participants: "1 Deaf participant and 1 Hearing participant",
    waiting: "01:42",
    priority: "routine",
  },
  {
    id: "REQ-003",
    title: "Custody hearing",
    organisation: "Buganda Road Court",
    context: "Legal Interpreting",
    language: "Uganda Sign Language + English",
    participants: "1 Deaf participant and 1 Hearing participant",
    waiting: "00:18",
    priority: "routine",
  },
];

export default function InterpreterRequests() {
  const [requests, setRequests] = useState(initialRequests);

  const remove = (id) => setRequests((items) => items.filter((item) => item.id !== id));

  return (
    <div className="sc-page">
      <header className="sc-page-header">
        <div>
          <h1>Available requests <span className="sc-availability-pill">● Available</span></h1>
        </div>
        <div className="sc-header-actions">
          <button className="sc-icon-button" aria-label="Notifications">♧</button>
          <span className="sc-top-avatar">S</span>
        </div>
      </header>

      <div className="sc-request-toolbar">
        <strong>{requests.length} requests available</strong>
        <select defaultValue="longest">
          <option value="longest">Longest waiting first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <div className="sc-request-list">
        {requests.map((request) => (
          <article className="sc-request-card" key={request.id}>
            <div className="sc-request-content">
              <h2>{request.title}</h2>
              <p>{request.organisation} · {request.context}</p>
              <span>▣ {request.language}</span>
              <span>♙ {request.participants}</span>
            </div>
            <div className="sc-request-actions">
              <span className="sc-waiting">◷ Waiting {request.waiting}</span>
              <div>
                <Link className="sc-outline-btn" to={`/interpreter/requests/${request.id}`}>View</Link>
                <button className="sc-outline-btn" onClick={() => remove(request.id)}>Decline</button>
                <button className="sc-primary-btn" onClick={() => remove(request.id)}>✓ Accept</button>
              </div>
            </div>
          </article>
        ))}
        {requests.length === 0 && (
          <div className="sc-empty-state">
            <strong>No available requests</strong>
            <p>New routed requests will appear here when your status is available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
