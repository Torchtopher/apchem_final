import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Beaker,
  Check,
  ChevronRight,
  FlaskConical,
  Lightbulb,
  Lock,
  RotateCcw,
  TestTube2,
} from "lucide-react";

type Choice = "lower" | "higher" | "same" | "";
type DataChoice = "none" | "pka" | "pkb" | "";
type Route = "shortcut" | "long" | "unset";
type IceField =
  | "initialHa"
  | "initialH"
  | "initialA"
  | "changeHa"
  | "changeH"
  | "changeA"
  | "equilibriumHa"
  | "equilibriumH"
  | "equilibriumA";

type BufferState = {
  py: number;
  pyH: number;
};

const initialBuffer: BufferState = {
  py: 0.56,
  pyH: 0.46,
};

const addedH = 0.308;
const pKaPyridinium = 5.25;
const pKbPyridine = 14 - pKaPyridinium;

const steps = [
  "Use moles because the reaction changes amounts of py and pyH+.",
  "Consume py with added H+: H+ + py -> pyH+.",
  "Find final moles of py and pyH+.",
  "Compare buffer ratios with Henderson-Hasselbalch.",
  "Report final pH minus initial pH.",
];

const correctStepOrder = [0, 1, 2, 3, 4];
const phaseLabels = [
  "Predict",
  "Choose data",
  "Plan math",
  "Animate",
  "Answer",
  "Reflect",
];

function afterAcidAddition(state: BufferState, acidMoles: number): BufferState {
  const consumed = Math.min(state.py, acidMoles);
  return {
    py: state.py - consumed,
    pyH: state.pyH + consumed,
  };
}

function ratio(state: BufferState) {
  return state.py / state.pyH;
}

function pHFromRatio(state: BufferState) {
  return pKaPyridinium + Math.log10(ratio(state));
}

function deltaPH(initial: BufferState, final: BufferState) {
  return Math.log10(ratio(final) / ratio(initial));
}

function isCloseToAnswer(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed - deltaAnswer) <= 0.04;
}

const finalBuffer = afterAcidAddition(initialBuffer, addedH);
const initialPH = pHFromRatio(initialBuffer);
const finalPH = pHFromRatio(finalBuffer);
const deltaAnswer = deltaPH(initialBuffer, finalBuffer);

function App() {
  const [activeProblem, setActiveProblem] = useState(0);

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
      </aside>

      {activeProblem === 0 && <PyridineProblem />}
      {activeProblem === 1 && <WeakAcidProblem />}
      {activeProblem === 2 && <TitrationProblem />}
    </main>
  );
}

