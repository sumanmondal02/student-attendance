import { useEffect, useMemo, useRef, useState } from "react";
import { getStudents, getAttendance, updateAttendance, updateStudent } from "../api";

const STATUSES = ["Present", "Absent", "Late"];

export default function SearchBar({ onDataChange = () => {} }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const boxRef = useRef(null);

  const loadStudents = async () => {
    try {
      setStudents(await getStudents());
    } catch {
      /* the other tabs already show backend errors */
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Esc closes dropdown and popup
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSelected(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, students]);

  const pick = async (s) => {
    setSelected(s);
    setOpen(false);
    setQuery("");
    setEditingName(false);
    setLoading(true);
    setError("");
    try {
      const all = await getAttendance();
      setHistory(
        all
          .filter((r) => r.rollNumber === s.rollNumber)
          .sort((a, b) => b.date.localeCompare(a.date))
      );
    } catch {
      setHistory([]);
      setError("Could not load attendance.");
    } finally {
      setLoading(false);
    }
  };

  // change one date's status from inside the popup
  const changeStatus = async (r, status) => {
    try {
      const saved = await updateAttendance(r.id, { ...r, status });
      setHistory((h) => h.map((x) => (x.id === r.id ? saved : x)));
      setError("");
      onDataChange();
    } catch (e) {
      setError(e.message);
    }
  };

  // rename the student
  const saveName = async (e) => {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    try {
      const saved = await updateStudent(selected.id, { name });
      setSelected(saved);
      setEditingName(false);
      setError("");
      await loadStudents();
      onDataChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = useMemo(() => {
    const c = { Present: 0, Absent: 0, Late: 0 };
    history.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [history]);

  const percent = history.length
    ? Math.round(((counts.Present + counts.Late) / history.length) * 100)
    : 0;

  return (
    <>
      <div className="search" ref={boxRef}>
        <input
          type="text"
          placeholder="Search by name or roll no."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            loadStudents();
            setOpen(true);
          }}
        />

        {open && query.trim() && (
          <ul className="search-dropdown">
            {results.length === 0 ? (
              <li className="search-empty">No student found</li>
            ) : (
              results.map((s) => (
                <li key={s.id} className="search-item" onClick={() => pick(s)}>
                  <span className="avatar sm">{s.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="name">{s.name}</div>
                    <div className="muted small">{s.rollNumber}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>

            <div className="who profile">
              <span className="avatar big">{selected.name.charAt(0).toUpperCase()}</span>

              {editingName ? (
                <form className="name-edit" onSubmit={saveName}>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    autoFocus
                    required
                  />
                  <button className="btn primary" type="submit">Save</button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => setEditingName(false)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div>
                  <h2>
                    {selected.name}
                    <button
                      className="icon-btn"
                      title="Edit name"
                      onClick={() => {
                        setNameDraft(selected.name);
                        setEditingName(true);
                      }}
                    >
                      ✎
                    </button>
                  </h2>
                  <p className="muted">Roll no: {selected.rollNumber}</p>
                </div>
              )}
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="summary stats">
              <span className="chip present">Present {counts.Present}</span>
              <span className="chip absent">Absent {counts.Absent}</span>
              <span className="chip late">Late {counts.Late}</span>
              <span className="chip total">Attendance {percent}%</span>
            </div>

            <div className="history">
              {loading ? (
                <p className="empty">Loading...</p>
              ) : history.length === 0 ? (
                <p className="empty">No attendance recorded yet</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id}>
                        <td>
                          {new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", {
                            weekday: "short", day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                        <td>
                          <select
                            className={`status-select ${r.status.toLowerCase()}`}
                            value={r.status}
                            onChange={(e) => changeStatus(r, e.target.value)}
                          >
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}