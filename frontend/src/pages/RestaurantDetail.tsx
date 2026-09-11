import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Star, ExternalLink, UtensilsCrossed } from "lucide-react";
import { RESTAURANTS_BY_ID } from "@/data";
import { useTranslation } from "@/i18n";

/**
 * A full page instead of the earlier quick-look modal — a restaurant's
 * menu is the actual reason someone opens this, not a footnote in a
 * popup. Warm, unhurried layout (generous spacing, one dish per row with
 * room to breathe) rather than the dense card-grid style used for
 * browsing lists elsewhere in the app — this screen is for lingering on,
 * not scanning quickly.
 */
export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const restaurant = id ? RESTAURANTS_BY_ID.get(id) : undefined;

  if (!restaurant) {
    return (
      <div className="px-4 py-16 text-center">
        <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-indigo-500/40" strokeWidth={1.5} />
        <p className="text-sm text-[var(--muted-foreground)] mb-4">{t("services", "not_found_restaurant")}</p>
        <button
          onClick={() => navigate("/services")}
          className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
        >
          {t("detail", "back")}
        </button>
      </div>
    );
  }

  const mapHref = `https://www.google.com/maps/search/${encodeURIComponent(
    `${restaurant.name} ${restaurant.address} ${restaurant.city}`
  )}`;

  return (
    <div className="pb-12 w-full max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={restaurant.img} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-90"
          aria-label={t("detail", "back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold mb-2.5 border border-white/20">
            <UtensilsCrossed className="w-3 h-3" /> {restaurant.cuisine}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md leading-tight">
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-white/85 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {restaurant.city}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-gold-300 fill-gold-300" /> {restaurant.rating}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {restaurant.hours}
            </span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="px-4 sm:px-6 pt-5">
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-0.5">
              {t("services", "address_label")}
            </p>
            <p className="text-sm text-[var(--foreground)] truncate">{restaurant.address}</p>
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
      </div>

      {/* Menu — the whole point of this page. Warm cream/graphite card,
          generous line-height, a soft divider instead of a hard rule
          between dishes, and the price set apart in the brand accent so
          the eye can scan prices down the column without re-reading every
          description. */}
      <div className="px-4 sm:px-6 pt-6">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-1">
          {t("services", "menu_title")}
        </h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">{restaurant.menu.length} {t("services", "tab_restaurants").toLowerCase()}</p>

        {restaurant.menu.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">{t("services", "no_menu")}</p>
        ) : (
          <div className="rounded-3xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] divide-y divide-[var(--border)]/60 overflow-hidden">
            {restaurant.menu.map((dish) => (
              <div key={dish.name} className="flex items-start justify-between gap-4 px-5 py-5 hover:bg-[var(--muted)]/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-[var(--foreground)]">{dish.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-1">{dish.description}</p>
                </div>
                <span className="shrink-0 text-base font-bold text-indigo-400 tabular-nums whitespace-nowrap">
                  {dish.price.toLocaleString()} <span className="text-xs font-semibold text-indigo-400/70">{t("services", "uzs_unit")}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
