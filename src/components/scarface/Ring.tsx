import { cn } from "@/lib/utils";

const tones = { primary: "text-primary", gold: "text-gold", success: "text-success" } as const;

export function Ring({ value, label, sub, tone }: { value: number; label: string; sub: string; tone: keyof typeof tones }) {
  const r = 70, c = Math.PI * r; // half-ring arc
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card p-5">
      <div className={cn("relative", tones[tone])}>
        <svg width="180" height="100" viewBox="0 0 180 100">
          <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="14" strokeLinecap="round" />
          <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: "stroke-dashoffset .6s" }} />
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center text-3xl font-bold text-foreground">{value}%</div>
      </div>
      <div className="mt-2 font-semibold">{label}</div>
      <div className={cn("text-xs font-semibold", tones[tone])}>{sub}</div>
    </div>
  );
}
