import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Bot, Shuffle, Sun, Moon, CornerDownLeft, Zap, Landmark, Leaf, Palette, Church, Pickaxe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCATIONS } from "@/data";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";
import type { Location } from "@/types";

// Same monoline icon family used everywhere else in the app — this map
// still had colorful category emoji rendered on a dark chip, which read
// as mismatched glyphs on a black square rather than part of the icon
// system.
const CAT_ICON: Record<Location["category"], typeof Landmark> = {
  tarix: Landmark,
  tabiat: Leaf,
  madaniyat: Palette,
  din: Church,
  arxeologiya: Pickaxe,
};

interface Action {
  id: string;
  icon: React.ReactNode;
  label: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // The palette is mounted app-wide for the entire session; a whole-store
  // destructure re-rendered it (and re-ran its result filtering) on every
  // toast, plan change and route-driven store write, even while closed.
  const searchOpen    = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const theme         = useAppStore((s) => s.theme);
  const toggleTheme   = useAppStore((s) => s.toggleTheme);
  const showToast     = useAppStore((s) => s.showToast);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global hotkeys: Ctrl/Cmd+K toggles, Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!useAppStore.getState().searchOpen);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  // Reset + focus on open
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const close = () => setSearchOpen(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOCATIONS.filter((l) => l.featured).slice(0, 5);
    return LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (l.shortDesc ?? "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const actions: Action[] = useMemo(
    () => [
      {
        id: "ai",
        icon: <Bot className="w-4 h-4 text-indigo-400" />,
        label: "Trova AI",
        run: () => {
          close();
          navigate("/chat");
        },
      },
      {
        id: "random",
        icon: <Shuffle className="w-4 h-4 text-indigo-400" />,
        label: t("home", "explore_btn"),
        run: () => {
          const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
          close();
          showToast(loc.name, undefined, "info");
          navigate(`/locations/${loc.id}`);
        },
      },
      {
        id: "theme",
        icon:
          theme === "dark" ? (
            <Sun className="w-4 h-4 text-indigo-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          ),
        label: theme === "dark" ? t("profile", "theme_light") : t("profile", "theme_dark"),
        run: () => toggleTheme(),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, t]
  );

  // Flat list for keyboard navigation: locations first, then actions
  const items = useMemo(
    () => [
      ...results.map((loc) => ({
        key: `loc-${loc.id}`,
        run: () => {
          close();
          navigate(`/locations/${loc.id}`);
        },
      })),
      ...actions.map((a) => ({ key: `act-${a.id}`, run: a.run })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, actions]
  );

  useEffect(() => setActive(0), [query]);

  // Keep the active item visible
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      items[active].run();
    } else if (e.key === "Tab") {
      // The palette has exactly one focusable control (the input) while
      // results/actions are click/Enter-only, not tab stops — without
      // this, Tab moves focus straight through to whatever is behind the
      // overlay while it's still open.
      e.preventDefault();
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xl flex items-start justify-center px-4 pt-[12vh]"
          onMouseDown={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("locations", "search_placeholder")}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
            className="w-full max-w-lg rounded-2xl bg-[var(--modal)] border border-[var(--modal-border)] shadow-[var(--shadow-modal)] overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border)]">
              <Search className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder={t("locations", "search_placeholder")}
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
              />
              <kbd className="hidden sm:block text-[10px] font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] border border-[var(--border)] rounded-md px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && query.trim() !== "" && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)] py-6">
                  <Search className="w-3.5 h-3.5" />
                  {t("locations", "no_results")}
                </p>
              )}

              {results.map((loc, i) => (
                <button
                  key={loc.id}
                  data-idx={i}
                  onClick={() => {
                    close();
                    navigate(`/locations/${loc.id}`);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                    active === i ? "bg-indigo-500/12" : "hover:bg-[var(--muted)]"
                  )}
                >
                  <span className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    {(() => {
                      const CatIcon = CAT_ICON[loc.category];
                      return <CatIcon className="w-4 h-4 text-indigo-500" strokeWidth={2} />;
                    })()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-[var(--foreground)] truncate">
                      {loc.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                      <MapPin className="w-3 h-3 text-indigo-500/70" />
                      {loc.city}
                      <Star className="w-3 h-3 text-gold-500 fill-gold-500 ml-1.5" />
                      {loc.rating}
                    </span>
                  </span>
                  {active === i && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  )}
                </button>
              ))}

              {/* Quick actions — a real label, not a bare floating icon
                  with nothing to anchor it to. */}
              <p className="flex items-center gap-1.5 px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                <Zap className="w-3 h-3" />
                Tezkor amallar
              </p>
              {actions.map((a, j) => {
                const idx = results.length + j;
                return (
                  <button
                    key={a.id}
                    data-idx={idx}
                    onClick={a.run}
                    onMouseEnter={() => setActive(idx)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                      active === idx ? "bg-indigo-500/12" : "hover:bg-[var(--muted)]"
                    )}
                  >
                    <span className="w-9 h-9 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      {a.icon}
                    </span>
                    <span className="text-sm font-semibold text-[var(--foreground)]">{a.label}</span>
                    {active === idx && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <kbd className="min-w-[20px] text-center bg-[var(--muted)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[var(--foreground)]">↑↓</kbd>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="min-w-[20px] text-center bg-[var(--muted)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[var(--foreground)]">↵</kbd>
              </span>
              <span className="ml-auto font-bold tracking-wider text-indigo-500/60">trova</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
