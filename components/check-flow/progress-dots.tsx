import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  /** Current step index (0-based). */
  current: number;
  /** Total step count. */
  total: number;
  className?: string;
}

export function ProgressDots({ current, total, className }: ProgressDotsProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Step ${current + 1} of ${total}`}
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "h-2 rounded-full transition-all",
              state === "current" && "w-6 bg-brand-cyan",
              state === "done" && "w-2 bg-brand-cyan/60",
              state === "upcoming" && "w-2 bg-border"
            )}
          />
        );
      })}
    </div>
  );
}
