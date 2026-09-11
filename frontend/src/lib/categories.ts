import { Church, Landmark, Leaf, Map as MapIcon, Palette, Pickaxe } from "lucide-react";
import type { Location } from "@/types";

export type Category = Location["category"];
export type CategoryFilterKey = Category | "all";

/**
 * The single source of truth for how a place category is rendered.
 *
 * This lived twice — once in components/locations/LocationCard.tsx as
 * CAT_STYLE and once in pages/Locations.tsx as CATEGORY_ACCENTS — and the
 * two had already drifted: the card gave "tarix" the remapped emerald and
 * "tabiat" a real emerald (two greens a user cannot tell apart), while the
 * filter row gave them different tints again, so the chip you filtered by
 * and the badge on the resulting card were different colours for the same
 * category. Two copies of a palette is two chances to drift; this is one.
 *
 * Every pair is declared LIGHT / DARK explicitly. A single `-600` step for
 * both themes was a genuine contrast failure on the dark canvas
 * (--card #141b2b): fuchsia-600 measured ~2.6:1 and the remapped
 * emerald-600 ~3.1:1, against a 4.5:1 AA floor — and the hue was the only
 * thing distinguishing one category from another. `-700` on the light
 * surface and `-300` on the dark one clear AA on both.
 *
 * Hues are kept distinct rather than collapsed into the brand's mono-green:
 * with five categories across 200+ places, colour is doing real scanning
 * work in the grid. They are ordered so no two adjacent categories share a
 * neighbouring hue.
 */
export interface CategoryStyle {
  /** lucide icon — one monoline family, constant 2px stroke */
  Icon: typeof Landmark;
  /** icon-only colour (filter row) */
  icon: string;
  /** text colour for a badge/chip */
  text: string;
  /** fill + border for a badge/chip sitting on a --card surface */
  surface: string;
  /**
   * Badge treatment for a badge sitting ON A PHOTOGRAPH (the card's image
   * corner). The `surface` tint above is a 12% wash, which works over the
   * flat, known --card colour and is effectively invisible over a photo —
   * leaving 9px text floating directly on whatever happened to be in that
   * corner of the image. Against the bright sky in most of these
   * photographs that is unreadable.
   *
   * A dark scrim plus a light tint of the category hue keeps the colour
   * coding while making legibility independent of the image, which is
   * exactly what the price badge beside it already does.
   */
  onImage: string;
  /** i18n key under the `home` section */
  tKey: string;
}

export const CATEGORY_STYLE: Record<CategoryFilterKey, CategoryStyle> = {
  all: {
    Icon: MapIcon,
    icon: "text-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300",
    surface: "bg-indigo-500/12 dark:bg-indigo-400/15 border-indigo-500/25",
    onImage: "bg-black/55 text-indigo-200 border-indigo-300/30",
    tKey: "cat_all",
  },
  tarix: {
    Icon: Landmark,
    icon: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-500/12 dark:bg-emerald-400/15 border-emerald-500/25",
    onImage: "bg-black/55 text-emerald-200 border-emerald-300/30",
    tKey: "cat_tarix",
  },
  tabiat: {
    Icon: Leaf,
    icon: "text-lime-600 dark:text-lime-400",
    text: "text-lime-700 dark:text-lime-300",
    surface: "bg-lime-500/12 dark:bg-lime-400/15 border-lime-500/25",
    onImage: "bg-black/55 text-lime-200 border-lime-300/30",
    tKey: "cat_tabiat",
  },
  madaniyat: {
    Icon: Palette,
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    surface: "bg-fuchsia-500/12 dark:bg-fuchsia-400/15 border-fuchsia-500/25",
    onImage: "bg-black/55 text-fuchsia-200 border-fuchsia-300/30",
    tKey: "cat_madaniyat",
  },
  din: {
    Icon: Church,
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-300",
    surface: "bg-amber-500/12 dark:bg-amber-400/15 border-amber-500/25",
    onImage: "bg-black/55 text-amber-200 border-amber-300/30",
    tKey: "cat_din",
  },
  arxeologiya: {
    Icon: Pickaxe,
    icon: "text-teal-600 dark:text-teal-400",
    text: "text-teal-700 dark:text-teal-300",
    surface: "bg-teal-500/12 dark:bg-teal-400/15 border-teal-500/25",
    onImage: "bg-black/55 text-teal-200 border-teal-300/30",
    tKey: "cat_arxeologiya",
  },
};
