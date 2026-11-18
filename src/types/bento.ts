export type FoodCategory = 'stirfry' | 'ricebowl' | 'soup' | 'topping' | 'base';

export type MeatTier = 'pork_chicken' | 'seafood' | 'egg' | 'base';

export type MeatChoice = 'หมู' | 'หมูสับ' | 'ไก่' | 'ไก่กรอบ' | 'ทะเล' | 'กุ้ง' | 'ปลาดอลลี่' | 'เนื้อวัว';

export interface FoodItem {
  id: string;
  menuNumber?: number;
  nameTh: string;
  subNameTh: string;
  category: FoodCategory;
  meatTier: MeatTier;
  availableMeats?: MeatChoice[];
  defaultMeat?: MeatChoice;
  meatPhotoMap?: Partial<Record<MeatChoice, { cropImage: string; fullBoxImage?: string }>>;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  addonPrice: number; // used for egg toppings (+10, +15, +20)
  hasRealPhoto: boolean;
  diecutImage?: string;
  cropImage?: string;
  fullBoxImage?: string;
  badgeText: string;
  description: string;
  spicyLevel?: number;
  isPopular?: boolean;
}

export interface BentoSlotConfig {
  id: string;
  labelTh: string;
  subLabel: string;
  recommendedCategory: FoodCategory;
  gridSpanClass: string;
  minHeightClass: string;
  isFoilCup?: boolean;
}

export interface BentoLayoutTemplate {
  id: 'box-2slot' | 'box-3slot';
  nameTh: string;
  subTitle: string;
  description: string;
  basePriceText: string;
  gridContainerClass: string;
  slots: BentoSlotConfig[];
}

export interface SlottedFood {
  item: FoodItem;
  selectedMeat?: MeatChoice;
  toppings: FoodItem[];
}

export interface RealBoxPreset {
  id: string;
  nameTh: string;
  setTierName: string;
  price: number;
  layoutId: BentoLayoutTemplate['id'];
  fullBoxPhoto: string;
  slots: Record<string, { itemId: string; selectedMeat?: MeatChoice; toppingIds?: string[] }>;
}
