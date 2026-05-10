import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Counter, TeacherFillButton } from "../shared";

const aceticKa = 1.8e-5;
const aceticPka = -Math.log10(aceticKa);
const weakAcidH = (-aceticKa + Math.sqrt(aceticKa * aceticKa + 4 * aceticKa * 0.1)) / 2;
const weakAcidPH = -Math.log10(weakAcidH);

function acetatePHFromMoles(acetateMoles: number, totalVolumeL: number) {
  const acetateConcentration = acetateMoles / totalVolumeL;
  const kb = 1e-14 / aceticKa;
  const oh =
    (-kb + Math.sqrt(kb ** 2 + 4 * kb * acetateConcentration)) / 2;
  return 14 + Math.log10(oh);
}

type ChallengePartId =
  | "initial"
  | "half"
  | "stress"
  | "rescue"
  | "equivalence";

type ChallengeStageId =
  | "start"
  | "half"
  | "stressed"
  | "rescued"
  | "equivalence";

type ChallengePart = {
  id: ChallengePartId;
  stage: ChallengeStageId;
  label: string;
  prompt: string;
  inputs: Array<{
    key: string;
    label: string;
    suffix?: string;
    placeholder: string;
    answer: number;
    tolerance: number;
  }>;
  explanation: string;
  hints: string[];
};

const challengeInitialMoles = 0.050 * 0.100;
const challengeHalfNaohMoles = 0.025 * 0.100;
const challengeHclMoles = 0.010 * 0.100;
const challengeHalfHa = challengeInitialMoles - challengeHalfNaohMoles;
const challengeHalfA = challengeHalfNaohMoles;
const challengeStressHa = challengeHalfHa + challengeHclMoles;
const challengeStressA = challengeHalfA - challengeHclMoles;
const challengeStressPH =
  aceticPka + Math.log10(challengeStressA / challengeStressHa);
const challengeRescueMoles = (challengeStressHa - challengeStressA) / 2;
const challengeRescueMl = (challengeRescueMoles / 0.100) * 1000;
const challengeEquivalencePH = acetatePHFromMoles(challengeInitialMoles, 0.120);

