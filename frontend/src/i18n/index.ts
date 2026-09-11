import { useSyncExternalStore } from "react";
import { useAppStore } from "@/store";
import EN from "./locales/en";
import type { Lang, TranslationSchema } from "./translations";

export type { Lang, TranslationSchema } from "./translations";
export { LOCALE_TAGS } from "./translations";

/**
 * Lazily-loaded locale dictionaries.
 *
 * All six used to live in one 115 KB module inside the entry chunk, so a
 * visitor reading the app in Uzbek still paid to download and parse
 * Russian, English, Chinese, German and French before first paint —
 * roughly five sixths of that module was dead weight for every single
 * user, on every visit.
 *
 * English is the one dictionary bundled eagerly: it is the store's default
 * language, and it doubles as the synchronous fallback below, so `t()`
 * never has to return a raw key while another locale is in flight. Every
 * other locale arrives as its own ~4 KB gzipped chunk.
 */
const LOADERS: Record<Lang, () => Promise<{ default: TranslationSchema }>> = {
  en: () => Promise.resolve({ default: EN }),
  uz: () => import("./locales/uz"),
  ru: () => import("./locales/ru"),
  zh: () => import("./locales/zh"),
  de: () => import("./locales/de"),
  fr: () => import("./locales/fr"),
};

const loaded: Partial<Record<Lang, TranslationSchema>> = { en: EN };
const inFlight: Partial<Record<Lang, Promise<void>>> = {};

// A plain subscription set rather than another zustand slice: this is
// module-local state that only useTranslation cares about, and routing it
// through the app store would re-render every store consumer whenever a
// dictionary finished loading.
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

/**
 * Fetches a locale if it isn't already resident. Safe to call repeatedly
 * and concurrently — the in-flight promise is shared, so a language
 * toggled twice in quick succession still only fetches once.
 *
 * A failed chunk fetch (offline, a deploy that rotated hashes mid-session)
 * resolves rather than rejects: `t()` falls back to English, which is a
 * usable app, where an unhandled rejection here would not be.
 */
export function loadLocale(lang: Lang): Promise<void> {
  if (loaded[lang]) return Promise.resolve();
  const existing = inFlight[lang];
  if (existing) return existing;

  const p = LOADERS[lang]()
    .then((mod) => {
      loaded[lang] = mod.default;
      emit();
    })
    .catch(() => {
      /* stay on the English fallback */
    })
    .finally(() => {
      delete inFlight[lang];
    });

  inFlight[lang] = p;
  return p;
}

/**
 * The language the app will start in, read straight from the persisted
 * zustand blob. main.tsx uses this to await the right dictionary BEFORE
 * the first render, so a Russian-speaking returning visitor never sees a
 * frame of English before their locale arrives.
 */
export function initialLang(): Lang {
  try {
    const raw = localStorage.getItem("trova-v1");
    if (!raw) return "en";
    const parsed = JSON.parse(raw) as { state?: { lang?: Lang } };
    const lang = parsed?.state?.lang;
    return lang && lang in LOADERS ? lang : "en";
  } catch {
    return "en";
  }
}

// Start fetching the moment the language changes, from wherever it was
// changed — the Profile page, the CountrySwitcher, the command palette, or
// `login()` adopting the language stored on a user's account. Doing it here
// rather than at each call site means a new language switcher added later
// cannot forget to trigger the load, and it keeps `store` free of any
// dependency on the i18n module (which imports the store itself).
useAppStore.subscribe((state, prev) => {
  if (state.lang !== prev.lang) void loadLocale(state.lang);
});

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTranslation() {
  const lang = useAppStore((s) => s.lang);

  // Re-render this component when a dictionary lands. Without it, a
  // language switched to a not-yet-loaded locale would render English and
  // then never update, because nothing in React's tree changed.
  useSyncExternalStore(subscribe, () => version);

  const dict = loaded[lang];
  if (!dict) void loadLocale(lang);
  const active = dict ?? EN;

  function t(section: keyof TranslationSchema, key: string): string {
    const sec = active[section] as Record<string, string> | undefined;
    // English is the last resort for a key a translator hasn't filled in
    // yet — showing the raw key ("nav.saved") to a user is never right.
    return sec?.[key] ?? (EN[section] as Record<string, string>)?.[key] ?? key;
  }

  return { t, lang };
}
