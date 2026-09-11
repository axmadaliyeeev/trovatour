import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MapPin, Bot, Sparkles, BookmarkX, LogIn } from "lucide-react";
import { useAppStore } from "@/store";
import { syncRemoveFromPlan } from "@/lib/plan-sync";
import { useTranslation } from "@/i18n";
import { Stars } from "@/components/ui/stars";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Location } from "@/types";

// A dedicated home for "Add to Plan" — the header bookmark icon used to
// route to Profile, which read as unrelated to bookmarking a place. This
// page groups whatever's saved by city so a multi-city trip reads as a
// plan, not just an undifferentiated list.
export default function SavedPlaces() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const plan           = useAppStore((s) => s.plan);
  const removeFromPlan = useAppStore((s) => s.removeFromPlan);
  const user           = useAppStore((s) => s.user);
  const openAuthModal  = useAppStore((s) => s.openAuthModal);

  const byCity = useMemo(() => {
    const groups = new Map<string, Location[]>();
    for (const loc of plan) {
      const list = groups.get(loc.city) ?? [];
      list.push(loc);
      groups.set(loc.city, list);
    }
    return [...groups.entries()];
  }, [plan]);

  const total = plan.reduce((sum, l) => sum + (l.priceUSD ?? 0), 0);

  function remove(id: string) {
    removeFromPlan(id);
    syncRemoveFromPlan(id);
  }

  if (plan.length === 0) {
    return (
      <div className="pb-8 max-w-2xl mx-auto">
        <PageHeader title={t("saved", "title")} subtitle={t("saved", "subtitle")} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 flex flex-col items-center text-center gap-3 py-16 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-indigo-500/60" strokeWidth={1.5} />
          </div>
          {/* A signed-out visitor and a signed-in visitor who simply hasn't
              saved anything yet see the same "nothing here" shape, but not
              the same words — someone who just logged out had their plan
              array cleared with them, and "start exploring" reads as if
              nothing was ever there rather than "sign back in to see it". */}
          {!user ? (
            <>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("saved", "empty_title_guest")}</p>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xs">{t("saved", "empty_desc_guest")}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openAuthModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors active:scale-[0.97]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t("auth", "login")}
                </button>
                <button
                  onClick={() => navigate("/locations")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-xs font-semibold hover:border-indigo-500/40 transition-all active:scale-[0.97]"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {t("saved", "explore_btn")}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("saved", "empty_title")}</p>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xs">{t("saved", "empty_desc")}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate("/locations")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors active:scale-[0.97]"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {t("saved", "explore_btn")}
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-xs font-semibold hover:border-indigo-500/40 transition-all active:scale-[0.97]"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {t("saved", "ai_btn")}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-2xl mx-auto">
      <PageHeader
        title={t("saved", "title")}
        subtitle={`${byCity.length} ${t("saved", "cities_suffix")} · ${total === 0 ? t("detail", "free") : `~$${total}`}`}
        action={
          <motion.span
            key={plan.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="inline-block px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 tabular-nums"
          >
            {plan.length}
          </motion.span>
        }
      />

      <div className="px-4">
      <button
        onClick={() => navigate("/chat")}
        className="w-full flex items-center gap-2.5 p-3 mb-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="text-sm font-semibold flex-1 text-left">{t("saved", "ai_banner")}</span>
      </button>

      <div className="space-y-6">
        {byCity.map(([city, locs]) => (
          <div key={city}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
              <MapPin className="w-3 h-3 text-indigo-500" />
              {city}
            </p>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {locs.map((loc) => (
                  <motion.div
                    key={loc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] group"
                  >
                    <img
                      src={loc.img}
                      alt={loc.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 cursor-pointer"
                      onClick={() => navigate(`/locations/${loc.id}`)}
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/locations/${loc.id}`)}
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{loc.name}</p>
                      <Stars rating={loc.rating} size="sm" showNumber />
                    </div>
                    <button
                      onClick={() => remove(loc.id)}
                      // Always visible on touch (no hover state exists
                      // there — it was permanently invisible, so saved
                      // places simply could not be removed on a phone);
                      // fades in on hover only where a pointer exists.
                      className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                      aria-label={t("detail", "remove_plan")}
                    >
                      <BookmarkX className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
