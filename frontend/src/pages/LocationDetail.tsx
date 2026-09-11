import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Bookmark, BookmarkCheck, MapPin, Clock, DollarSign,
  Calendar, Bus, ExternalLink, Tag, Star, Send, Sparkles, Loader2,
  ChevronDown, ChevronUp, Share2, MessageSquare, Check, CheckCircle2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCATIONS_BY_ID, INIT_REVIEWS } from "@/data";
import { Stars } from "@/components/ui/stars";
import { MessageContent } from "@/components/chat/MessageContent";
import { useAppStore } from "@/store";
import { syncAddToPlan, syncRemoveFromPlan } from "@/lib/plan-sync";
import { useTranslation } from "@/i18n";
import { apiClient } from "@/lib/api-client";
import type { Review } from "@/types";

// ── Star Picker ──────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform active:scale-90"
        >
          <Star
            className={cn(
              "w-7 h-7 transition-colors",
              star <= (hovered || value)
                ? "fill-gold-500 text-gold-500"
                : "fill-transparent text-[var(--border)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

type TFn = ReturnType<typeof useTranslation>["t"];

// ── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, t }: { review: Review; t: TFn }) {
  return (
    <div className="p-4 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {review.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">{review.author}</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">{review.country}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars rating={review.stars} size="sm" />
          {review.verified && (
            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
              {t("detail", "verified")}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{review.text}</p>
      {review.aiTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.aiTags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-[var(--muted-foreground)]/60">{review.time}</p>
    </div>
  );
}

// ── SmartReview ───────────────────────────────────────────────────────────────
function SmartReview({
  reviews,
  locationId,
  lang,
  t,
}: {
  reviews: Review[];
  locationId: string;
  lang: string;
  t: TFn;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
  }, [reviews]);

  async function analyze() {
    if (insight) { setOpen((o) => !o); return; }
    setLoading(true);
    setError(false);
    try {
      // Was hand-rolling a hardcoded Uzbek-only prompt over whatever
      // reviews happened to be loaded client-side (mock data, ignoring
      // the interface language entirely) — the backend already has a
      // dedicated endpoint that reads the real review rows for this
      // location straight from the database and prompts the model
      // properly, so use that instead of reinventing it here.
      const res = await apiClient.post<{ insight: string }>(
        "/ai/analyze-reviews",
        { locationId, lang },
        { timeout: 45_000 }
      );
      setInsight(res.insight ?? t("detail", "insight_error"));
      setOpen(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 overflow-hidden">
      {/* Header row */}
      <button
        onClick={analyze}
        disabled={loading || !reviews.length}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-indigo-500/8 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-indigo-400">{t("detail", "smart_review_label")}</p>
            <p className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
              {reviews.length} {t("detail", "total_reviews")} ·
              <Star className="w-2.5 h-2.5 text-gold-500 fill-gold-500" />
              {avgRating.toFixed(1)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : error ? (
            <span className="text-[10px] text-red-400">{t("detail", "insight_error")}</span>
          ) : insight ? (
            open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          ) : (
            <span className="text-[10px] font-semibold">{t("detail", "ai_insight")} →</span>
          )}
        </div>
      </button>

      {/* AI insight text */}
      <AnimatePresence initial={false}>
        {open && insight && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-indigo-500/15">
              <p className="text-[11px] font-semibold text-indigo-400 mt-3 mb-1.5">{t("detail", "insight_title")}</p>
              <div className="text-xs text-[var(--foreground)]/80">
                <MessageContent text={insight} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
// Shape returned by GET/POST /api/reviews — differs from the frontend's
// own Review type only in `createdAt` (a real timestamp) vs `time` (a
// pre-formatted display string), so it needs a small adapter below.
interface BackendReview {
  id: string;
  locationId: string;
  author: string;
  country: string;
  stars: number;
  text: string;
  trustScore: number;
  aiTags: string[];
  verified: boolean;
  createdAt: string;
}

function adaptBackendReview(r: BackendReview): Review {
  return {
    id: r.id,
    locationId: r.locationId,
    author: r.author,
    country: r.country,
    stars: r.stars,
    text: r.text,
    trustScore: r.trustScore,
    aiTags: r.aiTags,
    verified: r.verified,
    time: new Date(r.createdAt).toLocaleDateString(),
  };
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToPlan      = useAppStore((s) => s.addToPlan);
  const removeFromPlan = useAppStore((s) => s.removeFromPlan);
  const showToast      = useAppStore((s) => s.showToast);
  const user           = useAppStore((s) => s.user);
  // The store's isInPlan() reads through get(), so it subscribes to
  // nothing — it only looked reactive because the whole-store destructure
  // above re-rendered this page on every store write. Selecting the
  // boolean makes the saved state genuinely reactive.
  const planIds        = useAppStore((s) => s.plan);
  const { t, lang } = useTranslation();

  const location = id ? LOCATIONS_BY_ID.get(id) : undefined;
  const initReviews = id ? (INIT_REVIEWS[id] ?? []) : [];

  // Reviews written through this page previously only ever lived in the
  // local Zustand store — they looked like they'd saved, but a refresh
  // (or opening the same location on another device) silently lost them,
  // and they were invisible to Smart Review's analysis too, since that
  // now reads straight from the same table. Fetch the real, persisted
  // reviews for this location instead.
  const [backendReviews, setBackendReviews] = useState<Review[]>([]);
  const [reviewsLoadError, setReviewsLoadError] = useState(false);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setReviewsLoadError(false);
    apiClient.get<BackendReview[]>(`/reviews/${id}`)
      .then((rows) => { if (!cancelled) setBackendReviews(rows.map(adaptBackendReview)); })
      .catch(() => {
        // Silently keeping only the static seed reviews used to leave no
        // trace that live reviews failed to load — a visitor comparing
        // review counts against Stars' badge above would have no idea
        // the page didn't actually reach the server.
        if (!cancelled) setReviewsLoadError(true);
      });
    return () => { cancelled = true; };
  }, [id]);

  const allReviews = useMemo(() => [...backendReviews, ...initReviews], [backendReviews, initReviews]);
  const REVIEWS_PAGE_SIZE = 8;
  const [reviewsVisible, setReviewsVisible] = useState(REVIEWS_PAGE_SIZE);

  // Review form state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sticky plan bar — visible when inline action buttons scroll out of view
  const actionRef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const el = actionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-indigo-500/60" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">{t("detail", "not_found_title")}</h2>
        <p className="text-[var(--muted-foreground)] text-sm text-center">{t("detail", "not_found_desc")}</p>
        <button
          onClick={() => navigate("/locations")}
          className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
        >
          {t("detail", "back_to_list")}
        </button>
      </div>
    );
  }

  const loc = location; // non-null; guard above guarantees this
  const inPlan = planIds.some((l) => l.id === loc.id);
  function togglePlan() {
    if (inPlan) {
      removeFromPlan(loc.id);
      syncRemoveFromPlan(loc.id);
      showToast(`${loc.name} ${t("card", "removed_toast")}`, undefined, "info");
    } else {
      addToPlan(loc);
      syncAddToPlan(loc.id);
      showToast(`${loc.name} ${t("card", "added_toast")}`, undefined, "success");
    }
  }

  async function shareLocation() {
    const url = window.location.href;
    const data = { title: `${loc.name} — trova`, text: loc.shortDesc ?? loc.name, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        showToast(url, undefined, "info");
      }
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  }

  const reviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (reviewTimerRef.current) clearTimeout(reviewTimerRef.current); }, []);

  async function submitReview() {
    if (!stars || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      // Actually persist it — this previously only wrote to local
      // in-memory state, so the review looked submitted but vanished on
      // refresh and never reached the database Smart Review reads from.
      const saved = await apiClient.post<BackendReview>("/reviews", {
        locationId: loc.id,
        text: text.trim(),
        stars,
        author: user?.name ?? t("profile", "guest"),
        country: user?.country,
      });
      setBackendReviews((prev) => [adaptBackendReview(saved), ...prev]);
      setStars(0);
      setText("");
      setSubmitted(true);
      reviewTimerRef.current = setTimeout(() => { setSubmitted(false); setReviewOpen(false); }, 2500);
    } catch {
      showToast(t("detail", "review_submit_error"), undefined, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // The sticky "Add to Plan" bar is `fixed`, so it doesn't push page
    // content on its own — pb-8 left a gap shorter than the bar's own
    // height, so on shorter location pages it could sit on top of
    // whatever content happened to be at the bottom of the scroll
    // (Practical Info's "Best Time to Visit" card). pb-28 reserves real
    // room so the fixed bar only ever occupies empty space.
    <div className="pb-28">
      {/* ── Hero image ──────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={loc.img}
          alt={loc.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800&q=60";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-90"
          aria-label={t("detail", "back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={shareLocation}
          className="absolute top-4 right-[68px] w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all active:scale-90"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlan}
          className={cn(
            "absolute top-4 right-4 w-11 h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all active:scale-90",
            inPlan ? "bg-indigo-500" : "bg-black/50 hover:bg-indigo-500/70"
          )}
          aria-label={inPlan ? t("detail", "remove_plan") : t("detail", "add_plan")}
        >
          {inPlan ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/80 text-white backdrop-blur-sm mb-2">
            {t("home", `cat_${loc.category}` as Parameters<typeof t>[1])}
          </span>
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-1">{loc.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {loc.city}, {loc.region}
            </span>
            <Stars rating={loc.rating} size="sm" showNumber showCount count={loc.reviewCount + backendReviews.length} />
          </div>
        </div>
      </div>

      {/* ── Info cards ──────────────────────────────────────────── */}
      {/* Explicit Level-1 treatment: card fill + border + shadow together
          (not border alone) so these read as distinct lifted panels
          against the page, not a same-toned rectangle. */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2 mb-5">
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
          <DollarSign className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-[var(--foreground)] text-center leading-tight">
            {loc.priceUSD === 0 ? t("detail", "free") : loc.price}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]">{t("detail", "price_label")}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-[var(--foreground)] text-center leading-tight">{loc.duration}</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">{t("detail", "duration_label")}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-[var(--foreground)] text-center leading-tight">
            {loc.bestSeason.split(",")[0] ?? loc.bestSeason}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]">{t("detail", "season_label")}</span>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────── */}
      <section className="px-4 mb-5">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-2">{t("detail", "description")}</h2>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{loc.fullDesc}</p>
      </section>

      {/* ── Practical info ──────────────────────────────────────── */}
      <section className="px-4 mb-5">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-3">{t("detail", "practical_info")}</h2>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
            <Clock className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">{t("detail", "hours")}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{loc.hours}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
            <Bus className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">{t("detail", "how_to_get")}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{loc.transport}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
            <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">{t("detail", "best_season")}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{loc.bestSeason}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tags ────────────────────────────────────────────────── */}
      {loc.tags.length > 0 && (
        <section className="px-4 mb-5">
          <h2 className="text-base font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" /> {t("detail", "tags_section")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {loc.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-[var(--muted)] text-[11px] font-medium text-[var(--muted-foreground)]">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews & SmartReview ────────────────────────────────── */}
      <section className="px-4 mb-5">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("detail", "reviews")}
            <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full border border-[var(--border)]">
              {allReviews.length}
            </span>
          </h2>
          <button
            onClick={() => setReviewOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15"
          >
            <Star className="w-3.5 h-3.5" />
            {t("detail", "write_review")}
          </button>
        </div>

        {/* SmartReview AI panel */}
        <div className="mb-3">
          <SmartReview reviews={allReviews} locationId={loc.id} lang={lang} t={t} />
        </div>

        {/* Review form */}
        <AnimatePresence initial={false}>
        {reviewOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
          <div className="mb-4 p-4 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] space-y-3">
            {submitted ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <CheckCircle2 className="w-6 h-6 text-indigo-500" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-[var(--foreground)]">{t("detail", "review_success")}</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)] mb-2">{t("detail", "your_rating")}</p>
                  <StarPicker value={stars} onChange={setStars} />
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("detail", "review_placeholder")}
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl resize-none text-sm",
                    "bg-[var(--muted)] border border-[var(--border)]",
                    "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                    "outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  )}
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitReview}
                    disabled={!stars || !text.trim() || submitting}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      stars && text.trim() && !submitting
                        ? "bg-indigo-500 hover:bg-indigo-600 text-white active:scale-[0.97]"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {t("detail", "submit_review")}
                  </button>
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] text-sm hover:bg-[var(--muted)] transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Reviews list */}
        {allReviews.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-indigo-500/40" strokeWidth={1.5} />
            <p>{t("detail", "no_reviews")}</p>
            <button
              onClick={() => setReviewOpen(true)}
              className="mt-3 text-indigo-400 text-xs font-semibold hover:text-indigo-300 transition-colors"
            >
              {t("detail", "add_first_review")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {allReviews.slice(0, reviewsVisible).map((review) => (
              <ReviewCard key={review.id} review={review} t={t} />
            ))}
            {reviewsVisible < allReviews.length && (
              <button
                onClick={() => setReviewsVisible((v) => v + REVIEWS_PAGE_SIZE)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors"
              >
                {t("detail", "load_more_reviews")}
              </button>
            )}
          </div>
        )}
        {reviewsLoadError && (
          <p className="mt-3 text-[11px] text-[var(--muted-foreground)]/70 text-center">
            {t("detail", "reviews_load_error")}
          </p>
        )}
      </section>

      {/* ── Action buttons ──────────────────────────────────────── */}
      <div ref={actionRef} className="px-4 flex gap-3">
        <button
          onClick={togglePlan}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]",
            inPlan
              ? "bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25"
              : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
          )}
        >
          {inPlan ? (
            <><BookmarkCheck className="w-4 h-4" /> {t("detail", "remove_plan")}</>
          ) : (
            <><Bookmark className="w-4 h-4" /> {t("detail", "add_plan")}</>
          )}
        </button>

        <a
          href={loc.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] hover:border-indigo-500/40 text-[var(--foreground)] text-sm font-semibold transition-all active:scale-[0.97]"
        >
          <ExternalLink className="w-4 h-4 text-indigo-400" />
          {t("detail", "map")}
        </a>
      </div>

      {/* ── Sticky plan bar (appears when action buttons scroll off screen) ── */}
      <div
        className={cn(
          "fixed left-0 right-0 z-40 transition-all duration-300",
          "bottom-[62px] md:bottom-0",
          stickyVisible ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-auto max-w-2xl px-4 pb-3 pt-2 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
          <button
            onClick={togglePlan}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] shadow-md",
              inPlan
                ? "bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            )}
          >
            {inPlan ? (
              <><BookmarkCheck className="w-4 h-4" /> {t("detail", "remove_plan")}</>
            ) : (
              <><Bookmark className="w-4 h-4" /> {t("detail", "add_plan")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
