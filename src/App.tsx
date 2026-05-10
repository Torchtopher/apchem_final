import { useState } from "react";
import { FlaskConical, Sparkles } from "lucide-react";
import { PyridineProblem } from "./problems/PyridineProblem";
import { WeakAcidProblem } from "./problems/WeakAcidProblem";
import { TitrationProblem } from "./problems/TitrationProblem";
import { FinalChallengeProblem } from "./problems/FinalChallengeProblem";

function App() {
  const [activeProblem, setActiveProblem] = useState(0);
  const [teacherMode, setTeacherMode] = useState(false);

  return (
    <main className="app-shell">
      <aside className="problem-rail" aria-label="Guided problems">
        <div className="brand">
          <FlaskConical size={28} />
          <div>
            <p>AP Chem Unit 8</p>
            <h1>Acid-Base Reasoning</h1>
          </div>
        </div>

        <button
          className={`problem-tab ${activeProblem === 0 ? "active" : ""}`}
          onClick={() => setActiveProblem(0)}
        >
          <span>1</span>
          <div>
            <strong>Pyridine buffer</strong>
            <small>H+ stress test</small>
          </div>
        </button>

        <button
          className={`problem-tab ${activeProblem === 1 ? "active" : ""}`}
          onClick={() => setActiveProblem(1)}
        >
          <span>2</span>
          <div>
            <strong>Weak acid</strong>
            <small>Equilibrium from scratch</small>
          </div>
        </button>

        <button
          className={`problem-tab ${activeProblem === 2 ? "active" : ""}`}
          onClick={() => setActiveProblem(2)}
        >
          <span>3</span>
          <div>
            <strong>Titration</strong>
            <small>Regions and methods</small>
          </div>
        </button>

        <button
          className={`problem-tab challenge-tab ${activeProblem === 3 ? "active" : ""}`}
          onClick={() => setActiveProblem(3)}
        >
          <span>4</span>
          <div>
            <strong>Final Challenge</strong>
            <small>Buffer rescue titration</small>
          </div>
        </button>

        <button
          className={`teacher-toggle ${teacherMode ? "active" : ""}`}
          onClick={() => setTeacherMode((current) => !current)}
          type="button"
          aria-pressed={teacherMode}
          title="Toggle teacher mode"
        >
          <Sparkles size={18} />
          <span>Teacher</span>
        </button>
      </aside>

      {activeProblem === 0 && <PyridineProblem teacherMode={teacherMode} />}
      {activeProblem === 1 && <WeakAcidProblem teacherMode={teacherMode} />}
      {activeProblem === 2 && <TitrationProblem teacherMode={teacherMode} />}
      {activeProblem === 3 && <FinalChallengeProblem teacherMode={teacherMode} />}
    </main>
  );
}

export default App;
