const API = import.meta.env.VITE_API_URL || "/api";

export const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

async function handle(res) {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) msg = body.message;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

const json = (method, data) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

// Students
export const getStudents = () => fetch(`${API}/students`).then(handle);
export const addStudent = (s) => fetch(`${API}/students`, json("POST", s)).then(handle);
export const deleteStudent = (id) =>
  fetch(`${API}/students/${id}`, { method: "DELETE" }).then(handle);

// Attendance
export const getAttendance = (date) =>
  fetch(`${API}/attendance${date ? `?date=${date}` : ""}`).then(handle);
export const saveBulk = (entries) =>
  fetch(`${API}/attendance/bulk`, json("POST", entries)).then(handle);
export const updateAttendance = (id, data) =>
  fetch(`${API}/attendance/${id}`, json("PUT", data)).then(handle);
export const deleteAttendance = (id) =>
  fetch(`${API}/attendance/${id}`, { method: "DELETE" }).then(handle);
export const updateStudent = (id, data) =>
  fetch(`${API}/students/${id}`, json("PUT", data)).then(handle);