import React, { useState } from "react";

const completed = [
  { type: "General Interpreting", client: "Munyenga Health Clinic", time: "11:42am" },
  { type: "Video relay", client: "Kampala Referral Hospital", time: "10:15am" },
];

export default function InterpreterDashboard() {
  const [available, setAvailable] = useState(true);

  return (
    <div className="sc-page">
      <header className="sc-page-header">
        <div>
          <h1>Good morning Amina</h1>
          <p>Here's what's happening today!</p>
        </div>
        <span className="sc-top-avatar">A</span>
      </header>

      <section className="sc-status-card">
        <div className={`sc-status-dot-large ${available ? "on" : ""}`} />
        <div>
          <strong>{available ? "Available" : "Unavailable"}</strong>
          <p>{available ? "You are available to receive interpreting requests" : "You will not receive new requests"}</p>
        </div>
        <button
          className={`sc-toggle ${available ? "on" : ""}`}
          onClick={() => setAvailable(v => !v)}
          aria-pressed={available}
          aria-label="Toggle availability"
        >
          <span />
        </button>
      </section>

      <div className="sc-stat-grid">
        <article className="sc-stat-card">
          <span>Available requests</span>
          <strong>3</strong>
          <small>Waiting for interpreter</small>
          <a href="/interpreter/requests">View requests →</a>
        </article>
        <article className="sc-stat-card">
          <span>Today's Sessions</span>
          <strong>2</strong>
          <small>Upcoming sessions</small>
          <a href="/interpreter/sessions">View sessions →</a>
        </article>
        <article className="sc-stat-card">
          <span>Pending Earnings</span>
          <strong>UGX 245k</strong>
          <small>Ready for payout</small>
          <a href="/interpreter/wallet">Open wallet →</a>
        </article>
      </div>

      <div className="sc-completed-grid">
        {completed.map((item) => (
          <article className="sc-completed-card" key={item.time}>
            <span className="sc-check">✓</span>
            <div>
              <strong>Session completed</strong>
              <p>{item.type}</p>
              <small>Client: {item.client}</small>
            </div>
            <time>{item.time}</time>
          </article>
        ))}
      </div>

      <section className="sc-reminder">
        <div>
          <strong>Reminder</strong>
          <p>Your next interpreting session starts at 14:00. Please test your camera and internet connection 10 minutes before joining.</p>
        </div>
        <button className="sc-primary-btn">View calendar</button>
      </section>
    </div>
  );
}
