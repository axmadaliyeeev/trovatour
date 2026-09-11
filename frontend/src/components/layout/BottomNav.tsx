import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, Bot, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  function isActive(route: string) {
    if (route === "/home") return pathname === "/home";
    // exact match for top-level routes; also catch sub-routes for /locations
    if (route === "/locations") return pathname === "/locations" || pathname.startsWith("/locations/");
    return pathname === route || pathname.startsWith(route + "/");
  }

  const TABS = [
    { route: "/home",      Icon: Home,       label: t("nav", "home")      },
    { route: "/locations", Icon: MapPin,     label: t("nav", "locations") },
    { route: "/chat",      Icon: Bot,        label: "Trova AI"            },
    { route: "/services",  Icon: LayoutGrid, label: t("nav", "services")  },
    { route: "/profile",   Icon: User,       label: t("nav", "profile")   },
  ] as const;

  return (
    <nav
      aria-label={t("nav", "primary")}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--nav-bg)] border-t border-[var(--border)] glass"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center h-[58px]">
        {/* One rule for every tab, including AI: active = filled emerald
            chip + white icon + emerald label; inactive = no chip, plain
            gray icon + gray label. The AI tab used to always show its
            filled pill regardless of route, which made it read as a
            different component bolted onto the nav rather than a normal
            tab that happens to be active sometimes. */}
        {TABS.map(({ route, Icon, label }) => {
          const active = isActive(route);
          return (
            <button
              key={route}
              onClick={() => navigate(route)}
              // The active tab is signalled only by colour + a filled chip.
              // aria-current is what makes that state exist for a screen
              // reader; without it the bar announces five identical buttons.
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5",
                "transition-all duration-200 active:scale-90",
                "min-w-[44px]" // touch target
              )}
              aria-label={label}
            >
              {/* Active top line — shared sliding indicator */}
              {active && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  transition={SPRING}
                  className="absolute top-0 w-6 h-0.5 rounded-b-full bg-indigo-500"
                />
              )}

              {/* Icon chip + badge */}
              <div className="relative flex items-center justify-center w-9 h-9">
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-250",
                  active ? "bg-indigo-500 shadow-sm scale-100" : "scale-90 opacity-0"
                )} />
                <Icon className={cn(
                  "relative transition-all duration-250 w-5 h-5",
                  active ? "text-white scale-105" : "text-[var(--muted-foreground)]"
                )} />
                {/* Saved-places count used to sit on the Profile tab — a
                    leftover from when the plan lived inside Profile. The
                    plan moved to /saved, which on mobile is reached through
                    the TopHeader bookmark button (which already shows this
                    same count), so the duplicate here pointed at the wrong
                    destination AND double-counted the one number. Removed
                    rather than re-pointed: there is no Saved tab down here,
                    and a badge on a tab that doesn't open the badged thing
                    is worse than no badge. */}
              </div>

              <span className={cn(
                "text-[9px] leading-none transition-colors",
                active ? "text-indigo-500 font-semibold" : "text-[var(--muted-foreground)] font-medium"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
