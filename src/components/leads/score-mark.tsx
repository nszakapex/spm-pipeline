import { SCORE_BAND_LABELS, type ScoreBand } from "@/types/domain";
import { cn } from "@/lib/utils";

const HEAT_FILLED: Record<ScoreBand, number> = {
  P1: 4,
  P2: 3,
  P3: 2,
  P4: 1,
};

const CHIP: Record<ScoreBand, string> = {
  P1: "border-[rgba(232,189,54,0.55)] bg-[linear-gradient(180deg,#fff8dc,#f3de8a)] text-[var(--spm-navy)] shadow-[0_0_0_3px_rgba(232,189,54,0.16)]",
  P2: "border-[rgba(28,72,230,0.28)] bg-[#e8f1ff] text-[var(--spm-blue-primary)]",
  P3: "border-[rgba(232,189,54,0.28)] bg-[var(--spm-cream)] text-[var(--spm-navy)]",
  P4: "border-[rgba(7,22,74,0.1)] bg-[#f4f6fa] text-[var(--spm-text-muted)]",
};

const TICK_ON: Record<ScoreBand, string> = {
  P1: "bg-[var(--spm-gold)]",
  P2: "bg-[var(--spm-blue-primary)]",
  P3: "bg-[#d4c4a0]",
  P4: "bg-[rgba(7,22,74,0.22)]",
};

export function scoreHeatFilled(band: ScoreBand): number {
  return HEAT_FILLED[band];
}

export function ScoreMark({
  band,
  score,
  compact = false,
}: {
  band: ScoreBand;
  score: number;
  compact?: boolean;
}) {
  const filled = scoreHeatFilled(band);
  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full border font-bold tracking-[-0.01em]",
          CHIP[band],
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        )}
      >
        {SCORE_BAND_LABELS[band]} · {score}
      </span>
      <span
        className="flex w-full min-w-[4.5rem] gap-0.5"
        aria-hidden
      >
        {[1, 2, 3, 4].map((tick) => (
          <span
            key={tick}
            className={cn(
              "h-1 flex-1 rounded-full",
              tick <= filled ? TICK_ON[band] : "bg-[rgba(7,22,74,0.08)]",
            )}
          />
        ))}
      </span>
    </span>
  );
}
