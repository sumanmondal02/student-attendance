import { useEffect, useState } from "react";
import { getAttendance, updateAttendance, deleteAttendance, todayStr } from "../api";

const STATUSES = ["Present", "Absent", "Late"];

export default function Records() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await getAttendance(filter || undefined);
      data.sort((a, b) => b.date.localeCompare(a.date) || a.rollNumber.localeCompare(b.rollNumber));
      setRecords(data);
      setError("");
    } catch {
      setError("Could not load records. Is the backend running?");
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const changeStatus = async (r, status) => {
    try {
      await updateAttendance(r.id, { ...r, status });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteAttendance(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>All Records</h2>
          <p className="muted">{records.length} entries. Change a status directly in the table.</p>
        </div>
        <div className="date-box">
          <label>Filter by date</label>
          <div className="row">
            <input type="date" value={filter} max={todayStr()} onChange={(e) => setFilter(e.target.value)} />
            {filter && <button className="btn ghost" onClick={() => setFilter("")}>Clear</button>}
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Roll No</th>
              <th>Name</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan="5" className="empty">No entries found</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.rollNumber}</td>
                  <td>{r.studentName}</td>
                  <td>
                    <select
                      className={`status-select ${r.status.toLowerCase()}`}
                      value={r.status}
                      onChange={(e) => changeStatus(r, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="right">
                    <button className="btn danger" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}