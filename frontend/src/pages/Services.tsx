import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, MapPin, Clock, Phone, CheckCircle, Star,
  Wifi, Car, Coffee, Dumbbell, Utensils, Hotel, Compass,
  Train, Bus, Zap, TrendingUp, Globe2, CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RESTAURANTS, HOTELS, GUIDES, CURRENCY_RATES } from "@/data";
import { EMERGENCY_NUMBERS } from "@/data/emergency-numbers";
import { Stars } from "@/components/ui/stars";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useTranslation } from "@/i18n";
import type { Restaurant, Hotel as HotelType, Guide } from "@/types";

type Tab = "restoranlar" | "hotellar" | "gidlar" | "transport" | "valyuta";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "Wi-Fi":        <Wifi className="w-3 h-3" />,
  "Avtoturargoh": <Car className="w-3 h-3" />,
  "Parking":      <Car className="w-3 h-3" />,
  "Nonushta":     <Coffee className="w-3 h-3" />,
  "Fitnes":       <Dumbbell className="w-3 h-3" />,
};

// A single-letter text badge for unmapped amenities was the "broken WW
// badge" bug — any amenity outside the map now falls back to a plain
// monoline dot instead of raw text, so it never renders as a stray
// letter glyph.
function amenityIcon(name: string) {
  const icon = AMENITY_ICONS[name];
  // AMENITY_ICONS is keyed by literal strings that have to exactly match
  // the mock HOTELS data — nothing ties them together at the type level,
  // so a typo on either side falls through to the generic dot silently.
  // A dev-only warning at least surfaces that during development instead
  // of shipping a hotel card with an unexplained blank icon.
  if (!icon && import.meta.env.DEV) {
    console.warn(`Services.tsx: no AMENITY_ICONS entry for "${name}"`);
  }
  return icon ?? <CircleDot className="w-3 h-3" />;
}

