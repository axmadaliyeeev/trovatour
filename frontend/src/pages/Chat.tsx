import { useState, useRef, useEffect, useMemo, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send, User as UserIcon, Loader2, RotateCcw, MapPin, Sparkles, X,
  Copy, Check, RefreshCw, ChevronDown, ThumbsUp, ThumbsDown,
  Landmark, Hotel, Bus, Star as StarIcon, Lightbulb, AlertTriangle, Square,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { useTranslation, LOCALE_TAGS } from "@/i18n";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { MessageContent } from "@/components/chat/MessageContent";
import { Avatar } from "@/components/ui/Avatar";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { LOCATIONS } from "@/data";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
  reaction?: "up" | "down" | null;
}

// Lightweight heuristic: if the assistant mentions a place we actually
// have in the catalog by name, surface it as a real, clickable card
// instead of leaving it as unlinked plain text.
function findMentionedLocations(text: string) {
  return LOCATIONS.filter((l) => text.includes(l.name)).slice(0, 3);
}

// Split out and memoized: a message's mentioned-locations scan only needs
// to re-run when that message's own text changes, not on every re-render
// of the whole message list (typing, reactions, other messages arriving).
const MentionedLocations = memo(function MentionedLocations({
  text,
  onOpen,
}: {
  text: string;
  onOpen: (id: string) => void;
}) {
  const mentioned = useMemo(() => findMentionedLocations(text), [text]);
  if (!mentioned.length) return null;
  return (
    <div className="flex flex-col items-start gap-1.5 pt-1">
      {mentioned.map((loc) => (
        <button
          key={loc.id}
          onClick={() => onOpen(loc.id)}
          className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[var(--card)]/70 border border-[var(--border)] hover:border-indigo-500/40 hover:bg-[var(--card)] hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.98] text-left w-full max-w-[240px]"
        >
          <img src={loc.img} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-[var(--foreground)] truncate">{loc.name}</span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
              <MapPin className="w-2.5 h-2.5 text-indigo-500" />{loc.city}
            </span>
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-400 shrink-0">
            <StarIcon className="w-3 h-3 fill-gold-400" />{loc.rating}
          </span>
        </button>
      ))}
    </div>
  );
});

// The Trova AI "face" — an S-curve echoing the wordmark, not a generic
// bot/robot glyph. Same route-motif as the sidebar indicator and the
// hero divider, so the assistant reads as an extension of the brand
// mark rather than a stock chat-app icon.
function RouteOrb({ className }: { className?: string }) {
  return (
    // The emerald->mint orb gradient goes nearly white at its bottom-right
    // corner, right where this path's top-right endpoint sits — a plain
    // white stroke would all but disappear there. A soft drop-shadow keeps
    // it legible regardless of what's behind it, on any orb background.
    <svg
      viewBox="0 0 24 24" fill="none" className={className}
      style={{ filter: "drop-shadow(0 1px 1.5px rgba(11,40,25,0.35))" }}
    >
      <path
        d="M5 18C5 18 5 11 12 11C19 11 19 6 19 6"
        stroke="white" strokeWidth="2.2" strokeLinecap="round"
      />
      <circle cx="5" cy="18" r="1.6" fill="white" />
      <circle cx="19" cy="6" r="1.6" fill="white" />
    </svg>
  );
}

// Date.now() alone can collide — a fast double-tap on a suggestion card
// (both click handlers can fire before React commits the isLoading state
// that would normally block the second one) produced two messages with
// the same id, which React then rendered as duplicate/conflicting keys.
function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// A timed-out/network failure (most often a free-tier backend cold-booting)
// reads very differently to a user than a genuine server error.
function extractChatError(err: unknown, fallback: string, wakingUp: string): string {
  // isAxiosError actually checks the shape rather than assuming any thrown
  // value looks like one — a bug elsewhere (a plain TypeError, say) no
  // longer gets misread as "the server is waking up".
  if (!isAxiosError<{ message?: string }>(err)) return fallback;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === "ECONNABORTED" || !err.response) return wakingUp;
  return fallback;
}

