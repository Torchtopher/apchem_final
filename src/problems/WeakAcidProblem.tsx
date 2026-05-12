import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronRight, Lightbulb, RotateCcw } from "lucide-react";
import { ProblemFacts, Progress, StepBackButton, TeacherFillButton, shuffledIndices } from "../shared";

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
const weakAcidFacts = [
  "0.100 M HC2H3O2.",
  "Ka = 1.8 x 10^-5.",
  "Reaction: HA ⇌ H+ + A-.",
  "Target: calculate pH.",
];

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

function InteractiveIceTable({
  values,
  checked,
  onChange,
  teacherMode = false,
  onFill,
}: {
  values: Record<IceField, string>;
  checked: boolean;
  onChange: (field: IceField, value: string) => void;
  teacherMode?: boolean;
  onFill?: (field: IceField, value: string) => void;
}) {
  const rows: Array<[string, IceField, IceField, IceField]> = [
    ["Initial", "initialHa", "initialH", "initialA"],
    ["Change", "changeHa", "changeH", "changeA"],
    ["Equil.", "equilibriumHa", "equilibriumH", "equilibriumA"],
  ];
  const teacherAnswers: Record<IceField, string> = {
    initialHa: "0.100",
    initialH: "0",
    initialA: "0",
    changeHa: "-x",
    changeH: "+x",
    changeA: "+x",
    equilibriumHa: "0.100 - x",
    equilibriumH: "x",
    equilibriumA: "x",
  };
  const placeholders: Record<IceField, string> = {
    initialHa: "type",
    initialH: "type",
    initialA: "type",
    changeHa: "type",
    changeH: "type",
    changeA: "type",
    equilibriumHa: "type",
    equilibriumH: "type",
    equilibriumA: "type",
  };

  return (
    <div className="ledger interactive-ice" aria-label="Editable ICE table">
      <strong>HA ⇌ H+ + A-</strong>
      <div className="ice-given-grid" aria-label="Numbers to use in the ICE table">
        <div>
          <span>Given</span>
          <code>[HA]0 = 0.100 M</code>
        </div>
        <div>
          <span>Reaction</span>
          <code>HA ⇌ H+ + A-</code>
        </div>
        <div>
          <span>Variable</span>
          <code>Use x for the amount that ionizes</code>
        </div>
      </div>
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
            placeholders={placeholders}
            teacherAnswers={teacherAnswers}
            teacherMode={teacherMode}
            checked={checked}
            onChange={onChange}
            onFill={onFill}
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
  placeholders,
  teacherAnswers,
  teacherMode,
  checked,
  onChange,
  onFill,
}: {
  label: string;
  fields: [IceField, IceField, IceField];
  values: Record<IceField, string>;
  placeholders: Record<IceField, string>;
  teacherAnswers: Record<IceField, string>;
  teacherMode: boolean;
  checked: boolean;
  onChange: (field: IceField, value: string) => void;
  onFill?: (field: IceField, value: string) => void;
}) {
  return (
    <>
      <span>{label}</span>
      {fields.map((field) => {
        const correct = iceFieldIsCorrect(field, values[field]);
        const input = (
          <input
            className={checked ? (correct ? "correct" : "incorrect") : ""}
            value={values[field]}
            onChange={(event) => onChange(field, event.target.value)}
            aria-label={`${label} ${field}`}
            placeholder={placeholders[field]}
            autoCapitalize="none"
            spellCheck={false}
          />
        );
        return (
          <div key={field} className="teacher-fill-field ice-fill-field">
            {input}
            <TeacherFillButton
              teacherMode={teacherMode}
              onFill={() => onFill?.(field, teacherAnswers[field].replace(/\s/g, ""))}
            />
          </div>
        );
      })}
    </>
  );
}

export function WeakAcidProblem({ teacherMode }: { teacherMode: boolean }) {
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
  const [calculationStepOrder, setCalculationStepOrder] = useState<number[]>(
    () => shuffledIndices(weakAcidCalculationSteps.length),
  );
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
    setCalculationStepOrder(shuffledIndices(weakAcidCalculationSteps.length));
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
          {phase > 0 && <ProblemFacts facts={weakAcidFacts} />}
          <StepBackButton
            disabled={phase === 0}
            onBack={() => setPhase((current) => Math.max(0, current - 1))}
          />
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
                <div className="choice-with-fill">
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
                  <TeacherFillButton
                    teacherMode={teacherMode}
                    inline
                    label="Autofill correct choice"
                    onFill={() => {
                      setPrediction("closer to 1");
                      setPredictionChecked(false);
                    }}
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend>Does a weak acid fully break apart?</legend>
                <div className="choice-with-fill">
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
                  <TeacherFillButton
                    teacherMode={teacherMode}
                    inline
                    label="Autofill correct choice"
                    onFill={() => {
                      setBreakApart("No, only partly");
                      setPredictionChecked(false);
                    }}
                  />
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
                <div className="choice-with-fill">
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
                  <TeacherFillButton
                    teacherMode={teacherMode}
                    inline
                    label="Autofill correct choice"
                    onFill={() => {
                      setLargeSpecies("HA");
                      setLargeSpeciesChecked(false);
                    }}
                  />
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
                teacherMode={teacherMode}
                onFill={updateIceField}
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
                <div className="feedback success">
                  <Check size={18} />
                  <p>
                    ICE is right. Now the calculation moves unlock in the next
                    step.
                  </p>
                </div>
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
                  Show calculations <ChevronRight size={18} />
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

              <div className="teacher-order-fill">
                <TeacherFillButton
                  teacherMode={teacherMode}
                  inline
                  label="Autofill correct order"
                  onFill={() => {
                    setCalculationOrder(correctWeakAcidCalculationOrder);
                    setCalculationOrderChecked(true);
                  }}
                />
              </div>

              <div className="step-bank">
                {calculationStepOrder.map((stepIndex) => (
                  <button
                    key={weakAcidCalculationSteps[stepIndex]}
                    disabled={calculationOrder.includes(stepIndex)}
                    onClick={() => chooseCalculationStep(stepIndex)}
                  >
                    {weakAcidCalculationSteps[stepIndex]}
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
                    <div className="teacher-fill-field">
                      <input
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        placeholder="2.87"
                        inputMode="decimal"
                      />
                      <TeacherFillButton
                        teacherMode={teacherMode}
                        onFill={() => setAnswer(weakAcidPH.toFixed(2))}
                      />
                    </div>
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
