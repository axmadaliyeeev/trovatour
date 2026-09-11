import { useNavigate, useLocation } from "react-router-dom";
import { Home, MapPin, Bot, LayoutGrid, ChevronRight, LogIn, Globe2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";
import { TOUR_IDS } from "@/components/ui/Tour";

// Maps a route to the tour anchor id it should carry, if any. Undefined for
// routes the tour doesn't visit, which React simply omits from the DOM.
const TOUR_ANCHOR: Record<string, string | undefined> = {
  "/locations": TOUR_IDS.LOCATIONS,
  "/saved": TOUR_IDS.SAVED,
};

const NAV_TABS = [
  { route: "/home",       Icon: Home,       key: "home"      },
  { route: "/locations",  Icon: MapPin,     key: "locations" },
  { route: "/saved",      Icon: Bookmark,   key: "saved"     },
  { route: "/uzbekistan", Icon: Globe2,     key: "about"     },
  { route: "/services",   Icon: LayoutGrid, key: "services"  },
] as const;

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user          = useAppStore((s) => s.user);
  // The badge renders a count, so subscribe to the count — selecting the
  // whole `plan` array re-rendered the entire rail on any plan mutation
  // (and a whole-store destructure re-rendered it on every toast too).
  const planCount     = useAppStore((s) => s.plan.length);
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const { t } = useTranslation();

  return (
    // border-r replaced with a barely-there shadow — a hard rule down the
    // full height of the screen next to a dense icon+label nav column is
    // exactly the CMS/admin-dashboard silhouette; a soft edge reads as a
    // floating panel instead.
    <aside aria-label="trova" className="glass fixed left-0 top-0 h-screen w-60 z-40 flex flex-col bg-[var(--sidebar-bg)] shadow-[1px_0_0_0_var(--sidebar-border)] overflow-hidden">

      {/* ── Subtle top gradient glow ───────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/6 to-transparent pointer-events-none" />

      {/* ── Logo — real brand mark (mark + wordmark in one image) instead
             of a generic MapPin icon standing in for it. Theme-matched
             variant (dark text for light bg, light text for dark bg).
             Dropped the "Travel Guide" tagline underneath — it was
             restating the obvious and added a line of dashboard-style
             chrome for nothing. ── */}
      <div className="relative flex items-center px-6 h-[76px] shrink-0">
        <img src="/img/logo-l.svg" alt="trova" className="h-7 w-auto dark:hidden" />
        <img src="/img/logo-d.svg" alt="trova" className="h-7 w-auto hidden dark:block" />
      </div>

      {/* ── Main navigation ────────────────────────────── */}
      <nav aria-label={t("nav", "primary")} className="flex-1 px-3.5 py-5 flex flex-col gap-1.5 overflow-y-auto">

        {NAV_TABS.map(({ route, Icon, key }) => {
          const active = pathname === route || (route !== "/home" && pathname.startsWith(route));
          return (
            <button
              key={route}
              // Anchors for the onboarding tour's spotlight. Only the routes
              // the tour actually references get one.
              id={TOUR_ANCHOR[route]}
              onClick={() => navigate(route)}
              // Colour and weight are the ONLY signal of the current page
              // here, which a screen reader cannot see at all. aria-current
              // is what actually announces "current page" — without it the
              // rail reads as five interchangeable buttons.
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 group active:scale-[0.98]",
                active
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {/* Solid fill on the active tab reads far more confident than a
                  faint tint — this is the one thing your eye should land on
                  scanning down the rail. Everything else stays quiet. */}
              <Icon className={cn(
                "w-[18px] h-[18px] shrink-0 transition-all",
                active ? "text-white scale-110" : "text-[var(--muted-foreground)] group-hover:scale-105"
              )} />

              <span className={cn(
                "text-[13.5px] tracking-tight transition-colors",
                active ? "font-semibold text-white" : "font-medium"
              )}>
                {t("nav", key)}
              </span>

              {/* Plan count badge — belongs on Saved Places now, not Locations */}
              {route === "/saved" && planCount > 0 && (
                <span className={cn(
                  "ml-auto min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  active ? "bg-white/25 text-white" : "bg-indigo-500/15 text-indigo-500"
                )}>
                  {planCount}
                </span>
              )}
            </button>
          );
        })}

        {/* ── Divider + Trova AI ───────────────────────── */}
        <div className="mt-4 pt-5 border-t border-[var(--sidebar-border)]/40">
          {(() => {
            const route = "/chat";
            const active = pathname === route || pathname.startsWith(route);
            return (
              <button
                id={TOUR_IDS.AI}
                onClick={() => navigate(route)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 relative active:scale-[0.98]",
                  active
                    ? "bg-gradient-to-r from-indigo-500 to-[#0d9488] shadow-md shadow-indigo-500/25"
                    : "hover:bg-indigo-500/6"
                )}
              >
                <div className={cn(
                  "border-glow-spin w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                  active ? "bg-white/20 scale-105" : "bg-indigo-500 hover:scale-105"
                )}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className={cn(
                    "text-[13.5px] font-semibold leading-tight transition-colors",
                    active ? "text-white" : "text-indigo-400"
                  )}>
                    Trova AI
                  </p>
                  <p className={cn(
                    "text-[10px] font-medium",
                    active ? "text-white/70" : "text-[var(--muted-foreground)]"
                  )}>
                    {t("nav", "ai_subtitle")}
                  </p>
                </div>
                <span className={cn(
                  "glint shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  active ? "bg-white/20 text-white" : "bg-gold-500/15 text-shimmer-gold border border-gold-500/30"
                )}>
                  AI
                </span>
              </button>
            );
          })()}
        </div>

      </nav>

      {/* ── Bottom: user card ─────────────────────────────
          (theme toggle lives in the header now — it read as a
          stranded debug switch tucked at the bottom of the sidebar) */}
      <div className="shrink-0 shadow-[0_-1px_0_0_var(--sidebar-border)]">

        {/* User / guest card — this is the sidebar's single entry point
            into /profile. A separate "Profile" row used to sit in the nav
            list above this, so the rail showed two identical destinations
            (a plain nav item, then this richer card) — confusing, and
            visually redundant. This card carries the tour's profile
            anchor now that the other one is gone. */}
        <div id={TOUR_IDS.PROFILE} className="p-3">
          {user ? (
            <button
              onClick={() => navigate("/profile")}
              aria-current={pathname === "/profile" ? "page" : undefined}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all group active:scale-[0.98]",
                pathname === "/profile"
                  ? "bg-indigo-500/12 ring-1 ring-indigo-500/30"
                  : "hover:bg-[var(--muted)]"
              )}
            >
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size={36} className="text-sm shadow-sm" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate leading-tight">
                  {user.name} {user.surname}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate mt-0.5">
                  {user.email}
                </p>
              </div>
              <ChevronRight className={cn(
                "w-3.5 h-3.5 shrink-0 transition-all",
                pathname === "/profile"
                  ? "text-indigo-400 opacity-100"
                  : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
              )} />
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/8 to-purple-500/5 border border-indigo-500/15">
              <p className="text-xs font-semibold text-[var(--foreground)] mb-0.5">
                {t("profile", "guest")}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] mb-2.5 leading-snug">
                {t("profile", "sidebar_login_hint")}
              </p>
              <button
                onClick={() => openAuthModal()}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors active:scale-[0.97]"
              >
                <LogIn className="w-3.5 h-3.5 text-gold-200" />
                {t("auth", "login")}
              </button>
            </div>
          )}
        </div>

        {/* Credit */}
        <p className="text-center text-[9px] text-[var(--muted-foreground)]/60 pb-2 tracking-wide">
          mrforce.uz tomonidan ishlab chiqildi
        </p>
      </div>
    </aside>
  );
}
