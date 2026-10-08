import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { label: "Home", to: "/interpreter/dashboard", icon: "home" },
  { label: "Requests", to: "/interpreter/requests", icon: "message" },
  { label: "Sessions", to: "/interpreter/sessions", icon: "video" },
  { label: "Availability", to: "/interpreter/availability", icon: "clock" },
  { label: "Wallet", to: "/interpreter/wallet", icon: "wallet" },
  { label: "Profile", to: "/interpreter/profile", icon: "user" },
  { label: "Settings", to: "/interpreter/settings", icon: "settings" },
];

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    message: <><path d="M4 5h16v11H8l-4 4z" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-1z" /><path d="M3 9h18" /><path d="M16 14h2" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.2 3.1-5 7-5s6.3 1.8 7 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.7-1.7.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.6-1H6.7v-2.4h.1a1.7 1.7 0 0 0 1.6-1A1.7 1.7 0 0 0 8.1 8.7L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1h2.4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.6 1z" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function InterpreterSidebar({ user = { name: "Amina Okafor", initial: "A" } }) {
  return (
    <aside className="sc-sidebar">
      <a href="/" className="sc-side-brand">
        <img src="/assets/signconnect-logo.png" alt="SignConnect VRI Platform" />
      </a>

      <nav className="sc-side-nav" aria-label="Interpreter navigation">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sc-side-link ${isActive ? "active" : ""}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.label === "Requests" && (
              <span className="sc-request-count" aria-label="3 requests">3</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sc-side-account">
        <span className="sc-avatar">{user.initial}</span>
        <span>
          <strong>{user.name}</strong>
          <small>View account</small>
        </span>
      </div>
    </aside>
  );
}
