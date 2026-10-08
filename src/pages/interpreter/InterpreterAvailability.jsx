import React, { useState } from "react";

const defaultSchedule = [
  ["Monday", true, "8:00am", "5:00pm"],
  ["Tuesday", true, "8:00am", "5:00pm"],
  ["Wednesday", true, "8:00am", "5:00pm"],
  ["Thursday", true, "8:00am", "5:00pm"],
  ["Friday", true, "8:00am", "5:00pm"],
  ["Saturday", false, "", ""],
  ["Sunday", false, "", ""],
];

export default function InterpreterAvailability() {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [saved, setSaved] = useState(false);

  const toggleDay = (index) => {
    setSchedule((rows) => rows.map((row, i) => i === index ? [row[0], !row[1], row[2] || "8:00am", row[3] || "5:00pm"] : row));
  };

  const save = () => {
    localStorage.setItem("signconnect_interpreter_availability", JSON.stringify(schedule));
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="sc-page">
      <header className="sc-page-header">
        <div>
          <h1>Availability schedule</h1>
          <p>Set the hours when you're available to receive interpreting requests.</p>
        </div>
        <button className="sc-primary-btn" onClick={save}>{saved ? "Saved ✓" : "Save changes"}</button>
      </header>

      <div className="sc-availability-layout">
        <section className="sc-panel sc-schedule-panel">
          <div className="sc-panel-heading">
            <h2>Weekly availability</h2>
            <span>(EAT)</span>
          </div>

          <div className="sc-copy-hours">▣ Copy Monday's hours to all weekdays</div>

          {schedule.map((row, index) => (
            <div className="sc-day-row" key={row[0]}>
              <strong>{row[0]}</strong>
              <button className={`sc-toggle ${row[1] ? "on" : ""}`} onClick={() => toggleDay(index)} aria-label={`Toggle ${row[0]}`}>
                <span />
              </button>
              <span className={row[1] ? "sc-available-text" : "sc-unavailable-text"}>{row[1] ? "Available" : "Unavailable"}</span>
              {row[1] && (
                <>
                  <input aria-label={`${row[0]} start`} defaultValue={row[2]} />
                  <b>–</b>
                  <input aria-label={`${row[0]} end`} defaultValue={row[3]} />
                </>
              )}
              <button className="sc-edit-day" aria-label={`Edit ${row[0]}`}>⌕</button>
            </div>
          ))}

          <button className="sc-add-availability">＋ Add availability</button>
        </section>

        <aside className="sc-panel sc-exceptions">
          <h2>Exceptions</h2>
          <p>Dates when your normal schedule changes</p>
          <div className="sc-calendar-head">
            <button>‹</button><strong>October 2026</strong><button>›</button>
          </div>
          <div className="sc-calendar">
            {["S","M","T","W","T","F","S"].map((d) => <b key={d}>{d}</b>)}
            {Array.from({ length: 31 }, (_, i) => <span className={i === 11 ? "unavailable" : i === 24 ? "modified" : ""} key={i}>{i + 1}</span>)}
          </div>
          <div className="sc-legend"><span>● Unavailable</span><span>● Modified hours</span></div>
          <hr />
          <strong>▣ 12 October</strong>
          <p>Unavailable all day</p>
          <div><button className="sc-link-btn">Edit</button> <button className="sc-danger-link">Remove</button></div>
          <button className="sc-add-exception">＋ Add exception for a date</button>
        </aside>
      </div>
    </div>
  );
}
