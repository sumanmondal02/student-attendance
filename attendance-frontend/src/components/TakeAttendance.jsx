import { useEffect, useMemo, useState } from "react";
import { getStudents, getAttendance, saveBulk, todayStr } from "../api";

const STATUSES = ["Present", "Absent", "Late"];

export default function TakeAttendance() {
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [savedRolls, setSavedRolls] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // {type, text}

  const load = async (d) => {
    try {
      const [studs, existing] = await Promise.all([getStudents(), getAttendance(d)]);
      const byRoll = Object.fromEntries(existing.map((r) => [r.rollNumber, r.status]));
      setStudents(studs);
      setStatuses(
        Object.fromEntries(studs.map((s) => [s.rollNumber, byRoll[s.rollNumber] ?? "Present"]))
      );
      setSavedRolls(new Set(Object.keys(byRoll)));
    } catch (e) {
      setMessage({ type: "error", text: "Could not load data. Is the backend running?" });
    }
  };

  useEffect(() => {
    load(date);
  }, [date]);

  const setOne = (roll, status) => setStatuses((p) => ({ ...p, [roll]: status }));

  const setAll = (status) =>
    setStatuses(Object.fromEntries(students.map((s) => [s.rollNumber, status])));

  const handleDateChange = (e) => {
    const v = e.target.value;
    if (!v) return;
    if (v > todayStr()) {
      setMessage({ type: "error", text: "Future dates are not allowed." });
      return;
    }
    setMessage(null);
    setDate(v);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveBulk(
        students.map((s) => ({
          rollNumber: s.rollNumber,
          studentName: s.name,
          date,
          status: statuses[s.rollNumber],
        }))
      );
      await load(date);
      setMessage({ type: "success", text: `Attendance saved for ${students.length} students.` });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const c = { Present: 0, Absent: 0, Late: 0 };
    Object.values(statuses).forEach((s) => (c[s] = (c[s] || 0) + 1));
    return c;
  }, [statuses]);

  const isToday = date === todayStr();
  const alreadySaved = students.length > 0 && students.every((s) => savedRolls.has(s.rollNumber));

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>{isToday ? "Today's Attendance" : "Attendance"}</h2>
          <p className="muted">
            {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
            {alreadySaved && <span className="pill saved">Already saved</span>}
          </p>
        </div>
        <div className="date-box">
          <label>Date</label>
          <input type="date" value={date} max={todayStr()} onChange={handleDateChange} />
        </div>
      </div>

      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      {students.length === 0 ? (
        <p className="empty">No students yet. Add them in the <b>Students</b> tab first.</p>
      ) : (
        <>
          <div className="toolbar">
            <div className="summary">
              <span className="chip present">Present {counts.Present}</span>
              <span className="chip absent">Absent {counts.Absent}</span>
              <span className="chip late">Late {counts.Late}</span>
            </div>
            <div className="bulk">
              <span className="muted">Mark all:</span>
              {STATUSES.map((s) => (
                <button key={s} className="btn ghost" onClick={() => setAll(s)}>{s}</button>
              ))}
            </div>
          </div>

          <ul className="student-list">
            {students.map((s) => (
              <li key={s.id} className="student-row">
                <div className="who">
                  <span className="avatar">{s.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="name">{s.name}</div>
                    <div className="muted small">{s.rollNumber}</div>
                  </div>
                </div>
                <div className="seg">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      className={`seg-btn ${st.toLowerCase()} ${
                        statuses[s.rollNumber] === st ? "on" : ""
                      }`}
                      onClick={() => setOne(s.rollNumber, st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="footer">
            <button className="btn primary big" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : alreadySaved ? "Update Attendance" : "Save Attendance"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}