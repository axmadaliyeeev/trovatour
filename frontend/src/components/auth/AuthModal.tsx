import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";
import { LoginTab, RegisterTab } from "./AuthForms";

// ── Main modal ────────────────────────────────────────────────────────────────
export function AuthModal() {
  // Also mounted app-wide and closed almost all the time — same reason as
  // the command palette for selecting fields instead of the whole store.
  const authModalOpen  = useAppStore((s) => s.authModalOpen);
  const authModalTab   = useAppStore((s) => s.authModalTab);
  const closeAuthModal = useAppStore((s) => s.closeAuthModal);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const tabResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (tabResetTimer.current) clearTimeout(tabResetTimer.current); }, []);

  // Whichever tab the caller asked for (openAuthModal("register") from
  // the landing page's "Get Started" CTA, vs the plain "Sign In" link)
  // becomes the tab shown when the modal opens.
  useEffect(() => {
    if (authModalOpen) setActiveTab(authModalTab);
  }, [authModalOpen, authModalTab]);

  function handleClose() {
    closeAuthModal();
    if (tabResetTimer.current) clearTimeout(tabResetTimer.current);
    tabResetTimer.current = setTimeout(() => setActiveTab("login"), 300);
  }

  return (
    <Dialog.Root open={authModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <AnimatePresence>
        {authModalOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                // Darker scrim + a real blur radius (not backdrop-blur-sm's
                // 4px) — the page header behind was faintly legible through
                // the old weak blur, which read as "doubled/overlapping
                // text" once the modal's own header sat near the same spot.
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xl"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              {/* Mobile: full-width bottom sheet anchored to the screen
                  edge (rounded top corners only) instead of a small
                  centered card with large dark margins either side.
                  Desktop keeps the centered card. */}
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center outline-none">
                <motion.div
                  // Calm tween in/out (no elastic/spring overshoot) — faster
                  // out than in, per the "modal entrance" motion spec.
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, y: 40, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
                  // Level 2: a neutral surface off the green ramp entirely,
                  // so the modal never reads as "the page, just blurred".
                  className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-[var(--modal-border)] bg-[var(--modal)] shadow-[var(--shadow-modal)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:p-5 sm:m-4 max-h-[90vh] overflow-y-auto"
                >
                  {/* Grab handle — sheet-only affordance, hidden on the
                      desktop centered-card layout. */}
                  <div className="sm:hidden w-9 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <img src="/img/logo-l.svg" alt="trova" className="h-5 w-auto dark:hidden" />
                      <img src="/img/logo-d.svg" alt="trova" className="h-5 w-auto hidden dark:block" />
                    </div>
                    <Dialog.Close asChild>
                      <button className="w-11 h-11 rounded-full flex items-center justify-center transition-colors -mr-2" aria-label="Close">
                        <span className="w-7 h-7 rounded-full bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center transition-colors">
                          <X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        </span>
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="flex rounded-xl bg-[var(--muted)] p-1 mb-5 gap-1">
                    {(["login", "register"] as const).map((tab) => {
                      const active = activeTab === tab;
                      return (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className={cn("relative flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                            active ? "text-white" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
                          {active && (
                            <motion.span
                              layoutId="auth-tab-pill"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                              className="absolute inset-0 rounded-lg bg-indigo-500 shadow-sm"
                            />
                          )}
                          <span className="relative">{tab === "login" ? t("auth", "login") : t("auth", "register")}</span>
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === "login" ? <LoginTab onClose={handleClose} /> : <RegisterTab onClose={handleClose} />}
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
