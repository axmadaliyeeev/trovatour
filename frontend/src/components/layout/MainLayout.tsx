import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopHeader } from "./TopHeader";
import { Toaster } from "@/components/ui/Toaster";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { TourRunner } from "./TourRunner";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    // mode="wait" made the OLD page fully fade out (220ms) before the NEW
    // one started fading in — a real blank-content gap on every route
    // change, exactly the "header/sidebar load instantly, content area
    // stays empty for a moment" bug. popLayout crossfades them instead
    // (new page renders immediately, old one animates out on top of it,
    // pulled out of document flow so it doesn't cause a layout jump).
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Keyed by pathname so navigating away from a crashed page
            resets the boundary instead of it staying stuck. */}
        <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main.scroll-main");
    if (!main) return;
    mainRef.current = main;
    const handler = () => setVisible(main.scrollTop > 320);
    main.addEventListener("scroll", handler, { passive: true });
    return () => main.removeEventListener("scroll", handler);
  }, [pathname]);

  const scrollUp = () => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={cn(
        "fixed right-4 z-40 w-10 h-10 rounded-full",
        "bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] shadow-lg",
        "flex items-center justify-center",
        "text-[var(--muted-foreground)] hover:text-indigo-400 hover:border-indigo-500/40",
        "transition-all duration-250 active:scale-90",
        "bottom-[76px] md:bottom-6",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      )}
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

// Keyboard and screen-reader users otherwise have to tab through the entire
// sidebar (5 nav items + AI + profile card) or the header controls before
// reaching page content, on every single route change. The link is visually
// hidden until it takes focus, at which point it becomes a normal, visible
// control — the standard pattern, and the first thing an accessibility
// audit looks for.
function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300]
                 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-indigo-500 focus:text-white
                 focus:text-sm focus:font-semibold focus:shadow-lg"
    >
      {label}
    </a>
  );
}

export function MainLayout() {
  const { isDesktop } = useBreakpoint();
  const { checkAuth } = useAuth();
  const { t } = useTranslation();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    checkAuth();
  }, []); // eslint-disable-line

  if (isDesktop) {
    return (
      // h-screen (not min-h-screen) gives every descendant a bounded height
      // to size against — without it, flex-1+overflow-y-auto on <main>
      // never gets a real height to overflow within, so it silently never
      // scrolls (content just gets clipped by the ancestor's overflow-hidden).
      <div className="flex h-screen app-bg overflow-hidden">
        <SkipLink label={t("nav", "skip_to_content")} />
        <Sidebar />
        <div className="ml-60 flex-1 flex flex-col h-full overflow-hidden">
          <TopHeader />
          <main id="main-content" tabIndex={-1} className="scroll-main flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
        <Toaster />
        <ScrollToTop />
        <TourRunner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh app-bg overflow-hidden">
      <SkipLink label={t("nav", "skip_to_content")} />
      <TopHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="scroll-main flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <BottomNav />
      <Toaster />
      <ScrollToTop />
    </div>
  );
}
