import type { ScoreBand } from "@/types/domain";
import { cn } from "@/lib/utils";

export type HeatLevel = "hot" | "high" | "cool";

const LEVEL_FROM_BAND: Record<ScoreBand, HeatLevel> = {
  P1: "hot",
  P2: "high",
  P3: "cool",
  P4: "cool",
};

const LEVEL_LABEL: Record<HeatLevel, string> = {
  hot: "Hot",
  high: "High",
  cool: "Cool",
};

const HEAT_FILLED: Record<HeatLevel, number> = {
  hot: 3,
  high: 2,
  cool: 1,
};

const CHIP: Record<HeatLevel, string> = {
  hot: "border-[rgba(232,189,54,0.6)] bg-[linear-gradient(180deg,#fff3c4,#efc94a)] text-[var(--spm-navy)] shadow-[0_0_0_4px_rgba(232,189,54,0.2)]",
  high: "border-[rgba(28,72,230,0.3)] bg-[#dce9ff] text-[var(--spm-blue-primary)]",
  cool: "border-[rgba(7,22,74,0.1)] bg-[#eef1f6] text-[var(--spm-text-muted)]",
};

const TICK_ON: Record<HeatLevel, string> = {
  hot: "bg-[var(--spm-gold)]",
  high: "bg-[var(--spm-blue-primary)]",
  cool: "bg-[rgba(7,22,74,0.22)]",
};

export function heatLevelFromBand(band: ScoreBand): HeatLevel {
  return LEVEL_FROM_BAND[band];
}

export function scoreHeatFilled(band: ScoreBand): number {
  return HEAT_FILLED[heatLevelFromBand(band)];
}

export function ScoreMark({
  band,
  compact = false,
}: {
  band: ScoreBand;
  compact?: boolean;
}) {
  const level = heatLevelFromBand(band);
  const filled = HEAT_FILLED[level];
  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full border uppercase",
          CHIP[level],
          compact
            ? "px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.08em]"
            : "px-3 py-1 text-xs font-extrabold tracking-[0.12em]",
        )}
      >
        {LEVEL_LABEL[level]}
      </span>
      <span className="flex w-full min-w-[4.25rem] gap-0.5" aria-hidden>
        {[1, 2, 3].map((tick) => (
          <span
            key={tick}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              tick <= filled ? TICK_ON[level] : "bg-[rgba(7,22,74,0.08)]",
            )}
          />
        ))}
      </span>
    </span>
  );
}