// ── Restaurants ───────────────────────────────────────────
function RestaurantsTab({ search, onSelect }: { search: string; onSelect: (r: Restaurant) => void }) {
  const { t } = useTranslation();
  const q = search.toLowerCase();
  const filtered = RESTAURANTS.filter(
    (r) => !q || r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <Utensils className="w-9 h-9 mx-auto mb-3 text-indigo-500/40" strokeWidth={1.5} />
        <p className="text-sm text-[var(--muted-foreground)]">{t("services", "not_found_restaurant")}</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((r) => (
        <motion.div
          key={r.id}
          variants={staggerItem}
          onClick={() => onSelect(r)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r); } }}
          className="cursor-pointer rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="relative h-44 overflow-hidden">
            <img
              src={r.img}
              loading="lazy"
              decoding="async"
              alt={r.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=60"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/55 backdrop-blur-sm text-indigo-300 border border-indigo-500/30">
              {r.priceRange}
            </span>
            <div className="absolute bottom-2.5 left-3 right-3">
              <h3 className="font-bold text-sm text-white drop-shadow-md truncate">{r.name}</h3>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                <MapPin className="w-3 h-3 text-indigo-500" />{r.city}
              </span>
              <Stars rating={r.rating} size="sm" showNumber />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500/60" />{r.hours}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px]">
                {r.cuisine}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Hotels ────────────────────────────────────────────────
function HotelsTab({ search, onSelect }: { search: string; onSelect: (h: HotelType) => void }) {
  const { t } = useTranslation();
  const q = search.toLowerCase();
  const filtered = HOTELS.filter(
    (h) => !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <Hotel className="w-9 h-9 mx-auto mb-3 text-indigo-500/40" strokeWidth={1.5} />
        <p className="text-sm text-[var(--muted-foreground)]">{t("services", "not_found_hotel")}</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((h) => (
        <motion.div
          key={h.id}
          variants={staggerItem}
          onClick={() => onSelect(h)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(h); } }}
          className="cursor-pointer rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="relative h-44 overflow-hidden">
            <img
              src={h.img}
              loading="lazy"
              decoding="async"
              alt={h.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=60"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {!h.available && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full bg-red-500/80 backdrop-blur-sm">
                  {t("services", "busy")}
                </span>
              </div>
            )}
            <span className={cn(
              "absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm",
              h.available ? "bg-indigo-500/85 text-white" : "bg-red-500/80 text-white"
            )}>
              {h.available ? t("services", "available") : t("services", "busy")}
            </span>
            <div className="absolute bottom-2.5 left-3">
              <h3 className="font-bold text-sm text-white drop-shadow-md">{h.name}</h3>
              <div className="flex mt-0.5">
                {Array.from({ length: h.stars }, (_, i) => (
                  <Star key={i} className="w-3 h-3 text-gold-500 fill-gold-500" />
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                <MapPin className="w-3 h-3 text-indigo-500" />{h.city}
              </span>
              <Stars rating={h.rating} size="sm" showNumber />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-indigo-400">
                ${h.pricePerNight.toLocaleString()}
                <span className="text-[11px] font-normal text-[var(--muted-foreground)]"> {t("services", "per_night")}</span>
              </p>
              <div className="flex gap-1">
                {h.amenities.slice(0, 3).map((a) => (
                  <span key={a} title={a} className="w-6 h-6 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-indigo-400">
                    {amenityIcon(a)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Guides ────────────────────────────────────────────────
function GuidesTab({ search, onSelect }: { search: string; onSelect: (g: Guide) => void }) {
  const { t } = useTranslation();
  const q = search.toLowerCase();
  const filtered = GUIDES.filter(
    (g) => !q || g.name.toLowerCase().includes(q) || g.city.toLowerCase().includes(q) || g.langs.some((l) => l.toLowerCase().includes(q))
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <Compass className="w-9 h-9 mx-auto mb-3 text-indigo-500/40" strokeWidth={1.5} />
        <p className="text-sm text-[var(--muted-foreground)]">{t("services", "not_found_guide")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((g) => (
        <div
          key={g.id}
          onClick={() => onSelect(g)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(g); } }}
          className="cursor-pointer rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] overflow-hidden hover:border-indigo-500/40 hover:shadow-md transition-all duration-200"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <img
                  src={g.img}
                  loading="lazy"
                  decoding="async"
                  alt={g.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--border)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}&background=50c878&color=fff&size=64`;
                  }}
                />
                {g.available && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-400 rounded-full border-2 border-[var(--card)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-bold text-sm text-[var(--foreground)] truncate">{g.name}</h3>
                  {g.verified && <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                    <MapPin className="w-3 h-3 text-indigo-500" />{g.city}
                  </span>
                  <Stars rating={g.rating} size="sm" showNumber />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {g.langs.map((l) => (
                    <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-medium">
                      {l}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">{g.bio}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]/50 bg-[var(--muted)]/30">
            <div>
              <span className="text-base font-bold text-indigo-400">${g.pricePerDay.toLocaleString()}</span>
              <span className="text-[11px] text-[var(--muted-foreground)]">{t("services", "per_day")}</span>
            </div>
            <span className={cn(
              "text-[10px] px-2.5 py-1 rounded-full font-semibold",
              g.available
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                : "bg-red-500/15 text-red-400 border border-red-500/30"
            )}>
              ● {g.available ? t("services", "available") : t("services", "busy")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Transport ─────────────────────────────────────────────
function TransportTab() {
  const { t } = useTranslation();

  function formatDuration(hours: number, mins: number): string {
    const h = t("services", "hours_unit");
    const m = t("services", "min_unit");
    if (hours > 0 && mins > 0) return `${hours} ${h} ${mins} ${m}`;
    if (hours > 0) return `${hours} ${h}`;
    return `${mins} ${m}`;
  }

  function formatPrice(uzs: number): string {
    return `${new Intl.NumberFormat("uz-UZ").format(uzs)} ${t("services", "uzs_unit")}`;
  }

  const TRANSPORT_OPTIONS = [
    {
      type: t("services", "train_type"),
      icon: <Train className="w-4 h-4" />,
      desc: t("services", "train_desc"),
      routes: [
        { from: "Toshkent", to: "Samarqand", hours: 2,   mins: 0,  priceUZS: 80000 },
        { from: "Toshkent", to: "Buxoro",    hours: 3,   mins: 30, priceUZS: 120000 },
        { from: "Samarqand", to: "Buxoro",   hours: 1,   mins: 30, priceUZS: 60000 },
      ],
    },
    {
      type: t("services", "bus_type"),
      icon: <Bus className="w-4 h-4" />,
      desc: t("services", "bus_desc"),
      routes: [
        { from: "Toshkent", to: "Namangan", hours: 4, mins: 0,  priceUZS: 40000 },
        { from: "Toshkent", to: "Andijon",  hours: 5, mins: 0,  priceUZS: 50000 },
        { from: "Toshkent", to: "Termiz",   hours: 8, mins: 0,  priceUZS: 70000 },
      ],
    },
    {
      type: t("services", "taxi_type"),
      icon: <Zap className="w-4 h-4" />,
      desc: t("services", "taxi_desc"),
      routes: [
        { from: "Toshkent",  to: "Chimgan",    hours: 1, mins: 30, priceUZS: 150000 },
        { from: "Urgench",   to: "Xiva",       hours: 0, mins: 30, priceUZS: 30000 },
        { from: "Buxoro",    to: "Shahrisabz", hours: 1, mins: 30, priceUZS: 100000 },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {TRANSPORT_OPTIONS.map((opt) => (
        <div key={opt.type}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              {opt.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">{opt.type}</h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">{opt.desc}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]/50">
            {opt.routes.map((route) => (
              <div
                key={`${route.from}-${route.to}`}
                className="flex items-center justify-between px-4 py-3 bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    {route.from} → {route.to}
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDuration(route.hours, route.mins)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-indigo-400">~{formatPrice(route.priceUZS)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Emergency numbers */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-red-500/15">
          <Phone className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">{t("services", "emergency")}</h3>
        </div>
        <div className="divide-y divide-[var(--border)]/30">
          {EMERGENCY_NUMBERS.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              aria-label={`${t("services", item.key)}: ${item.number}`}
              className="flex items-center justify-between px-4 py-3 bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <item.Icon className="w-4 h-4 text-red-400" strokeWidth={2} />
                {t("services", item.key)}
              </span>
              <span className="text-sm font-bold text-red-400">{item.number}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Currency ──────────────────────────────────────────────
function CurrencyTab() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("USD");

  const currencies = Object.entries(CURRENCY_RATES).map(([code, rate]) => ({ code, rate }));
  // Guards against both non-numeric input (parseFloat -> NaN -> 0) and
  // absurd-but-technically-numeric input like "1e300" — without a finite
  // upper bound, that multiplies through to Infinity and renders as a
  // garbled "∞ UZS" result with no validation message.
  const MAX_CONVERTIBLE = 1_000_000_000;
  const parsedAmount = parseFloat(amount);
  const numericAmount = Number.isFinite(parsedAmount)
    ? Math.min(Math.max(parsedAmount, 0), MAX_CONVERTIBLE)
    : 0;
  const baseRate = CURRENCY_RATES[fromCurrency] ?? 1;
  const uzsAmount = numericAmount * baseRate;

  // No flag emojis — Windows without color-emoji font support renders
  // regional-indicator flags as literal two-letter text pills, not a flag.

  return (
    <div className="space-y-4">
      {/* Converter */}
      <div className="rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">{t("services", "currency_calc_title")}</h3>
            <p className="text-[11px] text-[var(--muted-foreground)]">{t("services", "currency_calc_desc")}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={MAX_CONVERTIBLE}
            className={cn(
              "flex-1 px-3 py-2.5 rounded-xl",
              "bg-[var(--muted)] border border-[var(--border)]",
              "text-[var(--foreground)] text-sm font-semibold",
              "outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            )}
          />
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className={cn(
              "px-3 py-2.5 rounded-xl min-w-[5rem]",
              "bg-[var(--muted)] border border-[var(--border)]",
              "text-[var(--foreground)] text-sm font-semibold",
              "outline-none focus:border-indigo-500 transition-all"
            )}
          >
            {currencies.map(({ code }) => (
              <option key={code} value={code}>{code}</option>
            ))}
            <option value="UZS">UZS</option>
          </select>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          {fromCurrency !== "UZS" ? (
            <>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-1">
                {numericAmount} {fromCurrency} =
              </p>
              <p className="text-xl font-bold text-indigo-400">
                {new Intl.NumberFormat("uz-UZ").format(Math.round(uzsAmount))}{" "}
                <span className="text-base font-semibold text-indigo-400/70">{t("services", "uzs_unit")}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-1">
                {numericAmount.toLocaleString()} UZS =
              </p>
              <p className="text-xl font-bold text-indigo-400">
                ${(numericAmount / CURRENCY_RATES.USD).toFixed(2)}{" "}
                <span className="text-base font-semibold text-indigo-400/70">USD</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Rates grid */}
      <div>
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-2.5 flex items-center gap-1.5">
          <Globe2 className="w-4 h-4 text-indigo-400" />
          {t("services", "currency_table_title")}
          <span className="text-[10px] font-normal text-[var(--muted-foreground)]">{t("services", "currency_table_unit")}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currencies.map(({ code, rate }) => (
            <button
              key={code}
              type="button"
              onClick={() => setFromCurrency(code)}
              aria-pressed={fromCurrency === code}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left min-h-[56px]",
                fromCurrency === code
                  ? "bg-indigo-500/10 border-indigo-500/40"
                  : "bg-[var(--card)] border-[var(--border)] hover:border-indigo-500/20"
              )}
            >
              <span className={cn(
                "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-extrabold tracking-tight",
                fromCurrency === code
                  ? "bg-indigo-500 text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]"
              )}>
                {code}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--foreground)]">{code}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
                  {new Intl.NumberFormat("uz-UZ").format(rate)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function Services() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("restoranlar");
  const [search, setSearch] = useState("");
  // Restaurants and hotels now navigate to their own page (a menu/booking
  // flow needs real room, not a popup) — only guides, which have nothing
  // further to drill into beyond their own bio, still use the quick-look
  // modal.
  const [detail, setDetail] = useState<{ type: "guide"; data: Guide } | null>(null);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "restoranlar", label: t("services", "tab_restaurants"), icon: <Utensils className="w-3.5 h-3.5" /> },
    { key: "hotellar",    label: t("services", "tab_hotels"),      icon: <Hotel className="w-3.5 h-3.5" /> },
    { key: "gidlar",      label: t("services", "tab_guides"),      icon: <Compass className="w-3.5 h-3.5" /> },
    { key: "transport",   label: t("services", "tab_transport"),   icon: <Train className="w-3.5 h-3.5" /> },
    { key: "valyuta",     label: t("services", "tab_currency"),    icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  const TAB_META: Record<Tab, { title: string; desc: string; Icon: typeof Utensils }> = {
    restoranlar: { title: t("services", "restaurants_title"), desc: t("services", "restaurants_desc"), Icon: Utensils },
    hotellar:    { title: t("services", "hotels_title"),      desc: t("services", "hotels_desc"),      Icon: Hotel },
    gidlar:      { title: t("services", "guides_title"),      desc: t("services", "guides_desc"),      Icon: Compass },
    transport:   { title: t("services", "transport_title"),   desc: t("services", "transport_desc"),   Icon: Train },
    valyuta:     { title: t("services", "currency_title"),    desc: t("services", "currency_desc"),    Icon: TrendingUp },
  };

  const showSearch = ["restoranlar", "hotellar", "gidlar"].includes(activeTab);
  const meta = TAB_META[activeTab];

  return (
    <div className="pb-6">
      <PageHeader title={t("services", "title")} subtitle={t("services", "subtitle")} />

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {/* Active fill slides between tabs via a shared layoutId, matching
            the Locations category pills and sidebar nav — switching reads
            as one element moving rather than a hard color swap. */}
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(""); }}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 rounded-2xl border text-xs font-semibold shrink-0 transition-colors min-h-[44px] active:scale-[0.97]",
                active
                  ? "border-indigo-500 text-white"
                  : "bg-[var(--muted)] border-transparent text-[var(--foreground)] hover:border-indigo-500/30"
              )}
            >
              {active && (
                <motion.span
                  layoutId="services-tab-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className="absolute inset-0 rounded-2xl bg-indigo-500 shadow-md shadow-indigo-500/20"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div className="px-4 mb-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <meta.Icon className="w-4.5 h-4.5 text-indigo-500" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">{meta.title}</h2>
          <p className="text-[11px] text-[var(--muted-foreground)]">{meta.desc}</p>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder={`${meta.title} ${t("services", "search_placeholder")}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-9 pr-4 py-2.5 rounded-xl",
                "bg-[var(--muted)] border border-[var(--border)]",
                "text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)]",
                "outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              )}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === "restoranlar" && (
              <RestaurantsTab search={search} onSelect={(r) => navigate(`/services/restaurants/${r.id}`)} />
            )}
            {activeTab === "hotellar" && (
              <HotelsTab search={search} onSelect={(h) => navigate(`/services/hotels/${h.id}`)} />
            )}
            {activeTab === "gidlar" && (
              <GuidesTab search={search} onSelect={(g) => setDetail({ type: "guide", data: g })} />
            )}
            {activeTab === "transport"   && <TransportTab />}
            {activeTab === "valyuta"     && <CurrencyTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ServiceDetailModal item={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