const challengeParts: ChallengePart[] = [
  {
    id: "initial",
    stage: "start",
    label: "A",
    prompt: "Initial weak acid pH before any NaOH is added.",
    inputs: [
      {
        key: "ph",
        label: "pH",
        placeholder: "pH",
        answer: weakAcidPH,
        tolerance: 0.04,
      },
    ],
    explanation:
      "The starting solution is only weak acid, so the pH must come from the weak-acid equilibrium, not stoichiometry.",
    hints: [
      "This is the only part before any neutralization reaction.",
      "The relevant equilibrium is HA <=> H+ + A-.",
      "Use Ka = x^2 / (0.100 - x), then convert x to pH.",
    ],
  },
  {
    id: "half",
    stage: "half",
    label: "B",
    prompt: "pH after adding 25.0 mL of 0.100 M NaOH.",
    inputs: [
      {
        key: "ph",
        label: "pH",
        placeholder: "pH",
        answer: aceticPka,
        tolerance: 0.05,
      },
    ],
    explanation:
      "The NaOH converts exactly half the HA into A-, so the buffer has equal HA and A-. The log term is zero.",
    hints: [
      "Do moles before pH. The NaOH amount is half the original HA amount.",
      "This is a buffer, not an equivalence-point solution.",
      "When HA and A- are equal, Henderson-Hasselbalch collapses to pH = pKa.",
    ],
  },
  {
    id: "stress",
    stage: "stressed",
    label: "C",
    prompt: "After 10.00 mL of 0.100 M HCl is added to that buffer.",
    inputs: [
      {
        key: "ph",
        label: "new pH",
        placeholder: "pH",
        answer: challengeStressPH,
        tolerance: 0.05,
      },
      {
        key: "delta",
        label: "delta pH",
        placeholder: "change",
        answer: challengeStressPH - aceticPka,
        tolerance: 0.05,
      },
    ],
    explanation:
      "HCl consumes acetate and makes more acetic acid. The buffer survives, but the A-/HA ratio drops.",
    hints: [
      "The strong acid reacts with the buffer base member first.",
      "Track A- and HA moles after HCl before using pH math.",
      "The ratio becomes 0.00150 mol A- / 0.00350 mol HA.",
    ],
  },
  {
    id: "rescue",
    stage: "rescued",
    label: "D",
    prompt: "Additional 0.100 M NaOH required to return the solution to pH = pKa.",
    inputs: [
      {
        key: "volume",
        label: "NaOH volume",
        suffix: "mL",
        placeholder: "mL",
        answer: challengeRescueMl,
        tolerance: 0.1,
      },
    ],
    explanation:
      "To get pH = pKa again, the buffer must return to equal HA and A-. NaOH replaces the acetate that HCl consumed.",
    hints: [
      "Do not target equivalence here. Target equal buffer moles.",
      "Each mole of OH- converts one mole of HA into A-.",
      "Solve 0.00350 - x = 0.00150 + x, then convert x moles to mL NaOH.",
    ],
  },
  {
    id: "equivalence",
    stage: "equivalence",
    label: "E",
    prompt: "pH when enough NaOH has been added after the acid mistake to reach equivalence.",
    inputs: [
      {
        key: "ph",
        label: "equivalence pH",
        placeholder: "pH",
        answer: challengeEquivalencePH,
        tolerance: 0.05,
      },
    ],
    explanation:
      "At equivalence, all acid has become acetate. Acetate hydrolyzes water to make OH-, so the pH is above 7.",
    hints: [
      "This is no longer a buffer calculation.",
      "At equivalence, the important species is acetate in the total mixed volume.",
      "Use Kb = Kw / Ka with [A-] = 0.00500 mol / 0.120 L.",
    ],
  },
];

