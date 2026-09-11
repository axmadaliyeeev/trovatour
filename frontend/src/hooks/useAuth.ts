import { useCallback } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { mergePlanOnLogin } from "@/lib/plan-sync";
import type { User } from "@/types";

interface UseAuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  authModalOpen: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  requireAuth: (callback: () => void) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export function useAuth(): UseAuthReturn {
  // Field-by-field selectors, not `useAppStore()`. Destructuring the whole
  // store subscribes the component to EVERY slice of it — so MainLayout,
  // which calls this hook purely for `checkAuth`, re-rendered the entire
  // app shell (sidebar, header, nav, the routed page) on every toast that
  // appeared or expired, every plan add/remove and every keystroke that
  // touched store state. The actions below are stable references created
  // once by zustand, so selecting them costs nothing.
  const user           = useAppStore((s) => s.user);
  const isLoggedIn     = useAppStore((s) => s.isLoggedIn);
  const login          = useAppStore((s) => s.login);
  const logout         = useAppStore((s) => s.logout);
  const updateUser     = useAppStore((s) => s.updateUser);
  const authModalOpen  = useAppStore((s) => s.authModalOpen);
  const openAuthModal  = useAppStore((s) => s.openAuthModal);
  const closeAuthModal = useAppStore((s) => s.closeAuthModal);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("trova-token");
    if (!token) return;
    try {
      const me = await apiClient.get<User>("/auth/me");
      login(me);
      mergePlanOnLogin().catch(() => {});
    } catch (err) {
      // Only drop the session on an actual auth rejection (401) — a
      // transient network error here shouldn't log out a valid session,
      // it would otherwise wipe the user's plan/profile on a flaky connection.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        localStorage.removeItem("trova-token");
        logout();
      }
    }
  }, [login, logout]);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isLoggedIn) callback();
      else openAuthModal();
    },
    [isLoggedIn, openAuthModal]
  );

  return {
    user,
    isLoggedIn,
    authModalOpen,
    login,
    logout,
    updateUser,
    checkAuth,
    requireAuth,
    openAuthModal,
    closeAuthModal,
  };
}
