import { useNavigate, useLocation } from "react-router-dom";
import { Bookmark, LogIn, Sun, Moon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";

// A single, present-tense page label — not the old "trova > Page Name"
// breadcrumb (that repeated what the sidebar's active item already said).
// This is just filling real dead space: an empty 900px-wide bar above
// every page read as an unfinished screen, not a clean one.
const PAGE_LABEL: Record<string, [string, string]> = {
  "/home":       ["nav", "home"],
  "/locations":  ["nav", "locations"],
  "/saved":      ["nav", "saved"],
  "/uzbekistan": ["nav", "about"],
  "/services":   ["nav", "services"],
  // "AI" alone is the abbreviated label the narrow tab bar needs; the
  // desktop header has room for the product's actual name, which is also
  // what the sidebar entry and the chat's own header both say.
  "/chat":       ["chat", "title"],
  "/profile":    ["nav", "profile"],
};

export function TopHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isDesktop } = useBreakpoint();
  const user          = useAppStore((s) => s.user);
  // Only the COUNT is rendered, so select the number rather than the array:
  // adding and removing the same place used to hand back a new array
  // identity and re-render the header even though the badge never changed.
  const planCount     = useAppStore((s) => s.plan.length);
  const theme         = useAppStore((s) => s.theme);
  const toggleTheme   = useAppStore((s) => s.toggleTheme);
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const { t } = useTranslation();
  const pageLabelKey = PAGE_LABEL[pathname];

  return (
    // No border line — the .glass blur itself is the separation, plus a
    // faint shadow (Apple toolbars rarely draw a hard rule under the bar).
    <header className="sticky top-0 z-50 h-14 flex items-center px-4 gap-3 glass bg-[var(--header-bg)] shadow-[0_1px_0_0_var(--border)]">

      {/* ── Left side — the old "trova > Page Name" breadcrumb was clutter
          (the sidebar's active item already says where you are), but
          leaving this totally empty made the whole bar read as a blank,
          unfinished strip above every page. A single quiet page label
          fills that space without repeating the sidebar. Mobile keeps
          the wordmark since there's no sidebar there to establish it. ── */}
      {isDesktop ? (
        <div className="flex-1 min-w-0">
          {pageLabelKey && (
            <span className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
              {t(pageLabelKey[0] as "nav", pageLabelKey[1])}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate("/home")}
          aria-label={t("nav", "home")}
          className="flex items-center flex-1 min-w-0 active:opacity-70 transition-opacity rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2"
        >
          <img src="/img/logo-l.svg" alt="trova" className="h-6 w-auto dark:hidden" />
          <img src="/img/logo-d.svg" alt="trova" className="h-6 w-auto hidden dark:block" />
        </button>
      )}

      {/* ── Right controls ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Global search — the full text field only makes sense where
            page-specific search actually exists (Locations). Everywhere
            else it was implying a search scope that isn't real; other
            pages just get the icon, with Ctrl+K still globally available
            via the command palette regardless of route. */}
        {isDesktop && pathname === "/locations" ? (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-xl bg-[var(--muted)] border border-transparent hover:border-indigo-500/40 text-[var(--muted-foreground)] transition-all active:scale-95"
            aria-label={t("locations", "search_placeholder")}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">{t("locations", "search_placeholder")}</span>
            <kbd className="text-[9px] font-semibold bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] rounded px-1 py-px">
              Ctrl K
            </kbd>
          </button>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--muted)] border border-transparent hover:border-indigo-500/40 transition-all active:scale-90"
            aria-label={t("locations", "search_placeholder")}
            title="Ctrl K"
          >
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--muted)] border border-transparent hover:border-indigo-500/40 transition-all active:scale-90"
          aria-label={theme === "dark" ? t("profile", "theme_light") : t("profile", "theme_dark")}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          )}
        </button>

        {/* Plan bookmark — opens the dedicated Saved Places page, not
            Profile (routing it to Profile was confusing: bookmarking a
            place has nothing to do with account settings). */}
        <button
          onClick={() => navigate("/saved")}
          className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--muted)] border border-transparent hover:border-indigo-500/40 transition-all active:scale-90"
          aria-label={`${planCount} ${t("profile", "plan_count_suffix")}`}
        >
          <Bookmark
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              planCount > 0 ? "text-indigo-500 fill-indigo-500/20" : "text-[var(--muted-foreground)]"
            )}
          />
          {planCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold bg-indigo-500 text-white leading-none shadow-sm">
              {planCount > 9 ? "9+" : planCount}
            </span>
          )}
        </button>

        {/* User avatar or login */}
        {user ? (
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl overflow-hidden hover:scale-105 transition-transform shadow-sm active:scale-95"
            aria-label={t("nav", "profile")}
          >
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size={32} className="rounded-xl text-xs" />
          </button>
        ) : (
          <button
            onClick={() => openAuthModal()}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-sm hover:-translate-y-px"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t("auth", "login")}</span>
          </button>
        )}
      </div>
    </header>
  );
}