function PyridineProblem() {
  const guideRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const [prediction, setPrediction] = useState<Choice>("");
  const [magnitude, setMagnitude] = useState("");
  const [predictionReason, setPredictionReason] = useState("");
  const [dataChoice, setDataChoice] = useState<DataChoice>("");
  const [route, setRoute] = useState<Route>("unset");
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [acidAdded, setAcidAdded] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [reflection, setReflection] = useState("");
  const [revealed, setRevealed] = useState(false);

  const orderedCorrectly = selectedSteps.every(
    (step, index) => step === correctStepOrder[index],
  );
  const stepsComplete =
    selectedSteps.length === correctStepOrder.length && orderedCorrectly;
  const answerCorrect = isCloseToAnswer(finalAnswer);

  const progress = useMemo(() => {
    if (phase >= 5) return 100;
    return Math.round((phase / 5) * 100);
  }, [phase]);

  useEffect(() => {
    guideRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function reset() {
    setPhase(0);
    setPrediction("");
    setMagnitude("");
    setPredictionReason("");
    setDataChoice("");
    setRoute("unset");
    setSelectedSteps([]);
    setAcidAdded(false);
    setFinalAnswer("");
    setReflection("");
    setRevealed(false);
  }

  function chooseStep(index: number) {
    if (selectedSteps.includes(index)) return;
    setSelectedSteps((current) => [...current, index]);
  }

  function handleDataContinue() {
    if (dataChoice === "none") {
      setRoute("shortcut");
    } else {
      setRoute("long");
    }
    setPhase(2);
  }

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Guided problem 1</p>
          <h2>What happens when strong acid hits a pyridine buffer?</h2>
        </div>
        <button className="icon-button" onClick={reset} title="Reset problem">
          <RotateCcw size={18} />
        </button>
      </header>

      <div
        className="progress-track"
        role="progressbar"
        aria-label={`Step ${phase + 1} of ${phaseLabels.length}: ${phaseLabels[phase]}`}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <ol className="phase-steps" aria-label="Problem steps">
        {phaseLabels.map((label, index) => (
          <li
            key={label}
            className={
              index === phase ? "current" : index < phase ? "complete" : ""
            }
            aria-current={index === phase ? "step" : undefined}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="lab-grid">
        <section
          className={`visual-panel ${phase === 3 ? "show-visual" : ""}`}
          aria-label={
            acidAdded
              ? "After acid addition: 0.252 mol py and 0.768 mol pyH plus."
              : "Before acid addition: 0.560 mol py and 0.460 mol pyH plus."
          }
        >
          <BeakerScene acidAdded={acidAdded} showCue={phase === 3} />
          {phase === 3 && acidAdded && (
            <>
              <PHRuler
                acidAdded={acidAdded}
                route={route}
                constantsEarned={phase >= 2}
                summaryVisible={phase >= 5}
              />
              <SpeciesCounters acidAdded={acidAdded} />
            </>
          )}
        </section>

        <section
          className="guide-panel"
          ref={guideRef}
          tabIndex={-1}
          aria-live="polite"
          aria-label={`Current step: ${phaseLabels[phase]}`}
        >
          <FocusCue phase={phase} acidAdded={acidAdded} />
          {phase === 0 && (
            <ProblemIntro
              prediction={prediction}
              setPrediction={setPrediction}
              magnitude={magnitude}
              setMagnitude={setMagnitude}
              predictionReason={predictionReason}
              setPredictionReason={setPredictionReason}
              onContinue={() => setPhase(1)}
            />
          )}

          {phase === 1 && (
            <DataDecision
              dataChoice={dataChoice}
              setDataChoice={setDataChoice}
              predictionReason={predictionReason}
              onContinue={handleDataContinue}
            />
          )}

          {phase === 2 && (
            <CalculationPath
              route={route}
              dataChoice={dataChoice}
              selectedSteps={selectedSteps}
              orderedCorrectly={orderedCorrectly}
              stepsComplete={stepsComplete}
              onChooseStep={chooseStep}
              onUndo={() =>
                setSelectedSteps((current) => current.slice(0, -1))
              }
              onClear={() => setSelectedSteps([])}
              onContinue={() => setPhase(3)}
            />
          )}

          {phase === 3 && (
            <AddAcidStep
              acidAdded={acidAdded}
              onAdd={() => setAcidAdded(true)}
              onContinue={() => setPhase(4)}
            />
          )}

          {phase === 4 && (
            <AnswerStep
              finalAnswer={finalAnswer}
              setFinalAnswer={setFinalAnswer}
              answerCorrect={answerCorrect}
              revealed={revealed}
              setRevealed={setRevealed}
              onContinue={() => setPhase(5)}
            />
          )}

          {phase === 5 && (
            <SummaryStep
              prediction={prediction}
              magnitude={magnitude}
              predictionReason={predictionReason}
              reflection={reflection}
              setReflection={setReflection}
              onRestart={reset}
            />
          )}
        </section>
      </div>
    </section>
  );
}

function FocusCue({ phase, acidAdded }: { phase: number; acidAdded: boolean }) {
  const messages = [
    "Start here: make a prediction before doing any math.",
    "Look here: decide what data is actually needed.",
    "Look here: build the legal calculation order.",
    acidAdded
      ? "Now look left: the particle counts and pH ruler changed."
      : "Click Add H+, then watch the beaker and counters.",
    "Look here: use the ratio comparison to choose the sign.",
    "Look here: compare your explanation to the three views.",
  ];

  return (
    <div className="focus-cue" role="status" aria-live="polite">
      <span aria-hidden="true">-&gt;</span>
      <p>{messages[phase]}</p>
    </div>
  );
}

function ProblemIntro({
  prediction,
  setPrediction,
  magnitude,
  setMagnitude,
  predictionReason,
  setPredictionReason,
  onContinue,
}: {
  prediction: Choice;
  setPrediction: (choice: Choice) => void;
  magnitude: string;
  setMagnitude: (value: string) => void;
  predictionReason: string;
  setPredictionReason: (value: string) => void;
  onContinue: () => void;
}) {
  const [showComparison, setShowComparison] = useState(false);
  const ready = prediction && magnitude && predictionReason.trim().length > 8;

  return (
    <div className="step-card">
      <p className="eyebrow">Observe and predict</p>
      <h3>Calculate the change in pH.</h3>
      <p className="problem-text">
        <span className="chem-token hplus">0.308 mol H+</span> is added to{" "}
        <span className="chem-token volume">1.00 L</span> of a buffer
        containing <span className="chem-token py">0.560 M pyridine, py</span>{" "}
        and <span className="chem-token pyh">0.460 M pyridinium, pyH+</span>.
      </p>

      <fieldset>
        <legend>Before calculating, what should happen to pH?</legend>
        <div className="segmented">
          {[
            ["lower", "Lower"],
            ["higher", "Higher"],
            ["same", "About same"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={prediction === value ? "selected" : ""}
              aria-pressed={prediction === value}
              onClick={() => setPrediction(value as Choice)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label>
        Estimate the size of the change.
        <select
          value={magnitude}
          onChange={(event) => setMagnitude(event.target.value)}
        >
          <option value="">Choose one</option>
          <option value="tiny">Tiny: less than 0.1 pH unit</option>
          <option value="moderate">Moderate: about half a pH unit</option>
          <option value="huge">Huge: several pH units</option>
        </select>
      </label>

      <label>
        Write your chemical reason.
        <textarea
          value={predictionReason}
          onChange={(event) => setPredictionReason(event.target.value)}
          placeholder="Example: H+ should react with the base part of the buffer..."
        />
      </label>

      {showComparison && (
        <ModelChecklist
          title="Compare your prediction"
          items={[
            "pH should decrease because acid is added.",
            "The buffer resists the change because py consumes added H+.",
            "The ratio py / pyH+ gets smaller, so pH falls.",
          ]}
        />
      )}

      {!showComparison ? (
        <button
          className="primary-action"
          disabled={!ready}
          onClick={() => setShowComparison(true)}
        >
          Compare with model reasoning <ChevronRight size={18} />
        </button>
      ) : (
        <button className="primary-action" onClick={onContinue}>
          Continue <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function DataDecision({
  dataChoice,
  setDataChoice,
  predictionReason,
  onContinue,
}: {
  dataChoice: DataChoice;
  setDataChoice: (choice: DataChoice) => void;
  predictionReason: string;
  onContinue: () => void;
}) {
  return (
    <div className="step-card">
      <p className="eyebrow">Choose the data</p>
      <h3>Do you need pKa or pKb to find the change?</h3>
      <p>
        Henderson-Hasselbalch uses pKa for actual pH values. But this prompt asks
        for final pH minus initial pH, so the constant may cancel if you compare
        ratios directly.
      </p>

      <div className="choice-stack">
        {[
          ["none", "No constant is needed for delta pH"],
          ["pka", "pKa of pyH+ is needed"],
          ["pkb", "pKb of py is needed"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={dataChoice === value ? "selected choice" : "choice"}
            aria-pressed={dataChoice === value}
            onClick={() => setDataChoice(value as DataChoice)}
          >
            {label}
          </button>
        ))}
      </div>

      {dataChoice && (
        <div className="feedback" role="status" aria-live="polite">
          <Lightbulb size={18} />
          {dataChoice === "none" ? (
            <p>
              Good route. Since both pH expressions contain the same pKa, the
              change can come from the ratio shift alone.
            </p>
          ) : dataChoice === "pka" ? (
            <p>
              That route works too, but it takes longer. We will reveal{" "}
              <code>pKa = 5.25</code>, compute both pH values, then subtract.
            </p>
          ) : (
            <p>
              You can use <code>pKb</code>, but Henderson-Hasselbalch needs the
              conjugate acid <code>pKa</code>. We will convert with{" "}
              <code>pKa + pKb = 14</code>, then compute both pH values.
            </p>
          )}
        </div>
      )}

      {predictionReason && (
        <p className="student-note">Your earlier reason: {predictionReason}</p>
      )}

      <button
        className="primary-action"
        disabled={!dataChoice}
        onClick={onContinue}
      >
        Continue <ChevronRight size={18} />
      </button>
    </div>
  );
}

function CalculationPath({
  route,
  dataChoice,
  selectedSteps,
  orderedCorrectly,
  stepsComplete,
  onChooseStep,
  onUndo,
  onClear,
  onContinue,
}: {
  route: Route;
  dataChoice: DataChoice;
  selectedSteps: number[];
  orderedCorrectly: boolean;
  stepsComplete: boolean;
  onChooseStep: (index: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onContinue: () => void;
}) {
  const nextStepNumber = selectedSteps.length + 1;
  const expectedNext = steps[correctStepOrder[selectedSteps.length]];

  return (
    <div className="step-card">
      <p className="eyebrow">Symbolic reasoning</p>
      <h3>Put the calculation moves in order.</h3>
      <p>
        {route === "shortcut"
          ? "Shortcut path: compare the buffer ratio before and after acid is consumed."
          : dataChoice === "pkb"
            ? "Long path: convert pKb to pKa, compute initial and final pH, then subtract."
            : "Long path: compute initial and final pH with pKa, then subtract."}
      </p>

      <div className="next-step-card">
        <span>Next target</span>
        <strong>Step {Math.min(nextStepNumber, steps.length)}</strong>
        <p>
          {stepsComplete
            ? "The plan is complete. Now connect the math to the particle view."
            : expectedNext}
        </p>
      </div>

      <div className="step-bank">
        {steps.map((step, index) => (
          <button
            key={step}
            disabled={selectedSteps.includes(index)}
            onClick={() => onChooseStep(index)}
          >
            {step}
          </button>
        ))}
      </div>

      <div className="ordered-steps">
        {selectedSteps.length === 0 ? (
          <p>Choose the first move.</p>
        ) : (
          selectedSteps.map((stepIndex, index) => (
            <div key={`${stepIndex}-${index}`} className="ordered-step">
              <span>{index + 1}</span>
              <p>{steps[stepIndex]}</p>
            </div>
          ))
        )}
      </div>

      {selectedSteps.length > 0 && !orderedCorrectly && (
        <div className="feedback warning" role="status" aria-live="polite">
          <Lightbulb size={18} />
          <p>
            Start with moles, then reaction stoichiometry. Henderson-Hasselbalch
            comes after the buffer amounts are updated.
          </p>
        </div>
      )}

      {stepsComplete && <MoleLedger revealed={stepsComplete} />}

      {stepsComplete && <RatioComparison route={route} />}

      {stepsComplete && (
      <div className="math-panel">
        <strong>{stepsComplete ? "Worked values" : "Values unlock after the order is correct"}</strong>
        {stepsComplete ? (
          <>
            <p>
              <code>py: 0.560 - 0.308 = 0.252 mol</code>
              <br />
              <code>pyH+: 0.460 + 0.308 = 0.768 mol</code>
            </p>
            {dataChoice === "pkb" && (
              <p>
                <code>pKb(py) = {pKbPyridine.toFixed(2)}</code>
                <br />
                <code>pKa(pyH+) = 14.00 - {pKbPyridine.toFixed(2)} = 5.25</code>
              </p>
            )}
          </>
        ) : (
          <p>
            First decide the legal order: amount bookkeeping before pH math.
          </p>
        )}
        {stepsComplete && route === "shortcut" && (
          <p>
            <code>
              delta pH = log((0.252 / 0.768) / (0.560 / 0.460)) ={" "}
              {deltaAnswer.toFixed(2)}
            </code>
          </p>
        )}
        {stepsComplete && route !== "shortcut" && (
          <p>
            <code>
              pH_i = 5.25 + log(0.560 / 0.460) = {initialPH.toFixed(2)}
            </code>
            <br />
            <code>
              pH_f = 5.25 + log(0.252 / 0.768) = {finalPH.toFixed(2)}
            </code>
          </p>
        )}
      </div>
      )}

      <div className="button-row">
        <button
          className="secondary-action"
          disabled={selectedSteps.length === 0}
          onClick={onUndo}
        >
          Undo last
        </button>
        <button className="secondary-action" onClick={onClear}>
          Clear order
        </button>
        <button
          className="primary-action"
          disabled={!stepsComplete}
          onClick={onContinue}
        >
          Animate it <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function AddAcidStep({
  acidAdded,
  onAdd,
  onContinue,
}: {
  acidAdded: boolean;
  onAdd: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="step-card">
      <p className="eyebrow">Submicroscopic view</p>
      <h3>Now make the reaction visible.</h3>
      <p>
        Added <code>H+</code> does not stay free for long. It reacts with
        pyridine, the base member of the buffer pair, producing more{" "}
        <code>pyH+</code>.
      </p>

      <div className="reaction-strip">
        <span>H+</span>
        <strong>+</strong>
        <span>py</span>
        <ArrowRight size={18} />
        <span>pyH+</span>
      </div>

      <button className="add-acid" disabled={acidAdded} onClick={onAdd}>
        <TestTube2 size={20} />
        Add 0.308 mol H+
      </button>

      {acidAdded && (
        <div className="feedback success" role="status" aria-live="polite">
          <Check size={18} />
          <p>The buffer base was consumed. The conjugate acid amount increased.</p>
        </div>
      )}

      <button
        className="primary-action"
        disabled={!acidAdded}
        onClick={onContinue}
      >
        Final answer <ChevronRight size={18} />
      </button>
    </div>
  );
}

function AnswerStep({
  finalAnswer,
  setFinalAnswer,
  answerCorrect,
  revealed,
  setRevealed,
  onContinue,
}: {
  finalAnswer: string;
  setFinalAnswer: (value: string) => void;
  answerCorrect: boolean;
  revealed: boolean;
  setRevealed: (value: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="step-card">
      <p className="eyebrow">Final calculation</p>
      <h3>Enter final pH change.</h3>

      <RatioComparison route="shortcut" />

      <div className="coach-card">
        <strong>Before typing, check the sign.</strong>
        <p>
          The final ratio is smaller than the initial ratio, so{" "}
          <code>log(final ratio / initial ratio)</code> must be negative.
        </p>
      </div>

      <label>
        <code>delta pH = final pH - initial pH</code>
        <input
          value={finalAnswer}
          onChange={(event) => setFinalAnswer(event.target.value)}
          placeholder="-0.57"
          inputMode="decimal"
        />
      </label>

      {finalAnswer && (
        <div
          className={`feedback ${answerCorrect ? "success" : "warning"}`}
          role="status"
          aria-live="polite"
        >
          {answerCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
          <p>
            {answerCorrect
              ? "That matches the ratio change. The answer is negative because pH decreased."
              : "Check the sign and make sure you divided final ratio by initial ratio."}
          </p>
        </div>
      )}

      {revealed && (
        <div className="math-panel">
          <strong>Model answer</strong>
          <p>
            <code>
              delta pH = log((0.252 / 0.768) / (0.560 / 0.460)) ={" "}
              {deltaAnswer.toFixed(2)}
            </code>
          </p>
        </div>
      )}

      <div className="button-row">
        <button
          className="secondary-action"
          disabled={!finalAnswer}
          onClick={() => setRevealed(true)}
        >
          Reveal after attempt
        </button>
        <button
          className="primary-action"
          disabled={!answerCorrect && !revealed}
          onClick={onContinue}
        >
          Summarize <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function SummaryStep({
  prediction,
  magnitude,
  predictionReason,
  reflection,
  setReflection,
  onRestart,
}: {
  prediction: Choice;
  magnitude: string;
  predictionReason: string;
  reflection: string;
  setReflection: (value: string) => void;
  onRestart: () => void;
}) {
  return (
    <div className="step-card">
      <p className="eyebrow">Compare and reflect</p>
      <h3>The buffer resisted the acid, but pH still fell.</h3>

      <div className="summary-grid">
        <div>
          <strong>Your prediction</strong>
          <p>
            pH: {prediction || "not selected"}; size: {magnitude || "not set"}
          </p>
        </div>
        <div>
          <strong>Calculated result</strong>
          <p>
            <code>delta pH = {deltaAnswer.toFixed(2)}</code>
          </p>
        </div>
      </div>

      <p className="student-note">Your reason: {predictionReason}</p>

      <ModelChecklist
        title="Johnstone triplet check"
        items={[
          "Macroscopic: adding strong acid lowers pH.",
          "Submicroscopic: H+ converts py into pyH+.",
          "Symbolic: the py / pyH+ ratio decreases, so Henderson-Hasselbalch predicts a lower pH.",
        ]}
      />

      <label>
        Write one sentence you would change or add after seeing the model.
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="Now I would mention..."
        />
      </label>

      <button className="secondary-action" onClick={onRestart}>
        Try again
      </button>
    </div>
  );
}

function ModelChecklist({
  items,
  title = "Model reasoning checklist",
}: {
  items: string[];
  title?: string;
}) {
  return (
    <div className="checklist">
      <strong>{title}</strong>
      {items.map((item) => (
        <label key={item}>
          <input type="checkbox" />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function MoleLedger({ revealed }: { revealed: boolean }) {
  return (
    <div className="ledger" aria-label="Stoichiometry mole ledger">
      <strong>Mole ledger</strong>
      <div className="ledger-grid">
        <span />
        <span>py</span>
        <span>H+</span>
        <span>pyH+</span>
        <span>Start</span>
        <code className="ledger-py">0.560</code>
        <code className="ledger-hplus">0.308</code>
        <code className="ledger-pyh">0.460</code>
        <span>React</span>
        <code className="ledger-py">{revealed ? "-0.308" : "?"}</code>
        <code className="ledger-hplus">{revealed ? "-0.308" : "?"}</code>
        <code className="ledger-pyh">{revealed ? "+0.308" : "?"}</code>
        <span>After</span>
        <code className="ledger-py">{revealed ? "0.252" : "locked"}</code>
        <code className="ledger-hplus">{revealed ? "0.000" : "locked"}</code>
        <code className="ledger-pyh">{revealed ? "0.768" : "locked"}</code>
      </div>
      <p>
        The added acid is smaller than the available <code>py</code>, so the
        buffer is stressed but not exhausted.
      </p>
    </div>
  );
}

function InteractiveIceTable({
  values,
  checked,
  onChange,
}: {
  values: Record<IceField, string>;
  checked: boolean;
  onChange: (field: IceField, value: string) => void;
}) {
  const rows: Array<[string, IceField, IceField, IceField]> = [
    ["Initial", "initialHa", "initialH", "initialA"],
    ["Change", "changeHa", "changeH", "changeA"],
    ["Equil.", "equilibriumHa", "equilibriumH", "equilibriumA"],
  ];

  return (
    <div className="ledger interactive-ice" aria-label="Editable ICE table">
      <strong>HA ⇌ H+ + A-</strong>
      <div className="ice-grid">
        <span />
        <span>HA</span>
        <span>H+</span>
        <span>A-</span>
        {rows.map(([label, haField, hField, aField]) => (
          <FragmentedIceRow
            key={label}
            label={label}
            fields={[haField, hField, aField]}
            values={values}
            checked={checked}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function FragmentedIceRow({
  label,
  fields,
  values,
  checked,
  onChange,
}: {
  label: string;
  fields: [IceField, IceField, IceField];
  values: Record<IceField, string>;
  checked: boolean;
  onChange: (field: IceField, value: string) => void;
}) {
  return (
    <>
      <span>{label}</span>
      {fields.map((field) => {
        const correct = iceFieldIsCorrect(field, values[field]);
        return (
          <input
            key={field}
            className={checked ? (correct ? "correct" : "incorrect") : ""}
            value={values[field]}
            onChange={(event) => onChange(field, event.target.value)}
            aria-label={`${label} ${field}`}
            autoCapitalize="none"
            spellCheck={false}
          />
        );
      })}
    </>
  );
}

function RatioComparison({ route }: { route: Route }) {
  return (
    <div className="ratio-panel">
      <div className="known-py">
        <span>Initial buffer ratio</span>
        <strong>py / pyH+ = 0.560 / 0.460 = 1.22</strong>
      </div>
      <ArrowRight size={18} />
      <div className="known-pyh">
        <span>Final buffer ratio</span>
        <strong>py / pyH+ = 0.252 / 0.768 = 0.33</strong>
      </div>
      <p>
        {route === "shortcut"
          ? "Because pKa appears in both pH expressions, the pH change comes from this ratio drop."
          : "The same ratio drop appears inside both Henderson-Hasselbalch pH calculations."}
      </p>
    </div>
  );
}

function BeakerScene({
  acidAdded,
  showCue,
}: {
  acidAdded: boolean;
  showCue: boolean;
}) {
  const particles = useMemo(() => {
    const baseParticles = Array.from({ length: acidAdded ? 9 : 20 }, (_, i) => ({
      kind: "py",
      x: (i * 23 + 14) % 88,
      y: (i * 31 + 18) % 76,
    }));
    const acidParticles = Array.from({ length: acidAdded ? 26 : 15 }, (_, i) => ({
      kind: "pyH+",
      x: (i * 29 + 8) % 86,
      y: (i * 17 + 10) % 78,
    }));
    const incoming = acidAdded
      ? []
      : Array.from({ length: 8 }, (_, i) => ({
          kind: "H+",
          x: 18 + i * 7,
          y: 8 + (i % 3) * 7,
        }));
    return [...baseParticles, ...acidParticles, ...incoming];
  }, [acidAdded]);

  return (
    <div className={`beaker-card ${showCue ? "look-target" : ""}`}>
      {showCue && (
        <div className="visual-cue">
          <span aria-hidden="true">-&gt;</span>
          Watch particles change
        </div>
      )}
      <div className="beaker-top">
        <span className="electrode negative">-</span>
        <span className="bulb" />
        <span className="electrode positive">+</span>
      </div>
      <div className="beaker">
        <div className={`acid-stream ${acidAdded ? "done" : ""}`} />
        <div className="magnifier">
          {particles.map((particle, index) => (
            <span
              key={`${particle.kind}-${index}`}
              className={`particle ${particle.kind.replace("+", "plus")}`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${index * 0.04}s`,
              }}
            >
              {particle.kind}
            </span>
          ))}
        </div>
      </div>
      <div className="reaction-caption">
        <span>H+</span> + <span>py</span> <ArrowRight size={16} />{" "}
        <span>pyH+</span>
      </div>
    </div>
  );
}

function PHRuler({
  acidAdded,
  route,
  constantsEarned,
  summaryVisible,
}: {
  acidAdded: boolean;
  route: Route;
  constantsEarned: boolean;
  summaryVisible: boolean;
}) {
  const marker = acidAdded ? finalPH : initialPH;
  const percent = ((marker - 4) / 3) * 100;
  const showConstants = (constantsEarned && route === "long") || summaryVisible;

  return (
    <div className="ruler-card">
      <div>
        <strong>pH / pKa ruler</strong>
        <p>
          {showConstants
            ? "pKa(pyH+) = 5.25 anchors the full pH values."
            : "For delta pH, watch the marker move before revealing constants."}
        </p>
      </div>
      <div className="ruler">
        <span style={{ left: "0%" }}>4</span>
        {showConstants && <span style={{ left: "41.6%" }}>pKa 5.25</span>}
        <span style={{ left: "100%" }}>7</span>
        <i style={{ left: `${percent}%` }} />
      </div>
      <div className="readout">
        <span>{showConstants ? `Initial pH ${initialPH.toFixed(2)}` : "Initial position"}</span>
        <span>
          {acidAdded
            ? showConstants
              ? `Final pH ${finalPH.toFixed(2)}`
              : `Moved ${Math.abs(deltaAnswer).toFixed(2)} pH units lower`
            : "Final position --"}
        </span>
      </div>
    </div>
  );
}

function SpeciesCounters({ acidAdded }: { acidAdded: boolean }) {
  const state = acidAdded ? finalBuffer : initialBuffer;

  return (
    <div className="counter-grid">
      <Counter label="py" value={state.py} color="blue" />
      <Counter label="pyH+" value={state.pyH} color="orange" />
      <Counter label="H+ added" value={acidAdded ? addedH : 0} color="pink" />
    </div>
  );
}

function Counter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "orange" | "pink";
}) {
  return (
    <div className={`counter ${color}`}>
      <span>{label}</span>
      <strong>{value.toFixed(3)} mol</strong>
    </div>
  );
}

const aceticKa = 1.8e-5;
const aceticPka = -Math.log10(aceticKa);
const weakAcidH = (-aceticKa + Math.sqrt(aceticKa * aceticKa + 4 * aceticKa * 0.1)) / 2;
const weakAcidPH = -Math.log10(weakAcidH);
const weakAcidPercent = (weakAcidH / 0.1) * 100;
const weakAcidCalculationSteps = [
  "Substitute the ICE row into Ka: Ka = x^2 / (0.100 - x).",
  "Rearrange so the equation equals zero: x^2 + Ka*x - Ka(0.100) = 0.",
  "Solve the quadratic and keep the positive root because x is [H+].",
  "Convert concentration to pH with pH = -log[H+].",
];
const correctWeakAcidCalculationOrder = [0, 1, 2, 3];
const emptyIceTable: Record<IceField, string> = {
  initialHa: "",
  initialH: "",
  initialA: "",
  changeHa: "",
  changeH: "",
  changeA: "",
  equilibriumHa: "",
  equilibriumH: "",
  equilibriumA: "",
};

function normalizeIceValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/−/g, "-");
}

function iceFieldIsCorrect(field: IceField, value: string) {
  const normalized = normalizeIceValue(value);
  const acceptable: Record<IceField, string[]> = {
    initialHa: ["0.100", ".100", "0.1"],
    initialH: ["0", "0.000"],
    initialA: ["0", "0.000"],
    changeHa: ["-x"],
    changeH: ["+x", "x"],
    changeA: ["+x", "x"],
    equilibriumHa: ["0.100-x", ".100-x", "0.1-x"],
    equilibriumH: ["x"],
    equilibriumA: ["x"],
  };

  return acceptable[field].includes(normalized);
}

function iceTableIsCorrect(values: Record<IceField, string>) {
  return (Object.keys(values) as IceField[]).every((field) =>
    iceFieldIsCorrect(field, values[field]),
  );
}

function orderMatches(selected: number[], correct: number[]) {
  return selected.every((step, index) => step === correct[index]);
}

function WeakAcidProblem() {
  const guideRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [breakApart, setBreakApart] = useState("");
  const [predictionChecked, setPredictionChecked] = useState(false);
  const [largeSpecies, setLargeSpecies] = useState("");
  const [largeSpeciesChecked, setLargeSpeciesChecked] = useState(false);
  const [iceValues, setIceValues] =
    useState<Record<IceField, string>>(emptyIceTable);
  const [iceChecked, setIceChecked] = useState(false);
  const [calculationOrder, setCalculationOrder] = useState<number[]>([]);
  const [calculationOrderChecked, setCalculationOrderChecked] = useState(false);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  const progress = Math.round((phase / 3) * 100);
  const predictionCorrect =
    prediction === "closer to 1" && breakApart === "No, only partly";
  const iceCorrect = iceTableIsCorrect(iceValues);
  const calculationOrderCorrect =
    calculationOrder.length === correctWeakAcidCalculationOrder.length &&
    orderMatches(calculationOrder, correctWeakAcidCalculationOrder);
  const answerCorrect = Math.abs(Number(answer) - weakAcidPH) <= 0.04;

  useEffect(() => {
    guideRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function reset() {
    setPhase(0);
    setPrediction("");
    setBreakApart("");
    setPredictionChecked(false);
    setLargeSpecies("");
    setLargeSpeciesChecked(false);
    setIceValues(emptyIceTable);
    setIceChecked(false);
    setCalculationOrder([]);
    setCalculationOrderChecked(false);
    setAnswer("");
    setRevealed(false);
  }

  function updateIceField(field: IceField, value: string) {
    setIceValues((current) => ({ ...current, [field]: value }));
    setIceChecked(false);
  }

  function chooseCalculationStep(index: number) {
    if (calculationOrder.includes(index)) return;
    setCalculationOrder((current) => [...current, index]);
    setCalculationOrderChecked(false);
  }

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Guided problem 2</p>
          <h2>Weak acid equilibrium from scratch</h2>
        </div>
        <button className="icon-button" onClick={reset} title="Reset problem">
          <RotateCcw size={18} />
        </button>
      </header>
      <Progress value={progress} label={`Step ${phase + 1} of 4`} />

      <div className={`lab-grid ${phase === 1 ? "has-visual" : ""}`}>
        <section className={`visual-panel ${phase === 1 ? "show-visual" : ""}`}>
          <WeakAcidVisual ionized={phase === 1} />
        </section>
        <section
          className="guide-panel"
          ref={guideRef}
          tabIndex={-1}
          aria-live="polite"
          aria-label="Weak acid guided step"
        >
          <div className="focus-cue">
            <span aria-hidden="true">-&gt;</span>
            <p>
              {phase === 0 && "Start here: predict before using Ka."}
              {phase === 1 && "Watch the particles: weak means only a few split."}
              {phase === 2 && "Now use ICE because equilibrium creates x."}
              {phase === 3 && "Finish here: pH comes from [H+]."}
            </p>
          </div>

          {phase === 0 && (
            <div className="step-card">
              <p className="eyebrow">Predict</p>
              <h3>0.100 M acetic acid has Ka = 1.8 x 10^-5. Calculate pH.</h3>
              <p className="problem-text">
                <span className="chem-token py">HC2H3O2 is acetic acid</span>.
                When it donates <span className="chem-token hplus">H+</span>,
                the leftover ion is{" "}
                <span className="chem-token pyh">C2H3O2-, acetate</span>.
              </p>
              <p className="coach-card">
                Think of it as <code>HA ⇌ H+ + A-</code>. Here{" "}
                <code>HA = HC2H3O2</code> and <code>A- = C2H3O2-</code>.
                We start with <code>0.100 M HA</code> and almost no ions.
              </p>
              <fieldset>
                <legend>Will the pH be closer to 1 or 7?</legend>
                <div className="segmented">
                  {["closer to 1", "closer to 7"].map((choice) => (
                    <button
                      key={choice}
                      aria-pressed={prediction === choice}
                      className={prediction === choice ? "selected" : ""}
                      onClick={() => {
                        setPrediction(choice);
                        setPredictionChecked(false);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Does a weak acid fully break apart?</legend>
                <div className="segmented">
                  {["No, only partly", "Yes, completely"].map((choice) => (
                    <button
                      key={choice}
                      aria-pressed={breakApart === choice}
                      className={breakApart === choice ? "selected" : ""}
                      onClick={() => {
                        setBreakApart(choice);
                        setPredictionChecked(false);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </fieldset>
              {predictionChecked && (
                <div
                  className={`feedback ${predictionCorrect ? "success" : "warning"}`}
                  role="status"
                  aria-live="polite"
                >
                  {predictionCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
                  <p>
                    {predictionCorrect
                      ? "Correct. A 0.100 M weak acid is acidic, but only a small fraction ionizes."
                      : prediction !== "closer to 1"
                        ? "Hint: even a weak acid solution is still acidic. Its pH is below 7, and this one is much closer to 1 than to neutral."
                        : "Hint: weak acids establish equilibrium. Most HA remains intact instead of fully becoming H+ and A-."}
                  </p>
                </div>
              )}
              <div className="button-row">
                <button
                  className="secondary-action"
                  disabled={!prediction || !breakApart}
                  onClick={() => setPredictionChecked(true)}
                >
                  Check prediction
                </button>
                <button
                  className="primary-action"
                  disabled={!predictionChecked || !predictionCorrect}
                  onClick={() => setPhase(1)}
                >
                  Show equilibrium <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {phase === 1 && (
            <div className="step-card">
              <p className="eyebrow">Particle view</p>
              <h3>Most molecules stay as HA.</h3>
              <p>
                Acetic acid is weak: equilibrium forms some <code>H+</code> and{" "}
                <code>A-</code>, but the beaker is still mostly undissociated{" "}
                <code>HA</code>.
              </p>
              <fieldset>
                <legend>Which concentration is large at equilibrium?</legend>
                <div className="segmented">
                  {["HA", "A-", "H+"].map((choice) => (
                    <button
                      key={choice}
                      aria-pressed={largeSpecies === choice}
                      className={largeSpecies === choice ? "selected" : ""}
                      onClick={() => {
                        setLargeSpecies(choice);
                        setLargeSpeciesChecked(false);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </fieldset>
              {largeSpeciesChecked && (
                <div
                  className={`feedback ${largeSpecies === "HA" ? "success" : "warning"}`}
                  role="status"
                  aria-live="polite"
                >
                  {largeSpecies === "HA" ? <Check size={18} /> : <Lightbulb size={18} />}
                  <p>
                    {largeSpecies === "HA"
                      ? "Correct. The equilibrium lies mostly on the reactant side."
                      : "Hint: weak acid means only a small fraction ionizes, so the original HA remains the dominant species."}
                  </p>
                </div>
              )}
              <div className="button-row">
                <button
                  className="secondary-action"
                  disabled={!largeSpecies}
                  onClick={() => setLargeSpeciesChecked(true)}
                >
                  Check species
                </button>
                <button
                  className="primary-action"
                  disabled={!largeSpeciesChecked || largeSpecies !== "HA"}
                  onClick={() => setPhase(2)}
                >
                  Build ICE table <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {phase === 2 && (
            <div className="step-card">
              <p className="eyebrow">ICE table</p>
              <h3>Use x for the amount that ionizes.</h3>
              <p>
                Fill each concentration box for <code>HA ⇌ H+ + A-</code>.
                Use <code>x</code> for the amount that ionizes.
              </p>
              <InteractiveIceTable
                values={iceValues}
                checked={iceChecked}
                onChange={updateIceField}
              />
              {iceChecked && (
                <div
                  className={`feedback ${iceCorrect ? "success" : "warning"}`}
                  role="status"
                  aria-live="polite"
                >
                  {iceCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
                  <p>
                    {iceCorrect
                      ? "Correct. The product concentrations are both x, and HA loses x."
                      : "Hint: start with 0.100 M HA and no ions. Ionizing one HA subtracts x from HA and adds x to both products."}
                  </p>
                </div>
              )}
              {iceCorrect && (
                <p className="math-panel">
                  <code>Ka = x^2 / (0.100 - x)</code>. Rearranged as a
                  quadratic: <code>x^2 + Ka*x - Ka(0.100) = 0</code>. Use the
                  positive root for <code>[H+]</code>.
                </p>
              )}
              <div className="button-row">
                <button
                  className="secondary-action"
                  onClick={() => setIceChecked(true)}
                >
                  Check ICE table
                </button>
                <button
                  className="primary-action"
                  disabled={!iceChecked || !iceCorrect}
                  onClick={() => setPhase(3)}
                >
                  Calculate pH <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {phase === 3 && (
            <div className="step-card">
              <p className="eyebrow">Answer</p>
              <h3>Plan the pH calculation before calculating.</h3>
              <p>
                Put the moves in order. Start from the ICE table, solve for{" "}
                <code>[H+]</code>, then convert <code>[H+]</code> into pH.
              </p>

              <div className="step-bank">
                {weakAcidCalculationSteps.map((step, index) => (
                  <button
                    key={step}
                    disabled={calculationOrder.includes(index)}
                    onClick={() => chooseCalculationStep(index)}
                  >
                    {step}
                  </button>
                ))}
              </div>

              <div className="ordered-steps">
                {calculationOrder.length === 0 ? (
                  <p>Choose the first move.</p>
                ) : (
                  calculationOrder.map((stepIndex, index) => (
                    <div key={`${stepIndex}-${index}`} className="ordered-step">
                      <span>{index + 1}</span>
                      <p>{weakAcidCalculationSteps[stepIndex]}</p>
                    </div>
                  ))
                )}
              </div>

              {calculationOrderChecked && (
                <div
                  className={`feedback ${calculationOrderCorrect ? "success" : "warning"}`}
                  role="status"
                  aria-live="polite"
                >
                  {calculationOrderCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
                  <p>
                    {calculationOrderCorrect
                      ? "Correct. Now solve for x first, then take the negative log."
                      : "Hint: start with the Ka expression from the ICE table. Rearranging creates the quadratic, and pH comes last."}
                  </p>
                </div>
              )}

              <div className="button-row">
                <button
                  className="secondary-action"
                  disabled={calculationOrder.length === 0}
                  onClick={() => {
                    setCalculationOrder((current) => current.slice(0, -1));
                    setCalculationOrderChecked(false);
                  }}
                >
                  Undo last
                </button>
                <button
                  className="secondary-action"
                  disabled={calculationOrder.length === 0}
                  onClick={() => {
                    setCalculationOrder([]);
                    setCalculationOrderChecked(false);
                  }}
                >
                  Clear order
                </button>
                <button
                  className="primary-action"
                  disabled={
                    calculationOrder.length !==
                    correctWeakAcidCalculationOrder.length
                  }
                  onClick={() => setCalculationOrderChecked(true)}
                >
                  Check order
                </button>
              </div>

              {calculationOrderChecked && calculationOrderCorrect && (
                <>
                  <div className="math-panel">
                    <strong>Now calculate</strong>
                    <p>
                      <code>Ka = x^2 / (0.100 - x)</code>
                      <br />
                      <code>x^2 + Ka*x - Ka(0.100) = 0</code>
                      <br />
                      <code>
                        x = (-Ka + sqrt(Ka^2 + 4Ka(0.100))) / 2 = [H+]
                      </code>
                      <br />
                      <code>pH = -log[H+]</code>
                    </p>
                  </div>
                  <label>
                    pH
                    <input
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="2.87"
                      inputMode="decimal"
                    />
                  </label>
                  {answer && (
                    <div className={`feedback ${answerCorrect ? "success" : "warning"}`}>
                      {answerCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
                      <p>
                        {answerCorrect
                          ? "Correct. Only about 1.3% ionizes, but that is enough to make pH acidic."
                          : "Use pH = -log[H+]. The [H+] value is about 0.00134 M."}
                      </p>
                    </div>
                  )}
                </>
              )}

              {revealed && (
                <div className="math-panel">
                  <strong>Model answer</strong>
                  <p>
                    <code>[H+] = {weakAcidH.toPrecision(3)} M</code>,{" "}
                    <code>pH = {weakAcidPH.toFixed(2)}</code>, percent ionization{" "}
                    <code>{weakAcidPercent.toFixed(1)}%</code>.
                  </p>
                </div>
              )}
              <div className="button-row">
                <button
                  className="secondary-action"
                  disabled={!answerCorrect}
                  onClick={() => setRevealed(true)}
                >
                  Show model answer
                </button>
                <button className="secondary-action" onClick={reset}>
                  Restart
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function WeakAcidVisual({ ionized }: { ionized: boolean }) {
  const particles = Array.from({ length: 34 }, (_, index) => ({
    kind: ionized && index < 4 ? (index % 2 === 0 ? "H+" : "A-") : "HA",
    x: (index * 19 + 8) % 88,
    y: (index * 23 + 12) % 78,
  }));

  return (
    <div className="beaker-card">
      <div className="visual-cue">
        <span aria-hidden="true">-&gt;</span>
        Mostly HA remains
      </div>
      <div className="simple-beaker">
        {particles.map((particle, index) => (
          <span
            key={`${particle.kind}-${index}`}
            className={`particle weak-${particle.kind.replace("+", "plus").replace("-", "minus")}`}
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          >
            {particle.kind}
          </span>
        ))}
      </div>
      <div className="reaction-caption">
        <span>HA</span> <ArrowRight size={16} /> <span>H+</span> + <span>A-</span>
      </div>
    </div>
  );
}

const titrationPoints = [
  {
    id: "a",
    volume: 0,
    label: "a) 0.0 mL",
    answer: "2.87",
    regionCue: "Initial weak acid",
    methodCue: "Set up a weak-acid equilibrium before any NaOH reacts.",
  },
  {
    id: "b",
    volume: 12.5,
    label: "b) 12.5 mL",
    answer: "4.74",
    regionCue: "Half-equivalence",
    methodCue: "After stoichiometry, HA and A- are present in equal amounts.",
  },
  {
    id: "c",
    volume: 25,
    label: "c) 25.0 mL",
    answer: "8.72",
    regionCue: "Equivalence point",
    methodCue: "All HA has become A-, so acetate acts as a weak base.",
  },
  {
    id: "d",
    volume: 30,
    label: "d) 30.0 mL",
    answer: "11.96",
    regionCue: "After equivalence",
    methodCue: "Excess strong base controls pH after neutralization.",
  },
];

function titrationState(volume: number) {
  const acidMoles = 0.0025;
  const baseMoles = volume / 1000 * 0.1;
  const totalL = 0.025 + volume / 1000;
  if (volume === 0) {
    return {
      region: "Initial weak acid",
      method: "Weak acid equilibrium",
      pH: weakAcidPH,
      ha: acidMoles,
      a: 0,
      oh: 0,
      note: "Mostly HA, tiny H+ and A-.",
    };
  }
  if (baseMoles < acidMoles) {
    const ha = acidMoles - baseMoles;
    const a = baseMoles;
    return {
      region: volume === 12.5 ? "Half-equivalence" : "Buffer region",
      method: volume === 12.5 ? "Equal HA/A- shortcut" : "Stoichiometry, then Henderson-Hasselbalch",
      pH: aceticPka + Math.log10(a / ha),
      ha,
      a,
      oh: 0,
      note: volume === 12.5 ? "HA = A-, so the log term is zero." : "HA decreases while A- increases.",
    };
  }
  if (Math.abs(baseMoles - acidMoles) < 1e-8) {
    const acetate = acidMoles / totalL;
    const kb = 1e-14 / aceticKa;
    const oh = Math.sqrt(kb * acetate);
    return {
      region: "Equivalence point",
      method: "Weak base equilibrium of A-",
      pH: 14 + Math.log10(oh),
      ha: 0,
      a: acidMoles,
      oh,
      note: "Only A- remains; it makes OH-, so pH is above 7.",
    };
  }
  const excessOh = (baseMoles - acidMoles) / totalL;
  return {
    region: "After equivalence",
    method: "Excess strong base controls pH",
    pH: 14 + Math.log10(excessOh),
    ha: 0,
    a: acidMoles,
    oh: excessOh,
    note: "Extra OH- dominates the pH.",
  };
}

function isTitrationAnswerCorrect(value: string | undefined, answer: string) {
  return Math.abs(Number(value) - Number(answer)) <= 0.05;
}

function getTitrationHint(
  pointId: string,
  attemptCount: number,
  state: ReturnType<typeof titrationState>,
) {
  const hints: Record<string, string[]> = {
    a: [
      "This is before any strong base is added, so no stoichiometry step happens yet.",
      "Use the weak-acid equilibrium for HA with Ka = 1.8 x 10^-5 and initial [HA] = 0.100 M.",
      "Solve [H+] from Ka = x^2 / (0.100 - x), then take -log[H+].",
    ],
    b: [
      "First do the neutralization moles: OH- converts HA into A-.",
      "At 12.5 mL, the added OH- is half the original acid moles, so HA and A- end up equal.",
      "In Henderson-Hasselbalch, the ratio term is log(1), so only the acid constant sets the value.",
    ],
    c: [
      "At equivalence, there is no HA left and no excess OH-. The solution contains acetate.",
      "Acetate is a weak base, so convert Ka to Kb with Kw / Ka.",
      "Use [A-] = 0.00250 mol / 0.0500 L, find [OH-], then convert to pH.",
    ],
    d: [
      "After equivalence, extra strong base remains and dominates the pH.",
      "Find excess OH- moles: moles NaOH added minus original HA moles.",
      "Divide excess OH- by total volume, find pOH, then use pH = 14 - pOH.",
    ],
  };
  const pointHints = hints[pointId] ?? [state.note];
  return pointHints[Math.min(attemptCount - 1, pointHints.length - 1)];
}

function getTitrationHints(
  pointId: string,
  attemptCount: number,
  state: ReturnType<typeof titrationState>,
) {
  return Array.from(
    { length: Math.min(attemptCount, 3) },
    (_, index) => getTitrationHint(pointId, index + 1, state),
  );
}

function TitrationRegionMap({
  activeVolume,
  onSelectVolume,
}: {
  activeVolume: number;
  onSelectVolume?: (volume: number) => void;
}) {
  return (
    <div className="region-map" aria-label="Titration regions and methods">
      {titrationPoints.map((point) => {
        const active = Math.abs(activeVolume - point.volume) < 0.25;
        const content = (
          <>
            <span>{point.label}</span>
            <strong>{point.regionCue}</strong>
            <p>{point.methodCue}</p>
          </>
        );
        if (onSelectVolume) {
          return (
            <button
              key={point.id}
              className={active ? "active" : ""}
              onClick={() => onSelectVolume(point.volume)}
              type="button"
            >
              {content}
            </button>
          );
        }
        return (
          <div key={point.id} className={active ? "active" : ""}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

function TitrationProblem() {
  const guideRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const [volume, setVolume] = useState(0);
  const [equivalenceEstimate, setEquivalenceEstimate] = useState("");
  const [patternEstimate, setPatternEstimate] = useState("");
  const [estimateChecked, setEstimateChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const state = titrationState(volume);
  const progress = Math.round((phase / 2) * 100);
  const estimateCorrect =
    equivalenceEstimate === "25" && patternEstimate === "weak-base-equivalence";

  useEffect(() => {
    guideRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function reset() {
    setPhase(0);
    setVolume(0);
    setEquivalenceEstimate("");
    setPatternEstimate("");
    setEstimateChecked(false);
    setAnswers({});
    setAttempts({});
  }

  const allCorrect = titrationPoints.every(
    (point) => isTitrationAnswerCorrect(answers[point.id], point.answer),
  );
  const activePointIndex = titrationPoints.findIndex(
    (point) => !isTitrationAnswerCorrect(answers[point.id], point.answer),
  );
  const currentPointIndex =
    activePointIndex === -1 ? titrationPoints.length - 1 : activePointIndex;

  function checkTitrationPoint(id: string) {
    setAttempts((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }));
  }

  return (
    <section className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Guided problem 3</p>
          <h2>Weak acid-strong base titration regions</h2>
        </div>
        <button className="icon-button" onClick={reset} title="Reset problem">
          <RotateCcw size={18} />
        </button>
      </header>
      <Progress value={progress} label={`Step ${phase + 1} of 3`} />

      <div className={`lab-grid ${phase === 1 ? "has-visual" : ""}`}>
        <section className={`visual-panel ${phase === 1 ? "show-visual" : ""}`}>
          <TitrationVisual volume={volume} state={state} />
        </section>
        <section
          className="guide-panel"
          ref={guideRef}
          tabIndex={-1}
          aria-live="polite"
          aria-label="Titration guided step"
        >
          <div className="focus-cue">
            <span aria-hidden="true">-&gt;</span>
            <p>
              {phase === 0 && "Start here: know the four required points."}
              {phase === 1 && "Drag the slider or click A-D to jump between regions."}
              {phase === 2 && "Finish here: calculate each checkpoint."}
            </p>
          </div>

          {phase === 0 && (
            <div className="step-card">
              <p className="eyebrow">Estimate</p>
              <h3>25.0 mL of 0.100 M acetic acid is titrated with 0.100 M NaOH.</h3>
              <p className="problem-text">
                Calculate pH before NaOH, after 12.5 mL, at equivalence, and
                after 30.0 mL. The key is choosing the right method for each
                region.
              </p>
              <fieldset>
                <legend>Where should equivalence happen?</legend>
                <div className="segmented">
                  {[
                    ["12.5", "12.5 mL"],
                    ["25", "25.0 mL"],
                    ["30", "30.0 mL"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={equivalenceEstimate === value}
                      className={equivalenceEstimate === value ? "selected" : ""}
                      onClick={() => {
                        setEquivalenceEstimate(value);
                        setEstimateChecked(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>What should the pH pattern look like?</legend>
                <div className="choice-stack">
                  {[
                    [
                      "weak-base-equivalence",
                      "Starts acidic, rises through a buffer region, and equivalence is above 7",
                    ],
                    [
                      "neutral-equivalence",
                      "Starts acidic, rises, and equivalence is exactly 7",
                    ],
                    [
                      "always-acidic",
                      "Stays below 7 at all four checkpoints",
                    ],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={patternEstimate === value}
                      className={
                        patternEstimate === value ? "selected choice" : "choice"
                      }
                      onClick={() => {
                        setPatternEstimate(value);
                        setEstimateChecked(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {estimateChecked && (
                <div
                  className={`feedback ${estimateCorrect ? "success" : "warning"}`}
                  role="status"
                  aria-live="polite"
                >
                  {estimateCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
                  <p>
                    {estimateCorrect
                      ? "Correct. Equal molarities mean 25.0 mL reaches equivalence, and acetate makes equivalence basic."
                      : equivalenceEstimate !== "25"
                        ? "Hint: initial acid moles are 0.0250 L x 0.100 M. With 0.100 M NaOH, the same number of moles needs the same volume."
                        : "Hint: at equivalence the solution contains acetate, the conjugate base of a weak acid, so the pH is above 7."}
                  </p>
                </div>
              )}
              <div className="button-row">
                <button
                  className="secondary-action"
                  disabled={!equivalenceEstimate || !patternEstimate}
                  onClick={() => setEstimateChecked(true)}
                >
                  Check estimate
                </button>
                <button
                  className="primary-action"
                  disabled={!estimateChecked || !estimateCorrect}
                  onClick={() => setPhase(1)}
                >
                  Explore regions <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {phase === 1 && (
            <div className="step-card">
              <p className="eyebrow">Explore</p>
              <h3>{state.region}</h3>
              <p>
                Drag the bar or click a checkpoint card to move the curve marker
                to that titration region.
              </p>
              <label>
                NaOH added: {volume.toFixed(1)} mL
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
              </label>
              <div className="method-card">
                <span>Method now</span>
                <strong>{state.method}</strong>
                <p>{state.note}</p>
              </div>
              <TitrationRegionMap
                activeVolume={volume}
                onSelectVolume={setVolume}
              />
              <button className="primary-action" onClick={() => setPhase(2)}>
                Solve checkpoints <ChevronRight size={18} />
              </button>
            </div>
          )}

          {phase === 2 && (
            <div className="step-card">
              <p className="eyebrow">Calculate</p>
              <h3>Submit each pH value one at a time.</h3>
              <TitrationRegionMap
                activeVolume={titrationPoints[currentPointIndex].volume}
              />
              <div className="checkpoint-grid">
                {titrationPoints.map((point, index) => {
                  const pointState = titrationState(point.volume);
                  const value = answers[point.id] ?? "";
                  const correct = isTitrationAnswerCorrect(value, point.answer);
                  const locked = index > currentPointIndex;
                  const checked = (attempts[point.id] ?? 0) > 0;
                  return (
                    <div
                      key={point.id}
                      className={`checkpoint-card ${index === currentPointIndex ? "active" : ""} ${correct ? "complete" : ""}`}
                    >
                      <div>
                        <span>{point.label}</span>
                        <strong>{point.regionCue}</strong>
                        <p>{point.methodCue}</p>
                      </div>
                      <input
                        aria-label={`${point.label} pH`}
                        value={value}
                        disabled={locked || correct}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [point.id]: event.target.value,
                          }))
                        }
                        placeholder={locked ? "locked" : "pH"}
                        inputMode="decimal"
                      />
                      <button
                        className="secondary-action"
                        disabled={locked || correct || !value}
                        onClick={() => checkTitrationPoint(point.id)}
                      >
                        Check
                      </button>
                      {correct && <small className="success-text">Correct</small>}
                      {!correct && checked && (
                        <div className="hint-stack" role="status" aria-live="polite">
                          {getTitrationHints(
                            point.id,
                            attempts[point.id] ?? 1,
                            pointState,
                          ).map((hint, hintIndex) => (
                            <div key={hint} className="hint-card">
                              <span>Hint {hintIndex + 1}</span>
                              <p>{hint}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {locked && <small>Unlocks after the previous part is correct.</small>}
                    </div>
                  );
                })}
              </div>
              {allCorrect && (
                <div className="feedback success">
                  <Check size={18} />
                  <p>Correct. This problem switches methods four times.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function TitrationVisual({
  volume,
  state,
}: {
  volume: number;
  state: ReturnType<typeof titrationState>;
}) {
  const markerX = (volume / 30) * 280 + 10;
  const markerY = phToCurveY(state.pH);
  return (
    <div className="beaker-card">
      <div className="titration-curve" aria-label={`Titration curve at ${volume} mL NaOH`}>
        <svg viewBox="0 0 300 180" role="img">
          <path d="M10 128 C18 116 35 111 60 108 C88 106 112 110 126.7 109 C165 104 210 96 235 78 C241 72 242 70 243.3 68 C244 46 247 32 253 27 C264 21 280 18 290 17" />
          <circle cx={markerX} cy={markerY} r="6" />
        </svg>
        <strong>pH {state.pH.toFixed(2)}</strong>
      </div>
      <div className="method-card">
        <span>{state.region}</span>
        <strong>{state.method}</strong>
      </div>
      <div className="counter-grid">
        <Counter label="HA" value={state.ha} color="blue" />
        <Counter label="A-" value={state.a} color="orange" />
        <Counter label="OH-" value={state.oh} color="pink" />
      </div>
    </div>
  );
}

function phToCurveY(pH: number) {
  const minY = 158;
  const maxY = 14;
  return minY - (pH / 14) * (minY - maxY);
}

function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export default App;
