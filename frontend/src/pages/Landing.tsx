import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot, Compass, ShieldCheck, Globe2, ChevronRight,
  MessageSquareText, Map as MapIcon, Sparkles, Star, Users, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCATIONS } from "@/data";
import { LocationCard } from "@/components/locations/LocationCard";
import { PriorityMotionImg } from "@/components/shared/PriorityImg";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";
import heroImg from "@/data/registan.jpg";

// ── Scroll-reveal helpers ──────────────────────────────────────────────────
// Real framer-motion viewport reveals (not just a CSS class toggled by
// IntersectionObserver) so groups of cards can stagger their children in
// one coordinated animation instead of each firing independently.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

function Reveal({
  children,
  className,
  as: stagger = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger ? container : item}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Icon chips vary hue per card (emerald/mint/gold/teal) instead of one flat
// repeated color — same principle as Home's stat tiles, applied here so a
// row of 4 identical-shape cards doesn't read as visually monotone.
const CHIP_STYLES = [
  "bg-indigo-500/12 border-indigo-500/25 text-indigo-500",
  "bg-[#0d9488]/12 border-[#0d9488]/25 text-[#0f766e]",
  "bg-gold-500/12 border-gold-500/25 text-gold-600",
  "bg-indigo-600/12 border-indigo-600/25 text-indigo-700",
];

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const featured = LOCATIONS.filter((l) => l.featured).slice(0, 6);

  // "/" is a public marketing page reachable regardless of session state
  // (typing it, clicking a shared link, the logo, etc.) — it used to
  // redirect an already-signed-in visitor straight to /home, which meant
  // there was no way to ever see this page again once you'd logged in
  // once on a given browser. Instead it adapts: the header/CTAs read
  // "open the app" rather than "sign in" / "create an account" for a
  // returning, already-authenticated visitor.
  function enterApp() {
    navigate("/home");
  }

  const FEATURES = [
    { Icon: Bot, title: t("landing", "feature1_title"), desc: t("landing", "feature1_desc") },
    { Icon: Compass, title: t("landing", "feature2_title"), desc: t("landing", "feature2_desc") },
    { Icon: ShieldCheck, title: t("landing", "feature3_title"), desc: t("landing", "feature3_desc") },
    { Icon: Globe2, title: t("landing", "feature4_title"), desc: t("landing", "feature4_desc") },
  ];

  const STATS = [
    { icon: Compass, value: "200+", label: t("home", "stats_places") },
    { icon: Star, value: "4.8", label: t("home", "stats_rating") },
    { icon: Users, value: "50K+", label: t("home", "stats_travelers") },
    { icon: Globe2, value: "6", label: t("home", "stats_langs") },
  ];

  const STEPS = [
    { Icon: MessageSquareText, title: t("landing", "how1_title"), desc: t("landing", "how1_desc") },
    { Icon: Sparkles, title: t("landing", "how2_title"), desc: t("landing", "how2_desc") },
    { Icon: MapIcon, title: t("landing", "how3_title"), desc: t("landing", "how3_desc") },
  ];

  return (
    <div className="app-bg min-h-dvh overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 sm:px-8 py-5">
        {/* A scrim, because this header floats over a PHOTOGRAPH, and the
            top of that photograph is a pale dawn sky. Both the wordmark
            and the "Sign In" button are white-on-transparent, so without
            it their legibility depends entirely on which hero image
            happens to be showing. A short top-down fade costs nothing
            visually and guarantees the contrast. */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
        <div className="relative">
          {/* Always the light-ink wordmark — not the theme-switched pair
              used everywhere else. Every other placement sits on the app
              canvas, where the app's theme IS the background; here the
              background is the hero photo, so in light mode the dark-ink
              variant was being painted onto a dark image, and in dark
              mode the light one onto a bright sky. What is behind it
              decides, and what is behind it is always a photo. */}
          <img src="/img/logo-d.svg" alt="trova" className="h-7 w-auto" />
        </div>
        <button
          onClick={isLoggedIn ? enterApp : () => navigate("/login")}
          className="relative px-4 py-2 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-colors"
        >
          {isLoggedIn ? t("landing", "open_app") : t("landing", "sign_in")}
        </button>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-[92dvh] flex items-end overflow-hidden">
        <PriorityMotionImg
          src={heroImg}
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
        />
        {/* Strong bottom-up scrim: near-opaque at the very bottom where the
            headline/CTAs sit, fully clear by the upper third so the photo
            itself stays the hero, not just a tinted backdrop. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 from-0% via-black/50 via-55% to-transparent to-100%" />
        <div className="aurora-overlay absolute inset-0 opacity-30 pointer-events-none" />

        <div className="relative w-full px-5 sm:px-8 pb-16 sm:pb-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glint inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-5 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Trova AI
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-extrabold text-white leading-[1.05] mb-4 tracking-tight"
          >
            {t("landing", "hero_title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
          >
            {t("landing", "hero_subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            {isLoggedIn ? (
              <button
                onClick={enterApp}
                className="btn-shine group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-lg transition-all active:scale-[0.97] hover:-translate-y-0.5"
              >
                {t("landing", "open_app")}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/signup")}
                  className="btn-shine group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-lg transition-all active:scale-[0.97] hover:-translate-y-0.5"
                >
                  {t("landing", "cta_signup")}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={enterApp}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/30 text-white text-sm font-bold bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all active:scale-[0.97]"
                >
                  {t("landing", "cta_guest")}
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* Scroll cue — a quiet, looping affordance rather than static text,
            signaling there's more below the fold without being a distraction. */}
        <motion.div
          className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-white/50"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="w-5 h-8 rounded-full border border-white/30 flex justify-center pt-1.5">
            <span className="w-1 h-1.5 rounded-full bg-white/60" />
          </span>
        </motion.div>
      </section>

      {/* ── Social proof strip ─────────────────────────────────── */}
      <Reveal as className="px-4 sm:px-8 -mt-8 relative z-10 mb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {STATS.map(({ icon: Icon, value, label }, i) => (
            <motion.div
              key={label}
              variants={item}
              whileHover={{ y: -3 }}
              className={cn(
                "flex flex-col items-center gap-1.5 p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow",
              )}
            >
              <span className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", CHIP_STYLES[i % CHIP_STYLES.length])}>
                <Icon className="w-4.5 h-4.5" strokeWidth={2} />
              </span>
              <span className="text-xl font-extrabold text-[var(--foreground)] tabular-nums">{value}</span>
              <span className="text-[11px] text-[var(--muted-foreground)] text-center leading-tight">{label}</span>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ── Feature highlights ─────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 mb-20">
        {/* Soft ambient wash behind the section — decorative depth instead
            of a flat page background stretching between hero and footer. */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] mb-2">
              {t("landing", "features_title")}
            </h2>
          </Reveal>
          <Reveal as className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={item}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="p-5 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className={cn("w-12 h-12 rounded-xl border flex items-center justify-center mb-4", CHIP_STYLES[i % CHIP_STYLES.length])}>
                  <Icon className="w-5.5 h-5.5" strokeWidth={2} />
                </span>
                <p className="text-sm font-bold text-[var(--foreground)] mb-1.5">{title}</p>
                <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="px-4 sm:px-8 mb-20">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              {t("landing", "how_title")}
            </h2>
          </Reveal>
          <Reveal as className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 relative">
            {/* Route-curve connector — brand motif, echoing the sidebar
                indicator and Home's hero->stats seam, tying this page
                back into the same visual language instead of a plain
                numbered list. */}
            <svg
              className="hidden sm:block absolute top-6 left-0 w-full h-3 -z-0"
              viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" aria-hidden="true"
            >
              <motion.path
                d="M20 6C80 6 80 6 150 6C220 6 220 6 280 6"
                stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 8"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.6 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            {STEPS.map(({ Icon, title, desc }, i) => (
              <motion.div key={title} variants={item} className="relative flex flex-col items-center text-center gap-3">
                <motion.span
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="relative w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-md shrink-0"
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 rounded-full bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--background)]">
                    {i + 1}
                  </span>
                </motion.span>
                <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
                <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed max-w-[220px]">{desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Featured destinations ──────────────────────────────── */}
      <section className="mb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <Reveal className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] mb-2">
              {t("landing", "destinations_title")}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">{t("landing", "destinations_subtitle")}</p>
          </Reveal>
          {/* Same 3-column ceiling as Locations/Home's own grids — cramming
              all 6 featured cards into one row (lg:grid-cols-6) squeezed
              each one to ~150px, truncating every title/tag and warping
              the badge layout. Mobile keeps the horizontal scroll strip
              (fixed card width), everything sm+ becomes a real grid. */}
          <Reveal as className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((loc) => (
              <motion.div key={loc.id} variants={item} className="shrink-0 w-72 sm:w-auto">
                <LocationCard location={loc} variant="default" className="w-full" />
              </motion.div>
            ))}
          </Reveal>
          <Reveal className="text-center mt-8">
            <button
              onClick={enterApp}
              className="group text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
            >
              {t("landing", "see_all")}
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <Reveal className="px-4 sm:px-8 mb-16">
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-[#0d9488] p-8 sm:p-12 text-center">
          <motion.div
            className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full pointer-events-none"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute -bottom-6 -left-4 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{t("landing", "final_cta_title")}</h2>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-7 max-w-md mx-auto">{t("landing", "final_cta_desc")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {isLoggedIn ? (
                <button
                  onClick={enterApp}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 text-sm font-bold shadow-lg transition-all active:scale-[0.97] hover:-translate-y-0.5"
                >
                  {t("landing", "open_app")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/signup")}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 text-sm font-bold shadow-lg transition-all active:scale-[0.97] hover:-translate-y-0.5"
                  >
                    {t("landing", "cta_signup")}
                  </button>
                  <button
                    onClick={enterApp}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/15 hover:bg-white/22 border border-white/25 text-white text-sm font-bold backdrop-blur-sm transition-all active:scale-[0.97]"
                  >
                    {t("landing", "cta_guest")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="px-4 sm:px-8 pt-12 pb-8 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-2.5 text-center sm:text-left">
            <div>
              <img src="/img/logo-l.svg" alt="trova" className="h-7 w-auto dark:hidden" />
              <img src="/img/logo-d.svg" alt="trova" className="h-7 w-auto hidden dark:block" />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] max-w-[220px]">{t("landing", "footer_tagline")}</p>
          </div>

          {/* Explore */}
          <div className="flex flex-col items-center sm:items-start gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">{t("nav", "locations")}</p>
            <button onClick={enterApp} className="text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors">
              {t("nav", "about")}
            </button>
            <button onClick={enterApp} className="text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors">
              {t("nav", "locations")}
            </button>
            <button onClick={enterApp} className="text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors">
              {t("nav", "services")}
            </button>
          </div>

          {/* Contact — routed to the one real, working contact channel
              (Trova AI itself) instead of inventing an email/phone/social
              account that doesn't actually exist behind it. */}
          <div className="flex flex-col items-center sm:items-start gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">Contact</p>
            <button
              onClick={enterApp}
              className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              {t("chat", "title")}
            </button>
            <a
              href="https://mrforce.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              mrforce.uz
            </a>
          </div>

          {/* Legal */}
          <div className="flex flex-col items-center sm:items-start gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">Legal</p>
            <button onClick={() => navigate("/privacy")} className="text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => navigate("/terms")} className="text-sm text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors">
              Terms of Service
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--muted-foreground)]/60 pt-6 border-t border-[var(--border)]">
          © {new Date().getFullYear()} trova — mrforce.uz tomonidan ishlab chiqildi
        </p>
      </footer>
    </div>
  );
}
