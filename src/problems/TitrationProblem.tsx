import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Lightbulb, RotateCcw } from "lucide-react";
import { Counter, ProblemFacts, Progress, StepBackButton, TeacherFillButton } from "../shared";

const aceticKa = 1.8e-5;
const aceticPka = -Math.log10(aceticKa);

const titrationPoints = [
  {
    id: "a",
    volume: 0,
    label: "a) 0.0 mL",
    answer: "2.88",
    regionCue: "Initial weak acid",
    methodCue: "Set up a weak-acid equilibrium before any NaOH reacts.",
  },
  {
    id: "b",
    volume: 12.5,
    label: "b) 12.5 mL",
    answer: "4.745",
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

const titrationAcidVolumeL = 0.025;
const titrationAcidMolarity = 0.1;
const titrationBaseMolarity = 0.1;
const titrationAcidMoles = titrationAcidMolarity * titrationAcidVolumeL;
const titrationEquivalenceVolumeL = titrationAcidMoles / titrationBaseMolarity;
const titrationEquivalenceVolumeMl = titrationEquivalenceVolumeL * 1000;
const titrationFacts = [
  "25.0 mL of 0.100 M acetic acid.",
  "Titrated with 0.100 M NaOH.",
  "Acetic acid pKa = 4.745g",
  "Equivalence volume: 25.0 mL.",
];

function initialWeakAcidPH(concentration: number) {
  const h =
    (-aceticKa + Math.sqrt(aceticKa ** 2 + 4 * aceticKa * concentration)) / 2;
  return -Math.log10(h);
}

function acetateEquivalencePH(totalVolumeL: number) {
  return acetatePHFromMoles(titrationAcidMoles, totalVolumeL);
}

function acetatePHFromMoles(acetateMoles: number, totalVolumeL: number) {
  const acetateConcentration = acetateMoles / totalVolumeL;
  const kb = 1e-14 / aceticKa;
  const oh =
    (-kb + Math.sqrt(kb ** 2 + 4 * kb * acetateConcentration)) / 2;
  return 14 + Math.log10(oh);
}

function titrationPH(volumeMl: number) {
  const volumeL = volumeMl / 1000;
  const baseMoles = titrationBaseMolarity * volumeL;
  const totalVolumeL = titrationAcidVolumeL + volumeL;

  if (volumeMl === 0) {
    return initialWeakAcidPH(titrationAcidMolarity);
  }

  if (baseMoles < titrationAcidMoles) {
    const a = baseMoles;
    const ha = titrationAcidMoles - baseMoles;
    return aceticPka + Math.log10(a / ha);
  }

  if (Math.abs(baseMoles - titrationAcidMoles) < 1e-10) {
    return acetateEquivalencePH(totalVolumeL);
  }

  const excessOh = (baseMoles - titrationAcidMoles) / totalVolumeL;
  return 14 + Math.log10(excessOh);
}

const titrationCurvePoints = [
  0, 0.5, 1, 2, 4, 6, 8, 10, 12.5, 15, 18, 21, 23, 24, 24.5, 24.8, 24.9,
  24.95, 24.98, 25, 25.02, 25.05, 25.1, 25.2, 25.5, 26, 27, 28, 29, 30,
].map((volumeMl) => ({
  volumeMl,
  pH: titrationPH(volumeMl),
}));

function formatVolumeTick(volumeMl: number) {
  const rounded = Math.round(volumeMl);
  return Math.abs(volumeMl - rounded) < 1e-6
    ? String(rounded)
    : volumeMl.toFixed(1);
}

function titrationState(volume: number) {
  const acidMoles = titrationAcidMoles;
  const baseMoles = (volume / 1000) * titrationBaseMolarity;
  const totalL = titrationAcidVolumeL + volume / 1000;
  if (volume === 0) {
    return {
      region: "Initial weak acid",
      method: "Weak acid equilibrium",
      pH: titrationPH(volume),
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
      pH: titrationPH(volume),
      ha,
      a,
      oh: 0,
      note: volume === 12.5 ? "HA = A-, so the log term is zero." : "HA decreases while A- increases.",
    };
  }
  if (Math.abs(baseMoles - acidMoles) < 1e-8) {
    const acetate = acidMoles / totalL;
    const kb = 1e-14 / aceticKa;
    const oh = (-kb + Math.sqrt(kb ** 2 + 4 * kb * acetate)) / 2;
    return {
      region: "Equivalence point",
      method: "Weak base equilibrium of A-",
      pH: titrationPH(volume),
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
    pH: titrationPH(volume),
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

export function TitrationProblem({ teacherMode }: { teacherMode: boolean }) {
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
          {phase > 0 && <ProblemFacts facts={titrationFacts} />}
          <StepBackButton
            disabled={phase === 0}
            onBack={() => setPhase((current) => Math.max(0, current - 1))}
          />
          <div className="focus-cue">
            <span aria-hidden="true">-&gt;</span>
            <p>
              {phase === 0 && "Start here: know the four required points."}
              {phase === 1 && "Drag the slider or click A-D to jump between regions."}
              {phase === 2 && "Finish here: calculate each checkpoint. (do not just look back at the graph)"}
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
                <div className="choice-with-fill">
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
                  <TeacherFillButton
                    teacherMode={teacherMode}
                    inline
                    label="Autofill correct choice"
                    onFill={() => {
                      setEquivalenceEstimate("25");
                      setEstimateChecked(false);
                    }}
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend>What should the pH pattern look like?</legend>
                <div className="choice-with-fill">
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
                  <TeacherFillButton
                    teacherMode={teacherMode}
                    inline
                    label="Autofill correct choice"
                    onFill={() => {
                      setPatternEstimate("weak-base-equivalence");
                      setEstimateChecked(false);
                    }}
                  />
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
                  const locked = !teacherMode && index > currentPointIndex;
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
                      <div className="teacher-fill-field checkpoint-fill-field">
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
                        <TeacherFillButton
                          teacherMode={teacherMode}
                          onFill={() =>
                            setAnswers((current) => ({
                              ...current,
                              [point.id]: point.answer,
                            }))
                          }
                        />
                      </div>
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
  const plot = {
    left: 36,
    right: 292,
    top: 12,
    bottom: 152,
  };
  const markerX = volumeToCurveX(volume, plot);
  const markerY = phToCurveY(state.pH);
  const pathD = titrationCurvePoints
    .map(({ volumeMl, pH }, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${volumeToCurveX(volumeMl, plot).toFixed(1)} ${phToCurveY(pH).toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="beaker-card">
      <div className="titration-curve" aria-label={`Titration curve at ${volume} mL NaOH`}>
        <svg viewBox="0 0 320 205" role="img">
          <line className="axis-line" x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} />
          <line className="axis-line" x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} />
          {[0, 7, 14].map((pH) => (
            <g key={pH}>
              <line className="tick-line" x1={plot.left - 4} y1={phToCurveY(pH)} x2={plot.right} y2={phToCurveY(pH)} />
              <text className="axis-tick" x={plot.left - 10} y={phToCurveY(pH) + 4} textAnchor="end">
                {pH}
              </text>
            </g>
          ))}
          {[0, 12.5, titrationEquivalenceVolumeMl, 30].map((volumeMl) => (
            <g key={volumeMl}>
              <line className="tick-line" x1={volumeToCurveX(volumeMl, plot)} y1={plot.bottom} x2={volumeToCurveX(volumeMl, plot)} y2={plot.bottom + 4} />
              <text className="axis-tick" x={volumeToCurveX(volumeMl, plot)} y={plot.bottom + 18} textAnchor="middle">
                {formatVolumeTick(volumeMl)}
              </text>
            </g>
          ))}
          <path d={pathD} />
          <circle cx={markerX} cy={markerY} r="6" />
          <text className="axis-title x-axis-title" x={(plot.left + plot.right) / 2} y="195" textAnchor="middle">
            NaOH added (mL)
          </text>
          <text className="axis-title y-axis-title" x="-82" y="12" textAnchor="middle" transform="rotate(-90)">
            pH
          </text>
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

function volumeToCurveX(volumeMl: number, plot: { left: number; right: number }) {
  return plot.left + (volumeMl / 30) * (plot.right - plot.left);
}

function phToCurveY(pH: number) {
  const minY = 152;
  const maxY = 12;
  return minY - (pH / 14) * (minY - maxY);
}
