import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import type { Toast } from "@/store";

export function Toaster() {
  // Selectors, not a whole-store destructure — the Toaster is mounted for
  // the entire session, so subscribing it to every slice meant a plan
  // change or a theme toggle re-rendered it (and re-ran its
  // AnimatePresence diff) for no reason.
  const toasts       = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const styles = {
    success: "border-indigo-500/25 shadow-indigo-500/8",
    info:    "border-gold-500/25 shadow-gold-500/8",
    error:   "border-red-500/25 shadow-red-500/8",
  };

  const iconEl =
    toast.type === "error" ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> :
    toast.type === "info"  ? <Info className="w-4 h-4 text-gold-500 shrink-0" /> :
                             <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role="status"
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl w-full",
        "glass bg-[var(--card)]",
        styles[toast.type ?? "success"]
      )}
    >
      {toast.icon ? (
        <span className="text-base shrink-0" aria-hidden="true">{toast.icon}</span>
      ) : (
        iconEl
      )}
      <p className="text-sm font-medium text-[var(--foreground)] flex-1 leading-tight">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors active:scale-90"
        aria-label="Yopish"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
