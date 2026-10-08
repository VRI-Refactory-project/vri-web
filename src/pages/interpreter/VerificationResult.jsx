import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerificationResult({ status = "verified" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const failed = new URLSearchParams(location.search).get("status") === "failed" || status === "failed";

  return (
    <div className="sc-verification-page">
      <a href="/" className="sc-verification-logo">
        <img src="/assets/signconnect-logo.png" alt="SignConnect" />
      </a>
      <button className="sc-verification-back" onClick={() => navigate(-1)}>‹ &nbsp;Back</button>

      <section className="sc-verification-card">
        <h1>{failed ? "You’re not verified" : "You’re verified"}</h1>
        <p>
          {failed
            ? "We couldn’t verify the submitted information."
            : "Your SignConnect account is ready to use."}
        </p>

        <div className={`sc-verification-icon ${failed ? "failed" : "success"}`}>
          {failed ? "×" : "✓"}
        </div>

        {failed && (
          <div className="sc-verification-reason">
            <strong>Reason</strong>
            <span>Document image is incomplete or unreadable.</span>
          </div>
        )}

        <button
          className="sc-primary-btn verification-action"
          onClick={() => navigate(failed ? "/register/interpreter" : "/interpreter/dashboard")}
        >
          {failed ? "Re-upload documents" : "Go to dashboard"}
        </button>
      </section>
    </div>
  );
}
