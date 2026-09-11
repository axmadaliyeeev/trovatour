import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, MapPin, Clock, Star, CheckCircle, ExternalLink,
  UtensilsCrossed, Languages, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { Restaurant, Hotel, Guide } from "@/types";

type ServiceDetail =
  | { type: "restaurant"; data: Restaurant }
  | { type: "hotel"; data: Hotel }
  | { type: "guide"; data: Guide };

/**
 * Restaurants, hotels and guides all already carry richer data than their
 * card ever showed (a restaurant's full menu, a hotel's complete amenity
 * list, an address) — the card was a dead end with no way to see the rest.
 * One modal, three thin render branches, instead of three near-identical
 * components (same overlay/close/layout code tripled).
 */
export function ServiceDetailModal({
  item,
  onClose,
}: {
  item: ServiceDetail | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const open = item !== null;

  const name = item?.data.name ?? "";
  const city = item?.data.city ?? "";
  const img = item?.data.img ?? "";
  const rating = item?.data.rating ?? 0;
  const address = item && "address" in item.data ? item.data.address : undefined;
  const mapHref = address
    ? `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${address} ${city}`)}`
    : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && item && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xl"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center outline-none p-0 sm:p-4">
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, y: 40, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
                  className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-[var(--modal-border)] bg-[var(--modal)] shadow-[var(--shadow-modal)] max-h-[88vh] sm:max-h-[85vh] overflow-y-auto"
                >
                  {/* Cover image */}
                  <div className="relative h-44 sm:h-52 shrink-0">
                    <img src={img} alt={name} className="w-full h-full object-cover rounded-t-3xl sm:rounded-t-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent rounded-t-3xl sm:rounded-t-2xl" />
                    <Dialog.Close asChild>
                      <button
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
                        aria-label={t("services", "close_label")}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </Dialog.Close>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <Dialog.Title className="font-display font-bold text-white text-lg leading-tight drop-shadow-md">
                        {name}
                      </Dialog.Title>
                      <Dialog.Description className="flex items-center gap-3 mt-1 text-white/85 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold-300 fill-gold-300" /> {rating}
                        </span>
                      </Dialog.Description>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Quick facts row — differs per type */}
                    <div className="flex flex-wrap gap-2">
                      {item.type === "restaurant" && (
                        <>
                          <Fact icon={UtensilsCrossed} label={item.data.cuisine} />
                          <Fact icon={Clock} label={item.data.hours} />
                          <Fact icon={DollarSign} label={item.data.priceRange} />
                        </>
                      )}
                      {item.type === "hotel" && (
                        <>
                          <Fact icon={DollarSign} label={`$${item.data.pricePerNight.toLocaleString()} / ${t("services", "per_night")}`} />
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-bold",
                            item.data.available ? "bg-indigo-500/15 text-indigo-500" : "bg-red-500/15 text-red-400"
                          )}>
                            {item.data.available ? t("services", "available") : t("services", "busy")}
                          </span>
                        </>
                      )}
                      {item.type === "guide" && (
                        <>
                          <Fact icon={DollarSign} label={`$${item.data.pricePerDay.toLocaleString()} / ${t("services", "per_day")}`} />
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-bold",
                            item.data.available ? "bg-indigo-500/15 text-indigo-500" : "bg-red-500/15 text-red-400"
                          )}>
                            {item.data.available ? t("services", "available") : t("services", "busy")}
                          </span>
                          {item.data.verified && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-500">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Address */}
                    {address && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                          {t("services", "address_label")}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-[var(--foreground)]">{address}</p>
                          {mapHref && (
                            <a
                              href={mapHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              {t("services", "open_map")} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Guide bio */}
                    {item.type === "guide" && (
                      <div>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">{item.data.bio}</p>
                        <div className="flex items-center gap-1.5 mt-3">
                          <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                            {t("services", "languages_label")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.data.langs.map((l) => (
                            <span key={l} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-medium">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hotel amenities — full list, not the card's slice(0,3) */}
                    {item.type === "hotel" && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
                          {t("services", "amenities_label")}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.data.amenities.map((a) => (
                            <span key={a} className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] font-medium">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restaurant menu */}
                    {item.type === "restaurant" && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
                          {t("services", "menu_title")}
                        </p>
                        {item.data.menu.length === 0 ? (
                          <p className="text-sm text-[var(--muted-foreground)]">{t("services", "no_menu")}</p>
                        ) : (
                          <div className="space-y-2.5">
                            {item.data.menu.map((dish) => (
                              <div key={dish.name} className="flex items-start justify-between gap-3 pb-2.5 border-b border-[var(--border)]/50 last:border-0 last:pb-0">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[var(--foreground)]">{dish.name}</p>
                                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mt-0.5">{dish.description}</p>
                                </div>
                                <span className="shrink-0 text-sm font-bold text-indigo-400 tabular-nums">
                                  {dish.price.toLocaleString()} {t("services", "uzs_unit")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Fact({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[11px] font-semibold text-[var(--foreground)]">
      <Icon className="w-3 h-3 text-indigo-500" /> {label}
    </span>
  );
}
