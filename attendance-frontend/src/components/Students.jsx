import { useEffect, useState } from "react";
import { getStudents, addStudent, deleteStudent } from "../api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [roll, setRoll] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setStudents(await getStudents());
    } catch {
      setError("Could not load students. Is the backend running?");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addStudent({ rollNumber: roll.trim(), name: name.trim() });
      setRoll("");
      setName("");
      setError("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Remove ${s.name} from the class list?`)) return;
    try {
      await deleteStudent(s.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Class List</h2>
          <p className="muted">{students.length} students. Add them once, then reuse every day.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="inline-form" onSubmit={handleAdd}>
        <input placeholder="Roll number" value={roll} onChange={(e) => setRoll(e.target.value)} required />
        <input placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn primary" type="submit">Add Student</button>
      </form>

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
            <button className="btn danger" onClick={() => handleDelete(s)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}