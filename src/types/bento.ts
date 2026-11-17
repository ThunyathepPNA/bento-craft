export type FoodCategory = 'base' | 'main' | 'side' | 'sweet' | 'topping';

export type WashokuColor = 'white' | 'red' | 'green' | 'yellow' | 'black';

export interface FoodItem {
  id: string;
  nameTh: string;
  nameJp: string;
  category: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
  emoji: string;
  accentBg: string;
  accentBorder: string;
  badgeText: string;
  washokuColors: WashokuColor[];
  description: string;
  spicyLevel?: number;
  isPopular?: boolean;
  isHealthy?: boolean;
}

export interface BentoSlotConfig {
  id: string;
  labelTh: string;
  subLabel: string;
  recommendedCategory: FoodCategory;
  gridSpanClass: string;
  minHeightClass: string;
}

export interface BentoLayoutTemplate {
  id: 'classic-4' | 'makunouchi-5' | 'wellness-3';
  nameTh: string;
  nameJp: string;
  description: string;
  baseBoxFee: number;
  gridContainerClass: string;
  slots: BentoSlotConfig[];
}

export interface SlottedFood {
  item: FoodItem;
  toppings: FoodItem[];
  portionNote?: string;
}

export type BoxThemeId = 'hinoki' | 'urushi' | 'sakura';

export interface BentoPreset {
  id: string;
  nameTh: string;
  tagline: string;
  badge: string;
  layoutId: BentoLayoutTemplate['id'];
  slots: Record<string, { itemId: string; toppingIds?: string[] }>;
}
