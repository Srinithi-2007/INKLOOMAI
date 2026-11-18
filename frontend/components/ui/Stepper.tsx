export default function Stepper({ step, total, label }: { step: number; total: number; label: string }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        <span>Step {step} of {total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}