import { Sparkles } from "lucide-react";

export function shuffledIndices(length: number) {
  const values = Array.from({ length }, (_, index) => index);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

export function TeacherFillButton({
  teacherMode,
  onFill,
  label = "Autofill correct answer",
  inline = false,
}: {
  teacherMode: boolean;
  onFill: () => void;
  label?: string;
  inline?: boolean;
}) {
  if (!teacherMode) return null;
  return (
    <button
      className={`magic-fill-button${inline ? " inline" : ""}`}
      onClick={onFill}
      type="button"
      title={label}
      aria-label={label}
    >
      <Sparkles size={16} />
    </button>
  );
}

export function Counter({
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

export function Progress({ value, label }: { value: number; label: string }) {
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
