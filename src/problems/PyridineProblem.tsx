import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Beaker, Check, ChevronRight, Lightbulb, RotateCcw, TestTube2 } from "lucide-react";
import { Counter, ProblemFacts, StepBackButton, TeacherFillButton, shuffledIndices } from "../shared";

type Choice = "lower" | "higher" | "";
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

type BufferLedgerField =
  | "initialPy"
  | "initialH"
  | "initialPyH"
  | "changePy"
  | "changeH"
  | "changePyH"
  | "afterPy"
  | "afterH"
  | "afterPyH";

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
  "Stoichiometry",
  "Plan math",
  "Animate",
  "Answer",
  "Reflect",
];
const pyridineFacts = [
  "0.308 mol H+ is added.",
  "1.00 L buffer solution.",
  "Buffer starts with 0.560 M py and 0.460 M pyH+.",
  "Target: delta pH = final pH - initial pH.",
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

const emptyBufferLedger: Record<BufferLedgerField, string> = {
  initialPy: "",
  initialH: "",
  initialPyH: "",
  changePy: "",
  changeH: "",
  changePyH: "",
  afterPy: "",
  afterH: "",
  afterPyH: "",
};

function normalizeBufferLedgerValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/−/g, "-");
}

function bufferLedgerFieldIsCorrect(field: BufferLedgerField, value: string) {
  const normalized = normalizeBufferLedgerValue(value);
  const acceptable: Record<BufferLedgerField, string[]> = {
    initialPy: ["0.560", ".560", "0.56"],
    initialH: ["0.308", ".308"],
    initialPyH: ["0.460", ".460"],
    changePy: ["-0.308", "-.308"],
    changeH: ["-0.308", "-.308"],
    changePyH: ["0.308", ".308", "+0.308", "+.308"],
    afterPy: ["0.252", ".252"],
    afterH: ["0", "0.000", "0.0"],
    afterPyH: ["0.768", ".768"],
  };

  return acceptable[field].includes(normalized);
}

function bufferLedgerIsCorrect(values: Record<BufferLedgerField, string>) {
  return (["changePy", "afterPy", "changePyH", "afterPyH", "afterH"] as BufferLedgerField[])
    .every((field) => bufferLedgerFieldIsCorrect(field, values[field]));
}

const finalBuffer = afterAcidAddition(initialBuffer, addedH);
const initialPH = pHFromRatio(initialBuffer);
const finalPH = pHFromRatio(finalBuffer);
const deltaAnswer = deltaPH(initialBuffer, finalBuffer);

