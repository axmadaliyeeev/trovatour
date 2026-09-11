import { LocationCard } from '@/components/locations/LocationCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { CATEGORY_STYLE, type CategoryFilterKey } from '@/lib/categories';
import { LOCATIONS } from '@/data';
import { useTranslation } from '@/i18n';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Location } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Re-exported shape from the shared category module, so the filter row,
// the cards it filters and any future surface all key off one definition.
type CategoryFilter = CategoryFilterKey;

const CITIES = ['Barchasi', ...Array.from(new Set(LOCATIONS.map(l => l.city))).sort()];
const CATEGORY_FILTERS: CategoryFilter[] = [
  'all',
  'tarix',
  'tabiat',
  'madaniyat',
  'din',
  'arxeologiya',
];

function isCategoryFilter(value: string | null): value is CategoryFilter {
  return !!value && CATEGORY_FILTERS.includes(value as CategoryFilter);
}


function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Locations() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  // Deep-link support for "explore this city" entry points (the About
  // page's region map/cards navigate here with ?city=Samarqand) — read
  // once on mount so a direct link lands pre-filtered instead of forcing
  // a second manual step.
  const cityParam = searchParams.get('city');
  const categoryParam = searchParams.get('category');
  const initialCategory = isCategoryFilter(categoryParam) ? categoryParam : 'all';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory);
  const [activeCity, setActiveCity] = useState(
    cityParam && CITIES.includes(cityParam) ? cityParam : 'Barchasi'
  );
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(
    !!(cityParam && CITIES.includes(cityParam)) || initialCategory !== 'all'
  );

  useEffect(() => {
    setActiveCategory(initialCategory);
    setShowFilters(!!(cityParam && CITIES.includes(cityParam)) || initialCategory !== 'all');
  }, [cityParam, initialCategory]);

  const debouncedSearch = useDebounce(search, 300);

  // Same monoline icon family as Home/LocationCard's category badges — one
  // consistent set app-wide instead of per-screen emoji.
  // Labels come from i18n; icon and colour come from the shared category
  // module, so this row can never disagree with the badge on a card again.
  const CATEGORIES = CATEGORY_FILTERS.map((key) => ({
    key,
    label: key === 'all' ? t('locations', 'filter_all') : t('home', CATEGORY_STYLE[key].tKey as 'cat_tarix'),
    Icon: CATEGORY_STYLE[key].Icon,
  }));

  const SORT_OPTIONS = [
    { key: 'rating', label: t('locations', 'sort_rating') },
    { key: 'price-asc', label: t('locations', 'sort_price_asc') },
    { key: 'price-desc', label: t('locations', 'sort_price_desc') },
    { key: 'reviews', label: t('locations', 'sort_reviews') },
  ];

  const results = useMemo(() => {
    let result = [...LOCATIONS];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.tags.some(tag => tag.toLowerCase().includes(q)) ||
          l.shortDesc.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter(l => l.category === activeCategory);
    }

    if (activeCity !== 'Barchasi') {
      result = result.filter(l => l.city === activeCity);
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-asc':
        result.sort((a, b) => a.priceUSD - b.priceUSD);
        break;
      case 'price-desc':
        result.sort((a, b) => b.priceUSD - a.priceUSD);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return result;
  }, [debouncedSearch, activeCategory, activeCity, sortBy]);

  const hasActiveFilters =
    activeCategory !== 'all' || activeCity !== 'Barchasi' || sortBy !== 'rating';

  function clearFilters() {
    setActiveCategory('all');
    setActiveCity('Barchasi');
    setSortBy('rating');
    setSearch('');
  }

  return (
    <div className="pb-6">
      <PageHeader
        title={t('locations', 'title')}
        subtitle={`${results.length} ${t('locations', 'found')}`}
        action={
          // Count animates on filter changes so the number visibly reacts
          // to what the user just did, instead of silently swapping.
          <motion.span
            key={results.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="inline-block px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 tabular-nums"
          >
            {results.length}
          </motion.span>
        }
      />

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder={t('locations', 'search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-2.5 rounded-xl',
                'bg-[var(--muted)] border border-[var(--border)]',
                'text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)]',
                'outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all'
              )}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl border transition-all',
              showFilters || hasActiveFilters
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-indigo-500/40'
            )}
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category pills — the active background slides between pills via
          a shared layoutId instead of instantly swapping classes, so
          switching filters reads as one element moving, not a hard cut. */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 mb-2 scrollbar-hide">
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.key;
          const accent = CATEGORY_STYLE[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 min-h-[44px] rounded-2xl border text-xs font-semibold shrink-0 transition-all',
                active
                  ? 'border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : cn(
                      'border-transparent bg-[var(--card)] hover:border-indigo-500/30',
                      accent.surface,
                      accent.text
                    )
              )}
            >
              {active && (
                <motion.span
                  layoutId="locations-category-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  className="absolute inset-0 rounded-2xl bg-indigo-500"
                />
              )}
              <cat.Icon
                className={cn('relative w-3.5 h-3.5', active ? 'text-white' : accent.icon)}
                strokeWidth={2}
              />
              <span className="relative">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded filters */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 mb-4 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-transparent shadow-[var(--shadow-card)] space-y-4">
              {/* City */}
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)] mb-2">
                  {t('locations', 'city_filter')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => setActiveCity(city)}
                      className={cn(
                        'px-3.5 min-h-[44px] rounded-full border text-xs font-medium transition-all',
                        activeCity === city
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] hover:border-indigo-500/30'
                      )}
                    >
                      {city === 'Barchasi' ? t('locations', 'filter_all') : city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)] mb-2">
                  {t('locations', 'sort_label')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={cn(
                        'px-3.5 min-h-[44px] rounded-full border text-xs font-medium transition-all',
                        sortBy === opt.key
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] hover:border-indigo-500/30'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-xs text-red-400 border border-red-400/20 bg-red-500/5 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  {t('locations', 'clear_filters')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 flex flex-col items-center justify-center py-16 gap-3"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
            className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"
          >
            <Search className="w-7 h-7 text-indigo-500/60" strokeWidth={1.5} />
          </motion.div>
          <p className="text-[var(--foreground)] font-semibold text-base">
            {t('locations', 'no_results')}
          </p>
          <p className="text-[var(--muted-foreground)] text-sm text-center">
            {t('locations', 'no_results_hint')}
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 hover:-translate-y-px shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          >
            {t('locations', 'clear')}
          </button>
        </motion.div>
      ) : (
        <div className="px-4">
          {/* `layout` lets surviving cards glide to their new grid position
              when a filter removes others, instead of teleporting. */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {results.map(loc => (
              <motion.div key={loc.id} layout variants={staggerItem}>
                <LocationCard location={loc} variant="default" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
