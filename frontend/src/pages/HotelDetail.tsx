import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, Star, ExternalLink, Hotel as HotelIcon,
  Users, Calendar, Loader2, CheckCircle2, DollarSign,
} from "lucide-react";
import { isAxiosError } from "axios";
import { HOTELS_BY_ID } from "@/data";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * A real page, not the earlier quick-look modal — booking a room needs
 * actual inputs (dates, guests, contact info), which a popup has no room
 * to do justice to. There's no payment/availability system behind this
 * yet, so submitting creates a *request* the hotel follows up on by
 * phone (POST /api/bookings) — an honest scope, not a fake "confirmed"
 * screen implying a real reservation system that doesn't exist.
 */
export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAppStore((s) => s.user);
  const hotel = id ? HOTELS_BY_ID.get(id) : undefined;

  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 1));
  const [guests, setGuests] = useState(2);
  const [contactName, setContactName] = useState(user ? `${user.name} ${user.surname}` : "");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const nights = useMemo(() => {
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  }, [checkIn, checkOut]);

  if (!hotel) {
    return (
      <div className="px-4 py-16 text-center">
        <HotelIcon className="w-10 h-10 mx-auto mb-3 text-indigo-500/40" strokeWidth={1.5} />
        <p className="text-sm text-[var(--muted-foreground)] mb-4">{t("services", "not_found_hotel")}</p>
        <button
          onClick={() => navigate("/services")}
          className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
        >
          {t("detail", "back")}
        </button>
      </div>
    );
  }

  const total = nights * hotel.pricePerNight;
  const valid = nights > 0 && contactName.trim().length >= 2 && contactPhone.trim().length >= 5;
  const mapHref = `https://www.google.com/maps/search/${encodeURIComponent(
    `${hotel.name} ${hotel.address} ${hotel.city}`
  )}`;

  async function submitBooking() {
    if (!hotel || !valid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/bookings", {
        hotelId: hotel.id,
        hotelName: hotel.name,
        city: hotel.city,
        checkIn,
        checkOut,
        guests,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
      });
      setDone(true);
    } catch (err) {
      const msg = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(msg || t("services", "booking_error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-12 w-full max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-90"
          aria-label={t("detail", "back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex mb-2">
            {Array.from({ length: hotel.stars }, (_, i) => (
              <Star key={i} className="w-3.5 h-3.5 text-gold-300 fill-gold-300" />
            ))}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md leading-tight">
            {hotel.name}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-white/85 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {hotel.city}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-gold-300 fill-gold-300" /> {hotel.rating}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-bold",
                hotel.available ? "bg-indigo-500/80" : "bg-red-500/80"
              )}
            >
              {hotel.available ? t("services", "available") : t("services", "busy")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-5 space-y-5">
        {/* Address + amenities */}
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-0.5">
                {t("services", "address_label")}
              </p>
              <p className="text-sm text-[var(--foreground)] truncate">{hotel.address}</p>
            </div>
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t("services", "open_map")} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {hotel.amenities.map((a) => (
              <span key={a} className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Booking form / success state */}
        {done ? (
          <div className="p-6 rounded-2xl bg-indigo-500/8 border border-indigo-500/25 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-indigo-500" />
            <p className="text-base font-bold text-[var(--foreground)]">{t("services", "booking_success_title")}</p>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto">{t("services", "booking_success_desc")}</p>
            <button
              onClick={() => setDone(false)}
              className="mt-2 px-4 py-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-sm font-semibold text-[var(--foreground)] hover:border-indigo-500/40 transition-colors"
            >
              {t("services", "book_another")}
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] space-y-4">
            <h2 className="font-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> {t("services", "booking_title")}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("services", "check_in")}</label>
                <input
                  type="date"
                  value={checkIn}
                  min={todayISO()}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) setCheckOut(addDaysISO(e.target.value, 1));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("services", "check_out")}</label>
                <input
                  type="date"
                  value={checkOut}
                  min={addDaysISO(checkIn, 1)}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                <Users className="w-3 h-3" /> {t("services", "guests_label")}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("services", "contact_name_label")}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("services", "contact_phone_label")}</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                {nights > 0 ? `${nights} ${t("services", "nights_label")} × $${hotel.pricePerNight.toLocaleString()}` : "—"}
              </span>
              <span className="text-lg font-extrabold text-indigo-400 tabular-nums">
                {t("services", "total_label")}: ${total.toLocaleString()}
              </span>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={submitBooking}
              disabled={!valid || submitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]",
                valid && !submitting
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
              )}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("services", "submit_booking")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
