import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";

// Trova covers Uzbekistan only today, but tour-planning is meant to
// expand to the rest of Central Asia (and beyond) — this lives at the
// top of the main dashboard because that's the first screen a tourist
// actually plans a trip from, not buried on the "About" page where
// nobody deciding where to go would think to look for it. Non-Uzbekistan
// chips are inert (no catalog exists yet) and say so plainly rather than
// navigating somewhere broken or pretending to be a real destination.
const OTHER_COUNTRIES = [
  { code: "TR", name: "Turkiya" },
  { code: "KZ", name: "Qozog'iston" },
  { code: "KG", name: "Qirg'iziston" },
  { code: "TJ", name: "Tojikiston" },
  { code: "TM", name: "Turkmaniston" },
] as const;

// Monoline code chip, not a flag emoji — same reasoning as CountrySelect
// and Profile's language list: unsupported color-emoji fonts render flag
// emoji as literal two-letter text, indistinguishable from a bug.
function CountryFlagChip({ code }: { code: string }) {
  return (
    <span className="w-4 h-4 shrink-0 rounded-[3px] bg-black/15 flex items-center justify-center text-[7px] font-black tracking-tighter">
      {code}
    </span>
  );
}

export function CountrySwitcher({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const showToast = useAppStore((s) => s.showToast);
  return (
    <div className={className ?? "px-4 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide"}>
      <button
        onClick={() => navigate("/uzbekistan")}
        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 active:scale-[0.97] transition-transform"
      >
        <CountryFlagChip code="UZ" /> O'zbekiston
      </button>
      {OTHER_COUNTRIES.map((c) => (
        <button
          key={c.code}
          onClick={() => showToast(`${c.name} — ${t("home", "coming_soon")}`, undefined, "info")}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-semibold hover:border-indigo-500/30 hover:text-[var(--foreground)] transition-all active:scale-[0.97]"
        >
          <CountryFlagChip code={c.code} /> {c.name}
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold-500/15 text-gold-600 dark:text-gold-300 font-bold">
            {t("home", "coming_soon")}
          </span>
        </button>
      ))}
    </div>
  );
}
