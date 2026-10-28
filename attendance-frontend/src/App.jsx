import { useState } from "react";
import TakeAttendance from "./components/TakeAttendance";
import Students from "./components/Students";
import Records from "./components/Records";
import SearchBar from "./components/SearchBar";
import "./App.css";

const TABS = [
  { id: "take", label: "Take Attendance" },
  { id: "students", label: "Students" },
  { id: "records", label: "Records" },
];

export default function App() {
  const [tab, setTab] = useState("take");
  const [version, setVersion] = useState(0); // bump to refresh the visible tab

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-top">
            <h1>Class Attendance ECM-A</h1>
            <SearchBar onDataChange={() => setVersion((v) => v + 1)} />
          </div>
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "tab active" : "tab"}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container">
        {tab === "take" && <TakeAttendance key={version} />}
        {tab === "students" && <Students key={version} />}
        {tab === "records" && <Records key={version} />}
      </main>
    </>
  );
}