export function FinalChallengeProblem({ teacherMode }: { teacherMode: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<ChallengePartId, number>>({
    initial: 0,
    half: 0,
    stress: 0,
    rescue: 0,
    equivalence: 0,
  });
  const [activeStage, setActiveStage] = useState<ChallengeStageId>("start");

  const completed = challengeParts.filter((part) =>
    challengePartSubmittedAndCorrect(part, answers, attempts),
  );
  const allCorrect = completed.length === challengeParts.length;
  const activeStageRevealed = completed.some((part) => part.stage === activeStage);

  function reset() {
    setAnswers({});
    setAttempts({
      initial: 0,
      half: 0,
      stress: 0,
      rescue: 0,
      equivalence: 0,
    });
    setActiveStage("start");
  }

  function checkPart(part: ChallengePart) {
    setAttempts((current) => ({
      ...current,
      [part.id]: current[part.id] + 1,
    }));
    if (challengePartIsCorrect(part, answers)) {
      setActiveStage(part.stage);
    }
  }

  return (
    <section className="workspace challenge-workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Capstone</p>
          <h2>Buffer Rescue Titration Challenge</h2>
        </div>
        <button className="icon-button" onClick={reset} title="Reset challenge">
          <RotateCcw size={18} />
        </button>
      </header>

      <div className="challenge-layout">
        <section className="challenge-main" aria-label="Final challenge">
          <div className="challenge-card challenge-prompt">
            <p className="eyebrow">Full prompt</p>
            <h3>One solution, several acid-base identities.</h3>
            <p>
              A student has <code>50.0 mL</code> of{" "}
              <code>0.100 M HC2H3O2</code>. For acetic acid,{" "}
              <code>Ka = 1.8 x 10^-5</code>.
            </p>
            <ol>
              <li>Calculate the pH before any NaOH is added.</li>
              <li>
                Add <code>25.0 mL</code> of <code>0.100 M NaOH</code> and
                calculate the pH.
              </li>
              <li>
                Add <code>10.00 mL</code> of <code>0.100 M HCl</code> to that
                buffer. Calculate the new pH and delta pH.
              </li>
              <li>
                Calculate the additional <code>0.100 M NaOH</code> needed to
                return to <code>pH = pKa</code>.
              </li>
              <li>Continue to equivalence and calculate the pH there.</li>
            </ol>
          </div>

          <div className="challenge-answer-grid">
            {challengeParts.map((part) => {
              const attempted = attempts[part.id] > 0;
              const correct =
                attempted && challengePartIsCorrect(part, answers);
              const hints = getChallengeHints(part, answers, attempts[part.id]);
              return (
                <div
                  key={part.id}
                  className={`challenge-answer-card ${correct ? "complete" : ""}`}
                >
                  <div>
                    <span>Part {part.label}</span>
                    <strong>{part.prompt}</strong>
                  </div>
                  <div className="challenge-input-grid">
                    {part.inputs.map((input) => {
                      const key = challengeAnswerKey(part.id, input.key);
                      return (
                        <label key={key}>
                          {input.label}
                          <div className="challenge-input-row">
                            <div className="teacher-fill-field">
                              <input
                                value={answers[key] ?? ""}
                                disabled={correct}
                                onChange={(event) =>
                                  setAnswers((current) => ({
                                    ...current,
                                    [key]: event.target.value,
                                  }))
                                }
                                placeholder={input.placeholder}
                                inputMode="decimal"
                              />
                              <TeacherFillButton
                                teacherMode={teacherMode}
                                onFill={() =>
                                  setAnswers((current) => ({
                                    ...current,
                                    [key]: formatTeacherAnswer(input.answer),
                                  }))
                                }
                              />
                            </div>
                            {input.suffix && <span>{input.suffix}</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="challenge-card-actions">
                    <button
                      className="secondary-action"
                      disabled={
                        correct ||
                        part.inputs.some(
                          (input) =>
                            !answers[challengeAnswerKey(part.id, input.key)],
                        )
                      }
                      onClick={() => checkPart(part)}
                    >
                      Check
                    </button>
                    {correct && (
                      <button
                        className="secondary-action"
                        onClick={() => setActiveStage(part.stage)}
                      >
                        Show state
                      </button>
                    )}
                  </div>
                  {correct && (
                    <div className="feedback success">
                      <Check size={18} />
                      <p>{part.explanation}</p>
                    </div>
                  )}
                  {!correct && attempted && (
                    <div className="hint-stack" role="status" aria-live="polite">
                      {hints.map((hint, index) => (
                        <div key={hint} className="hint-card">
                          <span>Hint {index + 1}</span>
                          <p>{hint}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allCorrect && (
            <div className="feedback success challenge-finish">
              <Check size={18} />
              <p>
                Complete. You moved through weak-acid equilibrium, buffer
                formation, buffer stress, buffer repair, and equivalence without
                being told which formula to use at each step.
              </p>
            </div>
          )}
        </section>

        <aside className="challenge-side">
          <ChallengeStateVisual
            stage={activeStage}
            revealed={activeStageRevealed}
          />
          <div className="challenge-card">
            <p className="eyebrow">Constants</p>
            <dl className="challenge-constants">
              <div>
                <dt>pKa</dt>
                <dd>{aceticPka.toFixed(3)}</dd>
              </div>
              <div>
                <dt>initial HA</dt>
                <dd>{challengeInitialMoles.toFixed(5)} mol</dd>
              </div>
              <div>
                <dt>NaOH after 25.0 mL</dt>
                <dd>{challengeHalfNaohMoles.toFixed(5)} mol</dd>
              </div>
              <div>
                <dt>HCl mistake</dt>
                <dd>{challengeHclMoles.toFixed(5)} mol</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function challengeAnswerKey(partId: ChallengePartId, inputKey: string) {
  return `${partId}-${inputKey}`;
}

function formatTeacherAnswer(answer: number) {
  return Math.abs(answer) < 1 ? answer.toFixed(2) : answer.toFixed(3);
}

function challengePartIsCorrect(
  part: ChallengePart,
  answers: Record<string, string>,
) {
  return part.inputs.every((input) => {
    const parsed = Number(answers[challengeAnswerKey(part.id, input.key)]);
    return Number.isFinite(parsed) && Math.abs(parsed - input.answer) <= input.tolerance;
  });
}

function getChallengeHints(
  part: ChallengePart,
  answers: Record<string, string>,
  attemptCount: number,
) {
  const hintCount = Math.min(attemptCount, part.hints.length);
  const hints = part.hints.slice(0, hintCount);

  if (part.id !== "stress" || attemptCount === 0) {
    return hints;
  }

  const deltaInput = part.inputs.find((input) => input.key === "delta");
  if (!deltaInput) {
    return hints;
  }

  const deltaValue = Number(answers[challengeAnswerKey(part.id, "delta")]);
  const signFlipped =
    Number.isFinite(deltaValue) &&
    Math.abs(deltaValue + deltaInput.answer) <= deltaInput.tolerance;

  if (!signFlipped) {
    return hints;
  }

  return [
    "Your delta pH magnitude is right, but check the sign. Delta pH means final pH minus initial pH, and adding HCl should lower the pH.",
    ...hints,
  ];
}

function challengePartSubmittedAndCorrect(
  part: ChallengePart,
  answers: Record<string, string>,
  attempts: Record<ChallengePartId, number>,
) {
  return attempts[part.id] > 0 && challengePartIsCorrect(part, answers);
}

function ChallengeStateVisual({
  stage,
  revealed,
}: {
  stage: ChallengeStageId;
  revealed: boolean;
}) {
  const state = challengeStageState(stage);
  return (
    <div className="beaker-card challenge-state-card">
      <div className="challenge-stage-label">
        <span>{state.label}</span>
        <strong>{state.title}</strong>
      </div>
      <div
        className={`challenge-meter ${revealed ? "" : "locked"}`}
        aria-label={revealed ? `pH ${state.pH.toFixed(2)}` : "pH hidden until correct"}
      >
        {revealed && <span style={{ left: `${(state.pH / 14) * 100}%` }} />}
      </div>
      <strong className="challenge-ph">
        {revealed ? `pH ${state.pH.toFixed(2)}` : "pH hidden"}
      </strong>
      <div className="counter-grid">
        <Counter label="HA" value={state.ha} color="blue" />
        <Counter label="A-" value={state.a} color="orange" />
        <Counter label="strong ion" value={state.strongIon} color="pink" />
      </div>
    </div>
  );
}

function challengeStageState(stage: ChallengeStageId) {
  const states: Record<
    ChallengeStageId,
    {
      label: string;
      title: string;
      pH: number;
      ha: number;
      a: number;
      strongIon: number;
    }
  > = {
    start: {
      label: "Initial",
      title: "Weak acid only",
      pH: weakAcidPH,
      ha: challengeInitialMoles,
      a: 0,
      strongIon: 0,
    },
    half: {
      label: "After NaOH",
      title: "Buffer at pH = pKa",
      pH: aceticPka,
      ha: challengeHalfHa,
      a: challengeHalfA,
      strongIon: 0,
    },
    stressed: {
      label: "After HCl",
      title: "Acid-stressed buffer",
      pH: challengeStressPH,
      ha: challengeStressHa,
      a: challengeStressA,
      strongIon: 0,
    },
    rescued: {
      label: "Rescued",
      title: "Equal buffer moles restored",
      pH: aceticPka,
      ha: challengeInitialMoles / 2,
      a: challengeInitialMoles / 2,
      strongIon: 0,
    },
    equivalence: {
      label: "Equivalence",
      title: "Acetate hydrolysis",
      pH: challengeEquivalencePH,
      ha: 0,
      a: challengeInitialMoles,
      strongIon: 0,
    },
  };
  return states[stage];
}
