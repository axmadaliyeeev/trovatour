import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  size?: "sm" | "md";
  showNumber?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
}

const SIZE_PX: Record<NonNullable<StarsProps["size"]>, number> = {
  sm: 12,
  md: 14,
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Renders with lucide's Star icon (not the "★" glyph) — text glyphs render
 * inconsistently across OS font stacks (the same class of bug as the flag
 * emoji issue: what looks like a clean star on one machine can render as a
 * boxy fallback glyph on another). An SVG icon looks identical everywhere.
 */
export function Stars({
  rating,
  size = "md",
  showNumber = false,
  showCount = false,
  count,
  className,
}: StarsProps) {
  const px = SIZE_PX[size];
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Reyting: ${clamped.toFixed(1)} / 5`}
    >
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const fillPct = Math.max(0, Math.min(1, clamped - i)) * 100;
          return (
            <span key={i} className="relative inline-block shrink-0" style={{ width: px, height: px }}>
              <Star
                className="absolute inset-0 text-[var(--muted-foreground)]/40"
                style={{ width: px, height: px }}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPct}%` }}
              >
                <Star
                  className="text-gold-500 fill-gold-500"
                  style={{ width: px, height: px }}
                />
              </span>
            </span>
          );
        })}
      </span>

      {showNumber && (
        <span
          className="text-[var(--muted-foreground)] font-medium tabular-nums"
          style={{ fontSize: px }}
        >
          {clamped.toFixed(1)}
        </span>
      )}

      {showCount && count !== undefined && (
        <span
          className="text-[var(--muted-foreground)]/70"
          style={{ fontSize: px - 1 }}
        >
          ({formatCount(count)})
        </span>
      )}
    </span>
  );
}