export function PyridineProblem({ teacherMode }: { teacherMode: boolean }) {
  const guideRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const [prediction, setPrediction] = useState<Choice>("");
  const [magnitude, setMagnitude] = useState("");
  const [predictionReason, setPredictionReason] = useState("");
  const [predictionCompared, setPredictionCompared] = useState(false);
  const [dataChoice, setDataChoice] = useState<DataChoice>("");
  const [route, setRoute] = useState<Route>("unset");
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [stepOrder, setStepOrder] = useState<number[]>(
    () => shuffledIndices(steps.length),
  );
  const [ledgerValues, setLedgerValues] =
    useState<Record<BufferLedgerField, string>>(emptyBufferLedger);
  const [ledgerChecked, setLedgerChecked] = useState(false);
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
    if (phase >= 6) return 100;
    return Math.round((phase / 6) * 100);
  }, [phase]);

  useEffect(() => {
    guideRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function reset() {
    setPhase(0);
    setPrediction("");
    setMagnitude("");
    setPredictionReason("");
    setPredictionCompared(false);
    setDataChoice("");
    setRoute("unset");
    setSelectedSteps([]);
    setStepOrder(shuffledIndices(steps.length));
    setLedgerValues(emptyBufferLedger);
    setLedgerChecked(false);
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
          className={`visual-panel ${phase === 4 ? "show-visual" : ""}`}
          aria-label={
            acidAdded
              ? "After acid addition: 0.252 mol py and 0.768 mol pyH plus."
              : "Before acid addition: 0.560 mol py and 0.460 mol pyH plus."
          }
        >
          <BeakerScene acidAdded={acidAdded} showCue={phase === 4} />
          {phase === 4 && acidAdded && (
            <>
              <PHRuler
                acidAdded={acidAdded}
                route={route}
                constantsEarned={phase >= 2}
                summaryVisible={phase >= 6}
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
          {phase > 0 && <ProblemFacts facts={pyridineFacts} />}
          <StepBackButton
            disabled={phase === 0}
            onBack={() => setPhase((current) => Math.max(0, current - 1))}
          />
          <FocusCue phase={phase} acidAdded={acidAdded} />
          {phase === 0 && (
            <ProblemIntro
              prediction={prediction}
              setPrediction={setPrediction}
              magnitude={magnitude}
              setMagnitude={setMagnitude}
              predictionReason={predictionReason}
              setPredictionReason={setPredictionReason}
              predictionCompared={predictionCompared}
              setPredictionCompared={setPredictionCompared}
              teacherMode={teacherMode}
              onContinue={() => setPhase(1)}
            />
          )}

          {phase === 1 && (
            <DataDecision
              dataChoice={dataChoice}
              setDataChoice={setDataChoice}
              predictionReason={predictionReason}
              teacherMode={teacherMode}
              onContinue={handleDataContinue}
            />
          )}

          {phase === 2 && (
            <CalculationPath
              route={route}
              dataChoice={dataChoice}
              ledgerValues={ledgerValues}
              ledgerChecked={ledgerChecked}
              ledgerCorrect={bufferLedgerIsCorrect(ledgerValues)}
              teacherMode={teacherMode}
              onLedgerChange={(field, value) => {
                setLedgerValues((current) => ({ ...current, [field]: value }));
                setLedgerChecked(false);
              }}
              onLedgerCheck={() => setLedgerChecked(true)}
              onContinue={() => setPhase(3)}
            />
          )}

          {phase === 3 && (
            <CalculationPlan
              route={route}
              dataChoice={dataChoice}
              selectedSteps={selectedSteps}
              stepOrder={stepOrder}
              orderedCorrectly={orderedCorrectly}
              stepsComplete={stepsComplete}
              teacherMode={teacherMode}
              onChooseStep={chooseStep}
              onFillOrder={() => {
                setSelectedSteps(correctStepOrder);
              }}
              onUndo={() =>
                setSelectedSteps((current) => current.slice(0, -1))
              }
              onClear={() => setSelectedSteps([])}
              onContinue={() => setPhase(4)}
            />
          )}

          {phase === 4 && (
            <AddAcidStep
              acidAdded={acidAdded}
              onAdd={() => setAcidAdded(true)}
              onContinue={() => setPhase(5)}
            />
          )}

          {phase === 5 && (
            <AnswerStep
              finalAnswer={finalAnswer}
              setFinalAnswer={setFinalAnswer}
              answerCorrect={answerCorrect}
              revealed={revealed}
              setRevealed={setRevealed}
              teacherMode={teacherMode}
              onContinue={() => setPhase(6)}
            />
          )}

          {phase === 6 && (
            <SummaryStep
              prediction={prediction}
              magnitude={magnitude}
              predictionReason={predictionReason}
              reflection={reflection}
              setReflection={setReflection}
              teacherMode={teacherMode}
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
    "Look here: use stoichiometry to get the new buffer ratio.",
    "Look here: put the calculation moves in order.",
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
  predictionCompared,
  setPredictionCompared,
  teacherMode,
  onContinue,
}: {
  prediction: Choice;
  setPrediction: (choice: Choice) => void;
  magnitude: string;
  setMagnitude: (value: string) => void;
  predictionReason: string;
  setPredictionReason: (value: string) => void;
  predictionCompared: boolean;
  setPredictionCompared: (value: boolean) => void;
  teacherMode: boolean;
  onContinue: () => void;
}) {
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
        <div className="choice-with-fill">
          <div className="segmented">
            {[
              ["lower", "Lower"],
              ["higher", "Higher"],
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
          <TeacherFillButton
            teacherMode={teacherMode}
            inline
            label="Autofill correct choice"
            onFill={() => setPrediction("lower")}
          />
        </div>
      </fieldset>

      <label>
        Estimate the size of the change.
        <div className="teacher-fill-field">
          <select
            value={magnitude}
            onChange={(event) => setMagnitude(event.target.value)}
          >
            <option value="">Choose one</option>
            <option value="tiny">Tiny: less than 0.1 pH unit</option>
            <option value="moderate">Moderate: about half a pH unit</option>
            <option value="huge">Huge: several pH units</option>
          </select>
          <TeacherFillButton
            teacherMode={teacherMode}
            label="Autofill correct choice"
            onFill={() => setMagnitude("moderate")}
          />
        </div>
      </label>

      <label>
        Write your chemical reason.
        <div className="teacher-fill-field">
          <textarea
            value={predictionReason}
            onChange={(event) => setPredictionReason(event.target.value)}
            placeholder="Example: H+ should react with the base part of the buffer..."
          />
          <TeacherFillButton
            teacherMode={teacherMode}
            onFill={() =>
              setPredictionReason(
                "H+ reacts with pyridine, the base part of the buffer, so the py / pyH+ ratio decreases and pH falls.",
              )
            }
          />
        </div>
      </label>

      {predictionCompared && (
        <ModelChecklist
          title="Compare your prediction"
          items={[
            "pH should decrease because acid is added.",
            "The buffer resists the change because py consumes added H+.",
            "The ratio py / pyH+ gets smaller, so pH falls.",
          ]}
        />
      )}

      {!predictionCompared ? (
        <button
          className="primary-action"
          disabled={!ready}
          onClick={() => setPredictionCompared(true)}
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
  teacherMode,
  onContinue,
}: {
  dataChoice: DataChoice;
  setDataChoice: (choice: DataChoice) => void;
  predictionReason: string;
  teacherMode: boolean;
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

      <div className="choice-with-fill">
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
        <TeacherFillButton
          teacherMode={teacherMode}
          inline
          label="Autofill correct choice"
          onFill={() => setDataChoice("none")}
        />
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
  ledgerValues,
  ledgerChecked,
  ledgerCorrect,
  teacherMode,
  onLedgerChange,
  onLedgerCheck,
  onContinue,
}: {
  route: Route;
  dataChoice: DataChoice;
  ledgerValues: Record<BufferLedgerField, string>;
  ledgerChecked: boolean;
  ledgerCorrect: boolean;
  teacherMode: boolean;
  onLedgerChange: (field: BufferLedgerField, value: string) => void;
  onLedgerCheck: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="step-card">
      <p className="eyebrow">Stoichiometry first</p>
      <h3>Track what the added H+ consumes.</h3>
      <p>
        {route === "shortcut"
          ? "Shortcut path: compare the buffer ratio before and after acid is consumed."
          : dataChoice === "pkb"
            ? "Long path: convert pKb to pKa, compute initial and final pH, then subtract."
            : "Long path: compute initial and final pH with pKa, then subtract."}
      </p>

      <div className="next-step-card">
        <span>Next target</span>
        <strong>{ledgerCorrect ? "Buffer ratio" : "Stoichiometry"}</strong>
        <p>
          {ledgerCorrect
            ? "Now compare the starting buffer ratio with the final buffer ratio."
            : "Use the reaction amounts first. The buffer ratio only makes sense after the strong acid is consumed."}
        </p>
      </div>

      <div className="stoich-walkthrough" aria-label="Stoichiometry walkthrough">
        <div className="reaction-strip">
          <span>H+</span>
          <strong>+</strong>
          <span>py</span>
          <ArrowRight size={18} />
          <span>pyH+</span>
        </div>
        <div className="stoich-comparison">
          <div>
            <span>Available base</span>
            <strong>0.560 mol py</strong>
          </div>
          <div>
            <span>Added acid</span>
            <strong>0.308 mol H+</strong>
          </div>
          <div>
            <span>Starting conjugate acid</span>
            <strong>0.460 mol pyH+</strong>
          </div>
        </div>
        <p>
          The reaction is 1:1. Because <code>0.308 mol H+</code> is less than{" "}
          <code>0.560 mol py</code>, all added acid reacts and pyridine is left over.
        </p>
        <div className="stoich-input-grid">
          <StoichInput
            field="changePy"
            label="change in py"
            value={ledgerValues.changePy}
            checked={ledgerChecked}
            teacherMode={teacherMode}
            onChange={onLedgerChange}
          />
          <StoichInput
            field="afterPy"
            label="py left"
            value={ledgerValues.afterPy}
            checked={ledgerChecked}
            teacherMode={teacherMode}
            onChange={onLedgerChange}
          />
          <StoichInput
            field="changePyH"
            label="pyH+ formed"
            value={ledgerValues.changePyH}
            checked={ledgerChecked}
            teacherMode={teacherMode}
            onChange={onLedgerChange}
          />
          <StoichInput
            field="afterPyH"
            label="final pyH+"
            value={ledgerValues.afterPyH}
            checked={ledgerChecked}
            teacherMode={teacherMode}
            onChange={onLedgerChange}
          />
          <StoichInput
            field="afterH"
            label="H+ left after reaction"
            value={ledgerValues.afterH}
            checked={ledgerChecked}
            teacherMode={teacherMode}
            onChange={onLedgerChange}
          />
        </div>
        {ledgerChecked && (
          <div className={`feedback ${ledgerCorrect ? "success" : "warning"}`} role="status" aria-live="polite">
            {ledgerCorrect ? <Check size={18} /> : <Lightbulb size={18} />}
            <p>
              {ledgerCorrect
                ? "Correct. Now the buffer ratio changes from 0.560 / 0.460 to 0.252 / 0.768."
                : "Hint: subtract 0.308 mol from py, add 0.308 mol to pyH+, and H+ goes to zero after the reaction."}
            </p>
          </div>
        )}
        <div className="button-row">
          <button
            className="secondary-action"
            disabled={ledgerCorrect}
            onClick={onLedgerCheck}
          >
            Check stoichiometry
          </button>
          <TeacherFillButton
            teacherMode={teacherMode}
            inline
            label="Autofill correct choice"
            onFill={() => {
              onLedgerChange("changePy", "-0.308");
              onLedgerChange("changePyH", "0.308");
              onLedgerChange("afterPy", "0.252");
              onLedgerChange("afterH", "0");
              onLedgerChange("afterPyH", "0.768");
            }}
          />
        </div>
      </div>

      {ledgerCorrect && (
        <div className="stoich-ratio-result">
          <RatioComparison route={route} />
        </div>
      )}

      <button
        className="primary-action"
        disabled={!ledgerCorrect}
        onClick={onContinue}
      >
        Plan calculation <ChevronRight size={18} />
      </button>
    </div>
  );
}

function CalculationPlan({
  route,
  dataChoice,
  selectedSteps,
  stepOrder,
  orderedCorrectly,
  stepsComplete,
  teacherMode,
  onChooseStep,
  onFillOrder,
  onUndo,
  onClear,
  onContinue,
}: {
  route: Route;
  dataChoice: DataChoice;
  selectedSteps: number[];
  stepOrder: number[];
  orderedCorrectly: boolean;
  stepsComplete: boolean;
  teacherMode: boolean;
  onChooseStep: (index: number) => void;
  onFillOrder: () => void;
  onUndo: () => void;
  onClear: () => void;
  onContinue: () => void;
}) {
  const nextStepNumber = selectedSteps.length + 1;
  const expectedNext = steps[correctStepOrder[selectedSteps.length]];

  return (
    <div className="step-card">
      <p className="eyebrow">Calculation plan</p>
      <h3>Put the calculation moves in order.</h3>
      <p>
        The stoichiometry gives final amounts of <code>0.252 mol py</code> and{" "}
        <code>0.768 mol pyH+</code>. Now decide how those amounts become a pH
        change.
      </p>

      <RatioComparison route={route} />

      <div className="next-step-card">
        <span>Next target</span>
        <strong>Step {Math.min(nextStepNumber, steps.length)}</strong>
        <p>
          {stepsComplete
            ? "The plan is complete. Now connect the math to the particle view."
            : expectedNext}
        </p>
      </div>

      <div className="teacher-order-fill">
        <TeacherFillButton
          teacherMode={teacherMode}
          inline
          label="Autofill correct order"
          onFill={onFillOrder}
        />
      </div>

      <div className="step-bank">
        {stepOrder.map((stepIndex) => (
          <button
            key={steps[stepIndex]}
            disabled={selectedSteps.includes(stepIndex)}
            onClick={() => onChooseStep(stepIndex)}
          >
            {steps[stepIndex]}
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

      {stepsComplete && (
        <div className="math-panel">
          <strong>Worked values</strong>
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
          {route === "shortcut" && (
            <p>
              <code>
                delta pH = log((0.252 / 0.768) / (0.560 / 0.460)) ={" "}
                {deltaAnswer.toFixed(2)}
              </code>
            </p>
          )}
          {route !== "shortcut" && (
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
  teacherMode,
  onContinue,
}: {
  finalAnswer: string;
  setFinalAnswer: (value: string) => void;
  answerCorrect: boolean;
  revealed: boolean;
  setRevealed: (value: boolean) => void;
  teacherMode: boolean;
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
        <div className="teacher-fill-field">
          <input
            value={finalAnswer}
            onChange={(event) => setFinalAnswer(event.target.value)}
            placeholder="type delta pH"
            inputMode="decimal"
          />
          <TeacherFillButton
            teacherMode={teacherMode}
            onFill={() => setFinalAnswer(deltaAnswer.toFixed(2))}
          />
        </div>
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
  teacherMode,
  onRestart,
}: {
  prediction: Choice;
  magnitude: string;
  predictionReason: string;
  reflection: string;
  setReflection: (value: string) => void;
  teacherMode: boolean;
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
        <div className="teacher-fill-field">
          <textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="Now I would mention..."
          />
          <TeacherFillButton
            teacherMode={teacherMode}
            onFill={() =>
              setReflection(
                "Now I would mention that the buffer resists pH change because added H+ is consumed by the base member of the buffer pair.",
              )
            }
          />
        </div>
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

function StoichInput({
  field,
  label,
  value,
  checked,
  teacherMode,
  onChange,
}: {
  field: BufferLedgerField;
  label: string;
  value: string;
  checked: boolean;
  teacherMode: boolean;
  onChange: (field: BufferLedgerField, value: string) => void;
}) {
  const teacherAnswers: Record<BufferLedgerField, string> = {
    initialPy: "0.560",
    initialH: "0.308",
    initialPyH: "0.460",
    changePy: "-0.308",
    changeH: "-0.308",
    changePyH: "+0.308",
    afterPy: "0.252",
    afterH: "0",
    afterPyH: "0.768",
  };
  const correct = value ? bufferLedgerFieldIsCorrect(field, value) : false;

  return (
    <label className="stoich-input">
      <span>{label}</span>
      <div className="teacher-fill-field">
        <input
          className={checked ? (correct ? "correct" : "incorrect") : ""}
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
          aria-label={label}
          placeholder="type moles"
          inputMode="decimal"
          autoCapitalize="none"
          spellCheck={false}
        />
        <TeacherFillButton
          teacherMode={teacherMode}
          onFill={() => onChange(field, teacherAnswers[field])}
        />
      </div>
    </label>
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