export default function Chat() {
  const plan      = useAppStore((s) => s.plan);
  const user      = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();

  function makeWelcomeMessage(): Message {
    return { id: "welcome", role: "assistant", content: t("chat", "welcome"), timestamp: new Date() };
  }

  // lucide icons instead of emoji — some emoji (🗺️, flags, etc.) render as
  // broken/boxy glyphs on Windows without full color-emoji font support;
  // an SVG icon looks identical on every platform.
  const QUICK_ACTIONS = [
    { icon: Landmark,  color: "text-indigo-400",  bg: "bg-indigo-500/8", label: t("chat", "quick_samarqand"), text: t("chat", "quick_samarqand_prompt") },
    { icon: Hotel,     color: "text-gold-500",    bg: "bg-gold-500/8",   label: t("chat", "quick_hotel"),     text: t("chat", "quick_hotel_prompt") },
    { icon: Bus,       color: "text-indigo-400",  bg: "bg-indigo-500/8", label: t("chat", "quick_transport"), text: t("chat", "quick_transport_prompt") },
    { icon: StarIcon,  color: "text-indigo-400",  bg: "bg-indigo-500/8", label: t("chat", "quick_top"),       text: t("chat", "quick_top_prompt") },
    { icon: Lightbulb, color: "text-gold-500",    bg: "bg-gold-500/8",   label: t("chat", "quick_tips"),      text: t("chat", "quick_tips_prompt") },
  ];

  const [messages, setMessages] = useState<Message[]>(() => [makeWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [planBannerDismissed, setPlanBannerDismissed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastUserTextRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasNearBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  // Only auto-scroll to new messages if the user was already near the
  // bottom — jumping the view while someone has scrolled up to reread
  // earlier replies is exactly the kind of thing that reads as unpolished.
  useEffect(() => {
    if (wasNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleScroll() {
    const el = scrollAreaRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 40;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    wasNearBottomRef.current = nearBottom;
    // Only worth showing the jump-to-latest button when there's actually
    // somewhere to jump from — a short conversation that doesn't overflow
    // the viewport has no "away from the bottom" state to speak of. Also
    // never show it over the empty-state scenario cards (messages.length
    // <= 1) — it was floating on top of the "Transport" suggestion card
    // there, since that content alone can overflow a short phone screen
    // with nothing real to "jump to" yet.
    setShowScrollButton(hasOverflow && !nearBottom && messages.length > 1);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function buildPlanContext(): string | undefined {
    if (!plan.length) return undefined;
    return plan.map((loc) => `${loc.name} (${loc.city})`).join(", ");
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    lastUserTextRef.current = text.trim();

    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    wasNearBottomRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messages
        .filter((m) => m.id !== "welcome" && !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));

      // Backend caps chat history at 10 messages (ai.router.ts chatSchema) —
      // keep only the most recent turns so long conversations don't 422.
      const apiMessages = [...history, { role: "user" as const, content: text.trim() }].slice(-10);

      // Longer timeout here: a cold-started backend + actual model
      // generation time can together take well past the default timeout.
      const res = await apiClient.post<{ reply: string }>(
        "/ai/chat",
        // lang is the interface's current locale — the backend replies in
        // it by default, but still switches to whatever language the
        // user actually typed in for that specific message.
        { messages: apiMessages, userContext: { plan: buildPlanContext(), lang } },
        { timeout: 45_000, signal: controller.signal }
      );

      const assistantMsg: Message = {
        id: makeId(),
        role: "assistant",
        content: res.reply ?? t("chat", "error"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // A user-initiated cancel isn't an error worth a message bubble —
      // just drop back to idle silently.
      if (controller.signal.aborted) return;
      const errMsg: Message = {
        id: makeId(),
        role: "assistant",
        content: extractChatError(err, t("chat", "error"), t("chat", "waking_up")),
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function cancelRequest() {
    abortRef.current?.abort();
  }

  function retryLastMessage() {
    if (!lastUserTextRef.current) return;
    setMessages((prev) => prev.filter((m) => !m.isError));
    sendMessage(lastUserTextRef.current);
  }

  async function copyMessage(msg: Message) {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId((id) => (id === msg.id ? null : id)), 1800);
    } catch {
      // Clipboard permission denied — nothing to recover, just skip silently.
    }
  }

  function setMessageReaction(id: string, reaction: "up" | "down") {
    let didSet = false;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const cleared = m.reaction === reaction;
        didSet = !cleared;
        return { ...m, reaction: cleared ? null : reaction };
      })
    );
    // Only thank the user for an actual new reaction — re-clicking the
    // same button clears it (no feedback was just given), so toasting
    // there was both wrong and, combined with no de-dupe in the toast
    // store, the actual cause of the reported spam: rapid clicks toggled
    // on/off repeatedly, firing a toast on every single one.
    if (didSet) showToast(t("chat", "reaction_thanks"), undefined, "info");
  }

  function sendPlanTourRequest() {
    if (!plan.length) return;
    const locationNames = plan.map((loc) => `${loc.name} (${loc.city})`).join(", ");
    const msg = `${t("chat", "plan_tour_intro")} ${locationNames}. ${t("chat", "plan_tour_outro")}`;
    sendMessage(msg);
    setPlanBannerDismissed(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Skip while an IME composition is active (e.g. Chinese/Japanese input) —
    // otherwise Enter-to-confirm-candidate would send the message mid-composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function resetChat() {
    setMessages([makeWelcomeMessage()]);
    setInput("");
    setPlanBannerDismissed(false);
  }

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [makeWelcomeMessage()];
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function formatTime(date: Date) {
    return date.toLocaleTimeString(LOCALE_TAGS[lang], { hour: "2-digit", minute: "2-digit" });
  }

  const showPlanBanner = plan.length > 0 && !planBannerDismissed && messages.length <= 1;
  const showQuickActions = messages.length <= 1;

  return (
    // Full-bleed: this used to be max-w-[720px] mx-auto on the OUTER
    // panel, which shrank the header and input bars down to a narrow
    // column with dead space on either side — reading as a widget boxed
    // inside the page rather than a native full-page view. The panel now
    // fills the whole content area; each inner row (header, messages,
    // input) centers its own content at 720px instead, the same way
    // ChatGPT's header/composer span edge-to-edge while the text column
    // stays readable-width.
    <div
      className="relative flex flex-col overflow-hidden w-full"
      style={{
        height: isDesktop
          ? "calc(100dvh - 3.5rem)"
          : "calc(100dvh - 3.5rem - 72px - env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Header — flat and quiet: a solid-fill orb with a small state dot
          (idle vs. thinking) instead of a permanently animated ring, a
          plain label instead of a tinted subtitle. Modern minimal chat
          UIs (Claude, ChatGPT) don't put motion in the header at rest —
          motion is reserved for state changes, not idling. */}
      <div className="border-b border-[var(--border)] bg-[var(--header-bg)] shrink-0 relative z-20 w-full">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 max-w-[720px] mx-auto">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
            <RouteOrb className="w-4.5 h-4.5" />
            <span
              className={cn(
                "absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-[var(--background)] transition-colors",
                isLoading ? "bg-gold-500 animate-pulse" : "bg-indigo-400"
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{t("chat", "title")}</p>
            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
              {t("chat", "subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {plan.length > 0 && (
            <div className="hidden xs:flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[var(--muted)] border border-[var(--border)] shrink-0">
              <MapPin className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-[11px] font-medium text-[var(--muted-foreground)] whitespace-nowrap">
                {plan.length} {t("chat", "places")}
              </span>
            </div>
          )}
          <button
            onClick={resetChat}
            className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg text-[var(--muted-foreground)] text-xs hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors shrink-0"
            aria-label={t("chat", "reset")}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("chat", "reset")}</span>
          </button>
        </div>
      </div>
      </div>

      {/* Messages area — the scroll container spans full width so its
          scrollbar sits at the true content-area edge; the message
          column inside centers at 720px. This outer wrapper is the
          positioning context for the jump-to-latest button below —
          scoped to just the message viewport (not the whole page), so
          the button can only ever float at the bottom of what's
          scrollable, never over the composer below it. */}
      <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-3 sm:px-4 pt-5 pb-4"
      >
        <div className="max-w-[720px] mx-auto space-y-4">
        {/* Empty-state hero — soft pulsing orb + centered heading instead
            of just another chat bubble, so the first screen reads as "an
            assistant is here" rather than a blank inbox. */}
        {showQuickActions && !isLoading && (
          <div className="flex flex-col items-center text-center pt-6 pb-6 animate-fade-up">
            <div className="w-14 h-14 mb-4 rounded-full bg-indigo-500 flex items-center justify-center">
              <RouteOrb className="w-7 h-7" />
            </div>
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
              {t("chat", "empty_heading")}
            </h2>
          </div>
        )}

        <AnimatePresence initial={false}>
        {messages.filter((m) => m.id !== "welcome" || !showQuickActions).map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className={cn(
              "group flex gap-2.5",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {msg.role === "user" && user ? (
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size={28} className="text-sm shrink-0 mt-0.5" />
            ) : (
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 font-bold",
                  msg.role === "assistant"
                    ? msg.isError
                      ? "bg-red-500/15 border border-red-500/30 text-red-400"
                      : "bg-indigo-500 text-white"
                    : "bg-indigo-500/80 text-white"
                )}
              >
                {msg.role === "assistant" ? (
                  msg.isError ? <AlertTriangle className="w-3.5 h-3.5" /> : <RouteOrb className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>
            )}

            <div
              className={cn(
                "max-w-[88%] xs:max-w-[85%] sm:max-w-[80%] space-y-1",
                msg.role === "user" ? "items-end" : "items-start",
                "flex flex-col"
              )}
            >
              <div
                className={cn(
                  "text-sm leading-relaxed w-full",
                  msg.role === "assistant"
                    ? msg.isError
                      ? "px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl rounded-tl-sm bg-red-500/8 border border-red-500/25 text-[var(--foreground)]"
                      // Now that --card is a neutral graphite (not a
                      // saturated green fill), a flat bordered card reads
                      // as a calm contained surface rather than a second
                      // loud bubble — important for structured replies
                      // (numbered lists, bold labels) to have a clear
                      // boundary instead of floating on the page. No
                      // shadow: a border alone is enough separation from
                      // the page background, and skipping it keeps a long
                      // conversation looking calm rather than every turn
                      // casting its own little shadow down the column.
                      : "px-4 py-4 sm:px-6 sm:py-5 rounded-2xl max-w-[720px] bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] break-words"
                    : "px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl rounded-tr-sm bg-indigo-500 text-white"
                )}
              >
                <MessageContent text={msg.content} />
                {msg.isError && (
                  <button
                    onClick={retryLastMessage}
                    className="ripple mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/12 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors active:scale-[0.96]"
                  >
                    <motion.span whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                      <RefreshCw className="w-3 h-3" />
                    </motion.span>
                    {t("chat", "retry")}
                  </button>
                )}
              </div>

              {/* Inline mini-cards for any catalog location the reply
                  actually mentions by name — turns a place-drop in plain
                  text into something clickable that ties back to the
                  location catalog instead of just being a proper noun. */}
              {msg.role === "assistant" && !msg.isError && (
                <MentionedLocations
                  text={msg.content}
                  onOpen={(id) => navigate(`/locations/${id}`)}
                />
              )}

              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-[var(--muted-foreground)]/60">
                  {formatTime(msg.timestamp)}
                </span>
                {msg.role === "assistant" && !msg.isError && msg.id !== "welcome" && (
                  <>
                    {/* Bumped to a real 18px icon in a 28px hit target, with
                        an explicit dark-mode color floor (#94a3b8) — these
                        were reading as near-invisible at 14px/opacity-50
                        against the dark background. */}
                    <button
                      onClick={() => copyMessage(msg)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg opacity-90 sm:opacity-70 sm:group-hover:opacity-100 text-[var(--muted-foreground)] dark:text-[#94a3b8] hover:text-indigo-400 hover:bg-[var(--muted)] transition-all active:scale-90"
                      aria-label="Copy"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copiedId === msg.id ? (
                          <motion.span key="check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                            <Check className="w-[18px] h-[18px] text-indigo-400" />
                          </motion.span>
                        ) : (
                          <motion.span key="copy" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                            <Copy className="w-[18px] h-[18px]" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    <button
                      onClick={() => setMessageReaction(msg.id, "up")}
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-lg opacity-90 sm:opacity-70 sm:group-hover:opacity-100 transition-all active:scale-90 hover:bg-[var(--muted)]",
                        msg.reaction === "up" ? "text-indigo-500 opacity-100" : "text-[var(--muted-foreground)] dark:text-[#94a3b8] hover:text-indigo-400"
                      )}
                      aria-label="Good reply"
                    >
                      <ThumbsUp className={cn("w-[18px] h-[18px]", msg.reaction === "up" && "fill-indigo-500")} />
                    </button>
                    <button
                      onClick={() => setMessageReaction(msg.id, "down")}
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-lg opacity-90 sm:opacity-70 sm:group-hover:opacity-100 transition-all active:scale-90 hover:bg-[var(--muted)]",
                        msg.reaction === "down" ? "text-red-400 opacity-100" : "text-[var(--muted-foreground)] dark:text-[#94a3b8] hover:text-red-400"
                      )}
                      aria-label="Bad reply"
                    >
                      <ThumbsDown className={cn("w-[18px] h-[18px]", msg.reaction === "down" && "fill-red-400")} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Scenario cards + two suggestion chips — replaces the old
            labelled list with the "here's what I can do" pattern from the
            spec's chat-screen reference. */}
        {showQuickActions && !isLoading && (
          <div className="max-w-lg mx-auto w-full pt-3 animate-fade-up delay-200">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 mb-4">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.text)}
                  className={cn(
                    "animate-fade-up group flex items-center gap-3 p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-left text-xs font-semibold text-[var(--foreground)] hover:border-indigo-500/40 hover:bg-[var(--card-hover)] transition-colors duration-150 active:scale-[0.98]",
                    // Five cards in a two-column grid left the last one as
                    // an orphan with a hole beside it — the block read as
                    // an unfinished layout rather than a composed set.
                    // Letting the odd card span the full width turns the
                    // remainder into a deliberate 2 + 2 + 1 arrangement.
                    i === QUICK_ACTIONS.length - 1 && QUICK_ACTIONS.length % 2 === 1 && "xs:col-span-2"
                  )}
                  style={{ animationDelay: `${250 + i * 60}ms` }}
                >
                  <span className={cn("flex items-center justify-center w-9 h-9 rounded-xl shrink-0", action.bg)}>
                    <action.icon className={cn("w-4 h-4", action.color)} strokeWidth={2} />
                  </span>
                  <span className="flex-1 leading-snug">{action.label}</span>
                  <Send className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>

            {/* Two short example questions, styled as plain pill chips —
                lower-commitment than the scenario cards above. */}
            <div className="flex flex-wrap justify-center gap-2">
              {[t("chat", "quick_samarqand_prompt"), t("chat", "quick_top_prompt")].map((chip, i) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="animate-fade-up px-3.5 min-h-[40px] rounded-full bg-[var(--muted)] border border-[var(--border)] text-[11px] text-[var(--foreground)]/75 hover:text-[var(--foreground)] hover:border-indigo-500/30 transition-all active:scale-[0.96]"
                  style={{ animationDelay: `${450 + i * 60}ms` }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-2.5"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <RouteOrb className="w-4 h-4" />
            </div>
            <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-[var(--card)] border border-[var(--border)]">
              <div className="flex items-center gap-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Jump-to-latest — previously lived *inside* the scrollable message
          column, absolutely positioned against it. Because that column is
          also a `space-y-4` flex parent, the button was a flex child of
          the same stack as the message bubbles; depending on scroll
          position it could render visually on top of mid-conversation
          text instead of pinned at the true bottom edge (reported as a
          stray chevron floating mid-sentence). Anchoring it to this outer
          container instead — a sibling of the scroll area, not a child
          inside it — means it can only ever sit just above the composer,
          never overlapping message content. */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)] text-xs font-semibold text-[var(--foreground)] hover:border-indigo-500/40 transition-colors z-20"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
      </div>

      {/* Plan banner */}
      {showPlanBanner && (
        <div className="px-3 sm:px-4 pb-3 shrink-0 space-y-3 max-w-[720px] mx-auto w-full">
          {/* Plan-aware tour creation banner */}
          {showPlanBanner && (
            <div className="relative rounded-2xl border border-indigo-500/40 bg-indigo-500/8 p-3.5 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 -translate-y-6 translate-x-6 pointer-events-none" />
              <button
                onClick={() => setPlanBannerDismissed(true)}
                className="absolute top-0 right-0 w-11 h-11 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <X className="w-3 h-3" />
                </span>
              </button>
              <div className="flex items-start gap-2.5 pr-6">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-400 mb-0.5">
                    {plan.length} {t("chat", "plan_banner_title")}
                  </p>
                  <p className="text-[11px] text-[var(--foreground)]/70 leading-snug mb-2.5">
                    {plan.slice(0, 3).map(l => l.name).join(", ")}
                    {plan.length > 3 && ` ${t("chat", "plan_banner_desc")} ${plan.length - 3} ${t("chat", "plan_banner_more")}`}
                  </p>
                  <div className="flex gap-2">
                    {/* The one action on this screen that kicks off real AI
                        work, so it gets the animated treatment — and the
                        letters keep moving while the request is in flight,
                        which doubles as the loading state. */}
                    <GenerateButton
                      onClick={sendPlanTourRequest}
                      generating={isLoading}
                      labelIdle={t("chat", "plan_btn")}
                      labelActive={t("chat", "plan_generating")}
                      className="!px-4 !py-2 !text-xs !rounded-xl"
                    />
                    <button
                      onClick={() => navigate("/saved")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs hover:text-[var(--foreground)] transition-all"
                    >
                      <MapPin className="w-3 h-3" />
                      {t("chat", "plan_view")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Input area — full-width bar, content centered at 720px */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2.5 border-t border-[var(--border)] bg-[var(--header-bg)] shrink-0">
      <div className="max-w-[720px] mx-auto">
        <div
          className={cn(
            // A neutral, recessed surface (not the same --card tone as
            // message/recommendation cards) so the input reads as "where
            // you type" and the send button stays the one bright accent —
            // not another green card competing for attention. Fully
            // rounded (pill), with a real :focus-within state — the border
            // alone communicates focus, no glow ring needed.
            "flex items-end gap-2 p-1.5 rounded-full bg-[var(--muted)] border border-[var(--border)] transition-colors duration-150",
            "focus-within:border-indigo-500"
          )}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat", "input_placeholder")}
            aria-label={t("chat", "input_placeholder")}
            rows={1}
            className={cn(
              "flex-1 px-3.5 py-2.5 rounded-full resize-none bg-transparent",
              "text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)]",
              "outline-none max-h-32 overflow-y-auto"
            )}
            style={{ height: "auto", minHeight: "40px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
            disabled={isLoading}
          />
          <button
            onClick={() => (isLoading ? cancelRequest() : sendMessage(input))}
            disabled={!isLoading && !input.trim()}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-colors active:scale-95 shrink-0",
              isLoading || (input.trim() && !isLoading)
                ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
            )}
            aria-label={isLoading ? t("chat", "cancel_label") : t("chat", "send_label")}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex items-center justify-center w-4 h-4">
                  <Loader2 className="absolute inset-0 w-4 h-4 animate-spin opacity-40" />
                  <Square className="w-2 h-2 fill-current" />
                </motion.span>
              ) : (
                <motion.span
                  key="send"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Send className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
        <p className="hidden sm:block text-[10px] text-[var(--muted-foreground)]/60 text-center mt-2">
          {t("chat", "hint")}
        </p>
        <p className="text-[10px] text-[var(--muted-foreground)]/50 text-center mt-1.5 px-4">
          {t("chat", "disclaimer")}
        </p>
      </div>
      </div>
    </div>
  );
}
