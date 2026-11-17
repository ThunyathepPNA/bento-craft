import { useMemo, useState } from 'react';
import {
  BENTO_LAYOUTS,
  BENTO_PRESETS,
  FOOD_ITEMS,
  WASHOKU_COLOR_META,
} from './data/bentoCatalog';
import type {
  BentoLayoutTemplate,
  BoxThemeId,
  FoodCategory,
  FoodItem,
  SlottedFood,
  WashokuColor,
} from './types/bento';
import { FoodIllustration } from './components/FoodIllustration';

const IMPECCABLE_CATEGORY_META: Record<
  FoodCategory,
  { labelTh: string; kanji: string }
> = {
  base: { labelTh: 'ข้าว & เส้น', kanji: '主食' },
  main: { labelTh: 'โปรตีนหลัก', kanji: '主菜' },
  side: { labelTh: 'เครื่องเคียง', kanji: '副菜' },
  sweet: { labelTh: 'ของหวาน & ผลไม้', kanji: '甘味' },
  topping: { labelTh: 'ท็อปปิ้ง & ซอส', kanji: '薬味' },
};

const BOX_THEMES: Record<
  BoxThemeId,
  {
    nameTh: string;
    kanji: string;
    outerClass: string;
    dividerClass: string;
    slotBgClass: string;
    dotColor: string;
  }
> = {
  hinoki: {
    nameTh: 'ไม้สนฮิโนกิ',
    kanji: '檜木箱',
    outerClass:
      'bg-gradient-to-br from-[#DCC09A] via-[#CEA97B] to-[#BC915D] p-3.5 shadow-[0_24px_48px_-12px_rgba(68,44,18,0.28)] border border-[#A67B48] ring-1 ring-inset ring-white/30',
    dividerClass: 'gap-2.5 bg-[#8E6537] p-2.5 rounded-[18px] shadow-inner',
    slotBgClass: 'bg-[#FAF6EF] border-[#C9A679] text-[#181614]',
    dotColor: 'bg-[#C99E67]',
  },
  urushi: {
    nameTh: 'ลงรักคุโระขอบทอง',
    kanji: '黒漆塗',
    outerClass:
      'bg-[#161413] p-3.5 shadow-[0_28px_56px_-12px_rgba(0,0,0,0.45)] border border-[#B58448]/70 ring-1 ring-inset ring-[#B58448]/30',
    dividerClass: 'gap-2.5 bg-[#380E0C] p-2.5 rounded-[18px] ring-1 ring-[#B58448]/25',
    slotBgClass: 'bg-[#1D1918] border-[#4E1916] text-[#F6F3EC]',
    dotColor: 'bg-[#181614]',
  },
  sakura: {
    nameTh: 'เซรามิกชิการากิ',
    kanji: '信楽焼',
    outerClass:
      'bg-[#E6E0D5] p-3.5 shadow-[0_24px_48px_-12px_rgba(40,36,30,0.16)] border border-[#CFC7B8] ring-1 ring-inset ring-white/60',
    dividerClass: 'gap-2.5 bg-[#CBC3B4] p-2.5 rounded-[18px] shadow-inner',
    slotBgClass: 'bg-[#FDFBF7] border-[#D8D1C4] text-[#181614]',
    dotColor: 'bg-[#D8D1C4]',
  },
};

export function App() {
  const [layoutId, setLayoutId] = useState<BentoLayoutTemplate['id']>('classic-4');
  const [boxTheme, setBoxTheme] = useState<BoxThemeId>('hinoki');
  const [visualMode, setVisualMode] = useState<'full-photo' | 'plated'>('full-photo');

  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [bentoSlots, setBentoSlots] = useState<Record<string, SlottedFood>>(() => {
    const salmon = FOOD_ITEMS.find((f) => f.id === 'main-salmon-teriyaki')!;
    const rice = FOOD_ITEMS.find((f) => f.id === 'rice-koshihikari')!;
    const tamago = FOOD_ITEMS.find((f) => f.id === 'side-tamagoyaki')!;
    const mochi = FOOD_ITEMS.find((f) => f.id === 'sweet-matcha-mochi')!;
    const furikake = FOOD_ITEMS.find((f) => f.id === 'top-furikake')!;
    const tobiko = FOOD_ITEMS.find((f) => f.id === 'top-tobiko')!;
    return {
      'slot-1': { item: rice, toppings: [furikake] },
      'slot-2': { item: salmon, toppings: [tobiko] },
      'slot-3': { item: tamago, toppings: [] },
      'slot-4': { item: mochi, toppings: [] },
    };
  });

  const [draggedFoodId, setDraggedFoodId] = useState<string | null>(null);
  const [draggedFromSlotId, setDraggedFromSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [selectedFoodForTap, setSelectedFoodForTap] = useState<FoodItem | null>(null);

  const [isLidClosed, setIsLidClosed] = useState(false);
  const [customLabel, setCustomLabel] = useState('特製御弁当 • Folk’s Crafted Bento');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentLayout = useMemo(
    () => BENTO_LAYOUTS.find((l) => l.id === layoutId) ?? BENTO_LAYOUTS[0],
    [layoutId]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const filteredFoods = useMemo(() => {
    return FOOD_ITEMS.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.nameTh.toLowerCase().includes(q) ||
        item.nameJp.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const placeFoodInSlot = (slotId: string, food: FoodItem, sourceSlotId?: string | null) => {
    if (isLidClosed) setIsLidClosed(false);

    if (food.category === 'topping') {
      const existing = bentoSlots[slotId];
      if (!existing) {
        showToast('กรุณาเลือกอาหารหลักลงในช่องก่อนวางท็อปปิ้ง');
        return;
      }
      if (existing.toppings.some((t) => t.id === food.id)) {
        showToast(`มี ${food.nameTh} ในช่องนี้อยู่แล้ว`);
        return;
      }
      setBentoSlots((prev) => ({
        ...prev,
        [slotId]: {
          ...prev[slotId],
          toppings: [...prev[slotId].toppings, food],
        },
      }));
      showToast(`เพิ่มท็อปปิ้ง "${food.nameTh}" เรียบร้อย`);
      setSelectedFoodForTap(null);
      return;
    }

    setBentoSlots((prev) => {
      const next = { ...prev };
      if (sourceSlotId && sourceSlotId !== slotId) {
        const targetExisting = next[slotId];
        const sourceExisting = next[sourceSlotId];
        if (sourceExisting) {
          next[slotId] = sourceExisting;
          if (targetExisting) {
            next[sourceSlotId] = targetExisting;
          } else {
            delete next[sourceSlotId];
          }
        }
        return next;
      }

      next[slotId] = { item: food, toppings: [] };
      return next;
    });

    showToast(`จัดวาง "${food.nameTh}" ลงในช่องเรียบร้อย`);
    setSelectedFoodForTap(null);
  };

  const autoPlaceFood = (food: FoodItem) => {
    if (food.category === 'topping') {
      const firstFilledSlot = currentLayout.slots.find((s) => Boolean(bentoSlots[s.id]));
      if (!firstFilledSlot) {
        showToast('กรุณาใส่อาหารหลักในกล่องก่อนเพิ่มท็อปปิ้ง');
        return;
      }
      placeFoodInSlot(firstFilledSlot.id, food);
      return;
    }

    const emptyMatching = currentLayout.slots.find(
      (s) => s.recommendedCategory === food.category && !bentoSlots[s.id]
    );
    if (emptyMatching) {
      placeFoodInSlot(emptyMatching.id, food);
      return;
    }

    const anyEmpty = currentLayout.slots.find((s) => !bentoSlots[s.id]);
    if (anyEmpty) {
      placeFoodInSlot(anyEmpty.id, food);
      return;
    }

    const matchingSlot =
      currentLayout.slots.find((s) => s.recommendedCategory === food.category) ??
      currentLayout.slots[0];
    placeFoodInSlot(matchingSlot.id, food);
  };

  const removeSlotItem = (slotId: string) => {
    setBentoSlots((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const removeToppingFromSlot = (slotId: string, toppingId: string) => {
    setBentoSlots((prev) => {
      const current = prev[slotId];
      if (!current) return prev;
      return {
        ...prev,
        [slotId]: {
          ...current,
          toppings: current.toppings.filter((t) => t.id !== toppingId),
        },
      };
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = BENTO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setIsLidClosed(false);
    setLayoutId(preset.layoutId);
    const nextSlots: Record<string, SlottedFood> = {};
    Object.entries(preset.slots).forEach(([slotId, cfg]) => {
      const item = FOOD_ITEMS.find((f) => f.id === cfg.itemId);
      if (item) {
        const toppings = (cfg.toppingIds ?? [])
          .map((tid) => FOOD_ITEMS.find((f) => f.id === tid))
          .filter((t): t is FoodItem => Boolean(t));
        nextSlots[slotId] = { item, toppings };
      }
    });
    setBentoSlots(nextSlots);
    showToast(`จัดเซ็ต "${preset.nameTh}" เรียบร้อย`);
  };

  const randomizeBento = () => {
    setIsLidClosed(false);
    const nextSlots: Record<string, SlottedFood> = {};
    const toppingsPool = FOOD_ITEMS.filter((f) => f.category === 'topping');

    currentLayout.slots.forEach((slot) => {
      const pool = FOOD_ITEMS.filter((f) => f.category === slot.recommendedCategory);
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      if (randomItem) {
        const maybeTopping =
          (slot.recommendedCategory === 'base' || slot.recommendedCategory === 'main') &&
          Math.random() > 0.35
            ? [toppingsPool[Math.floor(Math.random() * toppingsPool.length)]]
            : [];
        nextSlots[slot.id] = {
          item: randomItem,
          toppings: maybeTopping,
        };
      }
    });

    setBentoSlots(nextSlots);
    showToast('สุ่มจัดสำรับโอมากาเสะ (Omakase) เรียบร้อย');
  };

  const telemetry = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let foodPrice = 0;
    let filledCount = 0;
    const colorSet = new Set<WashokuColor>();

    currentLayout.slots.forEach((slot) => {
      const entry = bentoSlots[slot.id];
      if (!entry) return;
      filledCount += 1;
      const allItems = [entry.item, ...entry.toppings];
      allItems.forEach((f) => {
        calories += f.calories;
        protein += f.protein;
        carbs += f.carbs;
        fat += f.fat;
        foodPrice += f.price;
        f.washokuColors.forEach((c) => colorSet.add(c));
      });
    });

    const totalPrice = filledCount > 0 ? foodPrice + currentLayout.baseBoxFee : 0;
    const fillRatio = currentLayout.slots.length > 0 ? filledCount / currentLayout.slots.length : 0;
    const colorRatio = colorSet.size / 5;
    const harmonyScore = Math.round((fillRatio * 0.55 + colorRatio * 0.45) * 100);

    return {
      calories,
      protein,
      carbs,
      fat: Math.round(fat * 10) / 10,
      totalPrice,
      filledCount,
      totalSlots: currentLayout.slots.length,
      colorsPresent: Array.from(colorSet),
      harmonyScore,
    };
  }, [bentoSlots, currentLayout]);

  const activeTheme = BOX_THEMES[boxTheme];

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#181614] pb-16">
      {/* Minimalist Sumi Ink Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181614] text-[#FAF8F5] px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 text-xs font-medium tracking-wide animate-pop-in">
          <span className="w-2 h-2 rounded-full bg-[#C83E2B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editorial Top Header (Zero Emoji Clutter) */}
      <header className="sticky top-0 z-30 bg-[#F6F3EC]/90 backdrop-blur-md border-b border-[#E4DEC8]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Traditional Vermilion Hanko Stamp */}
            <div
              className="w-10 h-10 rounded-lg bg-[#C83E2B] text-[#FAF8F5] flex flex-col items-center justify-center leading-none border border-[#A32C1C] shadow-sm select-none"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              <span className="text-[11px] font-bold tracking-tighter">特製</span>
              <span className="text-[11px] font-bold tracking-tighter">辨當</span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-[#181614]">
                  BentoCraft Atelier
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded bg-[#EFECE4] text-[#5C564F] border border-[#E4DEC8]">
                  Impeccable Craft UI
                </span>
              </div>
              <p className="text-xs text-[#6E675F]">
                สตูดิโอออกแบบสำรับเบนโตะญี่ปุ่น • ลากวางภาพถ่ายอาหารจริงและคำนวณสมดุลโภชนาการ 5 สี (五色)
              </p>
            </div>
          </div>

          {/* Curated Omakase Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C847A] hidden xl:inline mr-1">
              Curated Sets
            </span>
            {BENTO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#FDFBF7] hover:bg-[#EFECE4] text-[#181614] border border-[#E4DEC8] transition-colors"
              >
                {preset.nameTh}
              </button>
            ))}
            <button
              onClick={randomizeBento}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#181614] hover:bg-[#C83E2B] text-[#FAF8F5] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>สุ่มจัดสำรับ (Omakase)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 12-Column Architectural Workspace */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 cols): Oshinagaki Menu Drawer */}
        <section className="lg:col-span-5 xl:col-span-4 bg-[#FDFBF7] rounded-2xl border border-[#E4DEC8] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-[#E4DEC8]">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-xs font-semibold text-[#C83E2B] tracking-widest"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  お品書き
                </span>
                <h2 className="text-base font-bold text-[#181614]">รายการอาหาร (Oshinagaki)</h2>
              </div>
              <span className="text-xs text-[#8C847A] tabular-nums">{filteredFoods.length} รายการ</span>
            </div>
            <p className="text-xs text-[#6E675F] mb-3.5">
              ลากภาพเมนูไปยังช่องเบนโตะ หรือคลิกเลือกเมนูแล้วกดที่ช่องเป้าหมาย
            </p>

            {/* Clean Search Field */}
            <div className="relative mb-3">
              <svg
                className="w-4 h-4 text-[#8C847A] absolute left-3 top-2.5 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเมนู เช่น แซลมอน, วากิว, ไข่ม้วน, โมจิ..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F6F3EC] border border-[#E4DEC8] rounded-lg focus:outline-none focus:border-[#181614] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-[#8C847A] hover:text-[#181614] px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Editorial Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-[#181614] text-[#FAF8F5]'
                    : 'bg-[#F6F3EC] text-[#5C564F] hover:bg-[#EFECE4]'
                }`}
              >
                ทั้งหมด
              </button>
              {(Object.keys(IMPECCABLE_CATEGORY_META) as FoodCategory[]).map((cat) => {
                const meta = IMPECCABLE_CATEGORY_META[cat];
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#181614] text-[#FAF8F5]'
                        : 'bg-[#F6F3EC] text-[#5C564F] hover:bg-[#EFECE4]'
                    }`}
                  >
                    <span
                      className={`text-[10px] ${isActive ? 'text-[#C83E2B]' : 'text-[#8C847A]'}`}
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      {meta.kanji}
                    </span>
                    <span>{meta.labelTh}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tap Selection Banner */}
          {selectedFoodForTap && (
            <div className="px-4 py-2.5 bg-[#EFECE4] border-b border-[#E4DEC8] flex items-center justify-between gap-2 text-xs text-[#181614]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#C83E2B] flex-shrink-0" />
                <span className="truncate">
                  เลือก <strong>{selectedFoodForTap.nameTh}</strong> — คลิกช่องเบนโตะเพื่อจัดวาง
                </span>
              </div>
              <button
                onClick={() => setSelectedFoodForTap(null)}
                className="text-[11px] font-semibold underline text-[#5C564F] hover:text-[#181614] flex-shrink-0"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Distilled Menu List (Hairline dividers instead of nested box soup) */}
          <div className="divide-y divide-[#E4DEC8] max-h-[620px] overflow-y-auto">
            {filteredFoods.map((food) => {
              const catMeta = IMPECCABLE_CATEGORY_META[food.category];
              const isSelectedForTap = selectedFoodForTap?.id === food.id;

              return (
                <div
                  key={food.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', food.id);
                    e.dataTransfer.effectAllowed = 'copyMove';
                    setDraggedFoodId(food.id);
                    setDraggedFromSlotId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedFoodId(null);
                    setDragOverSlotId(null);
                  }}
                  onClick={() =>
                    setSelectedFoodForTap((prev) => (prev?.id === food.id ? null : food))
                  }
                  className={`group p-3.5 sm:px-5 flex items-center gap-3.5 transition-colors cursor-grab active:cursor-grabbing select-none ${
                    isSelectedForTap
                      ? 'bg-[#EFECE4]/90 ring-1 ring-inset ring-[#B58448]'
                      : 'hover:bg-[#F6F3EC]/80'
                  }`}
                >
                  {/* 64x64 Square-Rounded Studio Food Photography */}
                  <div className="relative flex-shrink-0">
                    <FoodIllustration
                      foodId={food.id}
                      nameTh={food.nameTh}
                      emoji={food.emoji}
                      size="md"
                      className="!w-16 !h-16 !rounded-xl shadow-sm"
                    />
                  </div>

                  {/* Editorial Typography */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C847A]">
                        {catMeta.kanji} • {catMeta.labelTh}
                      </span>
                      <span className="text-xs font-bold text-[#181614] tabular-nums">
                        ฿{food.price}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#181614] truncate mt-0.5">
                      {food.nameTh}
                    </h3>
                    <p className="text-[11px] text-[#6E675F] line-clamp-1 mt-0.5">
                      {food.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[11px] tabular-nums text-[#6E675F]">
                      <div className="flex items-center gap-2.5">
                        <span>{food.calories} kcal</span>
                        <span className="text-[#CFC7B8]">•</span>
                        <span>P {food.protein}g</span>
                        <span className="text-[#CFC7B8]">•</span>
                        <span>C {food.carbs}g</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          autoPlaceFood(food);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#F6F3EC] group-hover:bg-[#181614] text-[#181614] group-hover:text-[#FAF8F5] border border-[#E4DEC8] group-hover:border-[#181614] text-[11px] font-semibold transition-colors"
                      >
                        + จัดวาง
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT WORKSPACE (8 cols): Vessel Controls, Hero Bento Tray & Telemetry Ledger */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Vessel & Material Control Bar */}
          <div className="bg-[#FDFBF7] rounded-2xl border border-[#E4DEC8] p-4 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Step 01: Vessel Geometry */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C847A] tabular-nums">
                  01 / รูปทรงกล่อง (Vessel Geometry)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BENTO_LAYOUTS.map((layout) => {
                  const active = layout.id === layoutId;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => setLayoutId(layout.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border tabular-nums ${
                        active
                          ? 'bg-[#181614] text-[#FAF8F5] border-[#181614]'
                          : 'bg-[#F6F3EC] hover:bg-[#EFECE4] text-[#5C564F] border-[#E4DEC8]'
                      }`}
                    >
                      <span>{layout.nameTh}</span>
                      <span className={`ml-1.5 text-[10px] ${active ? 'text-[#B58448]' : 'text-[#8C847A]'}`}>
                        ({layout.slots.length} ช่อง)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 02: Craft Finish */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C847A] tabular-nums">
                  02 / วัสดุงานคราฟต์ (Craft Finish)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(BOX_THEMES) as BoxThemeId[]).map((tid) => {
                  const t = BOX_THEMES[tid];
                  const active = boxTheme === tid;
                  return (
                    <button
                      key={tid}
                      onClick={() => setBoxTheme(tid)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2 ${
                        active
                          ? 'bg-[#181614] text-[#FAF8F5] border-[#181614]'
                          : 'bg-[#F6F3EC] hover:bg-[#EFECE4] text-[#5C564F] border-[#E4DEC8]'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full border border-white/40 ${t.dotColor}`} />
                      <span>{t.nameTh}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* THE HERO BENTO VESSEL CANVAS */}
          <div className="bg-[#FDFBF7] rounded-2xl border border-[#E4DEC8] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E4DEC8]">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-[#181614]">
                    {currentLayout.nameTh}
                  </h2>
                  <span
                    className="text-xs text-[#8C847A]"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    {currentLayout.nameJp}
                  </span>
                </div>
                <p className="text-xs text-[#6E675F] mt-0.5">{currentLayout.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    setVisualMode((prev) => (prev === 'full-photo' ? 'plated' : 'full-photo'))
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F6F3EC] hover:bg-[#EFECE4] text-[#181614] border border-[#E4DEC8] transition-colors"
                >
                  {visualMode === 'full-photo' ? 'มุมมอง: ภาพถ่ายเต็มช่อง' : 'มุมมอง: จัดจาน'}
                </button>
                <button
                  onClick={() => setIsLidClosed((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isLidClosed
                      ? 'bg-[#C83E2B] text-white border-[#C83E2B]'
                      : 'bg-[#F6F3EC] hover:bg-[#EFECE4] text-[#181614] border-[#E4DEC8]'
                  }`}
                >
                  {isLidClosed ? 'เปิดฝากล่องเบนโตะ' : 'คาดสายโอบิ & ปิดฝา'}
                </button>
                <button
                  onClick={() => {
                    setBentoSlots({});
                    setIsLidClosed(false);
                    showToast('ล้างอาหารในกล่องทั้งหมดแล้ว');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#8C847A] hover:text-[#C83E2B] hover:bg-[#F6F3EC] transition-colors"
                >
                  ล้างกล่อง
                </button>
              </div>
            </div>

            {/* Concentric Bento Tray: Outer rounded-[28px] -> Inner rounded-[18px] -> Slot rounded-[12px] */}
            <div className={`relative rounded-[28px] transition-all duration-300 ${activeTheme.outerClass}`}>
              {isLidClosed ? (
                <div className="min-h-[380px] rounded-[18px] bg-[#181614] flex flex-col items-center justify-center p-6 text-center text-[#FAF8F5] relative overflow-hidden animate-pop-in">
                  {/* Traditional Japanese Washi & Vermilion Obi Sash */}
                  <div className="absolute inset-y-0 w-32 bg-[#FAF8F5] border-x-2 border-[#C83E2B] shadow-2xl flex flex-col items-center justify-between py-6" />

                  <div className="relative z-10 bg-[#FDFBF7] text-[#181614] p-6 rounded-xl shadow-2xl border border-[#E4DEC8] max-w-sm w-full">
                    <div
                      className="text-[11px] font-bold tracking-[0.2em] text-[#C83E2B] mb-1.5"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      謹製 • OMOTENASHI BENTO
                    </div>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full text-center font-bold text-sm bg-[#F6F3EC] border border-[#E4DEC8] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#181614]"
                    />
                    <div className="mt-3 pt-3 border-t border-[#E4DEC8] flex items-center justify-center gap-4 text-xs text-[#5C564F] tabular-nums">
                      <span>{telemetry.filledCount}/{telemetry.totalSlots} ช่อง</span>
                      <span>•</span>
                      <span>{telemetry.calories} kcal</span>
                      <span>•</span>
                      <span className="font-bold text-[#181614]">฿{telemetry.totalPrice}</span>
                    </div>
                    <button
                      onClick={() => setIsLidClosed(false)}
                      className="mt-4 w-full py-2 rounded-lg bg-[#181614] hover:bg-[#C83E2B] text-[#FAF8F5] text-xs font-semibold transition-colors"
                    >
                      เปิดฝากล่องเพื่อแก้ไขสำรับ
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`grid ${currentLayout.gridContainerClass} ${activeTheme.dividerClass}`}>
                  {currentLayout.slots.map((slot, idx) => {
                    const slotted = bentoSlots[slot.id];
                    const recMeta = IMPECCABLE_CATEGORY_META[slot.recommendedCategory];
                    const isOver = dragOverSlotId === slot.id;
                    const slotNumber = String(idx + 1).padStart(2, '0');

                    const draggedFood = FOOD_ITEMS.find((f) => f.id === draggedFoodId);
                    const isRecommendedTarget =
                      (draggedFood && draggedFood.category === slot.recommendedCategory) ||
                      (selectedFoodForTap &&
                        selectedFoodForTap.category === slot.recommendedCategory);

                    return (
                      <div
                        key={slot.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverSlotId !== slot.id) setDragOverSlotId(slot.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverSlotId === slot.id) setDragOverSlotId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSlotId(null);
                          const droppedId = e.dataTransfer.getData('text/plain') || draggedFoodId;
                          const food = FOOD_ITEMS.find((f) => f.id === droppedId);
                          if (food) {
                            placeFoodInSlot(slot.id, food, draggedFromSlotId);
                          }
                          setDraggedFoodId(null);
                          setDraggedFromSlotId(null);
                        }}
                        onClick={() => {
                          if (selectedFoodForTap) {
                            placeFoodInSlot(slot.id, selectedFoodForTap);
                          }
                        }}
                        className={`${slot.gridSpanClass} ${slot.minHeightClass} group relative rounded-[12px] border transition-all duration-200 overflow-hidden shadow-[inset_0_3px_12px_rgba(0,0,0,0.22)] ${
                          activeTheme.slotBgClass
                        } ${
                          isOver
                            ? 'ring-2 ring-[#C83E2B] border-[#C83E2B] scale-[1.005]'
                            : isRecommendedTarget
                            ? 'ring-2 ring-[#B58448]'
                            : ''
                        } ${selectedFoodForTap ? 'cursor-pointer' : ''}`}
                      >
                        {slotted && visualMode === 'full-photo' ? (
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', slotted.item.id);
                              setDraggedFoodId(slotted.item.id);
                              setDraggedFromSlotId(slot.id);
                            }}
                            onDragEnd={() => {
                              setDraggedFoodId(null);
                              setDraggedFromSlotId(null);
                              setDragOverSlotId(null);
                            }}
                            className="relative w-full h-full min-h-[inherit] flex flex-col justify-between p-3 cursor-grab active:cursor-grabbing select-none animate-pop-in"
                          >
                            {/* Full-Compartment Top-Down Studio Photo */}
                            <div className="absolute inset-0 z-0">
                              <FoodIllustration
                                foodId={slotted.item.id}
                                nameTh={slotted.item.nameTh}
                                emoji={slotted.item.emoji}
                                size="fill"
                                className="!rounded-none w-full h-full"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]" />
                            </div>

                            {/* Top Index & Remove Action */}
                            <div className="relative z-10 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/55 text-white/90 backdrop-blur-md tabular-nums">
                                {slotNumber} • {recMeta.kanji}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSlotItem(slot.id);
                                }}
                                className="opacity-85 hover:opacity-100 px-2 py-0.5 rounded bg-black/60 hover:bg-[#C83E2B] text-white text-[10px] font-medium backdrop-blur-md transition-colors"
                              >
                                นำออก
                              </button>
                            </div>

                            {/* Layered Toppings with Real Circular Photos */}
                            {slotted.toppings.length > 0 && (
                              <div className="relative z-10 my-auto flex flex-wrap items-center justify-end gap-1.5">
                                {slotted.toppings.map((top) => (
                                  <div
                                    key={top.id}
                                    className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20 text-[10px] font-medium"
                                  >
                                    <FoodIllustration
                                      foodId={top.id}
                                      nameTh={top.nameTh}
                                      emoji={top.emoji}
                                      size="sm"
                                      className="!w-5 !h-5 !rounded-full"
                                    />
                                    <span>+{top.nameTh}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeToppingFromSlot(slot.id, top.id);
                                      }}
                                      className="hover:text-[#C83E2B] font-bold ml-0.5"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Bottom Editorial Dish Caption */}
                            <div className="relative z-10 flex items-end justify-between gap-2 pt-2">
                              <div className="min-w-0">
                                <div
                                  className="text-[10px] text-[#E4DEC8] tracking-wider"
                                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                                >
                                  {slotted.item.nameJp}
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-white leading-snug truncate">
                                  {slotted.item.nameTh}
                                </h3>
                              </div>
                              <div className="text-right tabular-nums flex-shrink-0 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-white">
                                <div className="text-[10px] text-[#E4DEC8]">
                                  {slotted.item.calories +
                                    slotted.toppings.reduce((acc, t) => acc + t.calories, 0)}{' '}
                                  kcal
                                </div>
                                <div className="text-xs font-bold">
                                  ฿
                                  {slotted.item.price +
                                    slotted.toppings.reduce((acc, t) => acc + t.price, 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : slotted ? (
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', slotted.item.id);
                              setDraggedFoodId(slotted.item.id);
                              setDraggedFromSlotId(slot.id);
                            }}
                            onDragEnd={() => {
                              setDraggedFoodId(null);
                              setDraggedFromSlotId(null);
                              setDragOverSlotId(null);
                            }}
                            className="p-3.5 h-full flex flex-col justify-between cursor-grab active:cursor-grabbing animate-pop-in"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                              <span className="font-semibold opacity-65">
                                {slotNumber} • {recMeta.labelTh}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSlotItem(slot.id);
                                }}
                                className="text-[#C83E2B] hover:underline text-[11px] font-medium"
                              >
                                นำออก
                              </button>
                            </div>

                            <div className="my-auto py-2 flex flex-col items-center text-center">
                              <FoodIllustration
                                foodId={slotted.item.id}
                                nameTh={slotted.item.nameTh}
                                emoji={slotted.item.emoji}
                                size="lg"
                                className="!rounded-2xl shadow-md"
                              />
                              <h3 className="mt-2 text-sm font-bold leading-snug">
                                {slotted.item.nameTh}
                              </h3>
                              <p className="text-[11px] opacity-60">{slotted.item.nameJp}</p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-current/10 tabular-nums opacity-80">
                              <span>{slotted.item.calories} kcal</span>
                              <span className="font-bold">฿{slotted.item.price}</span>
                            </div>
                          </div>
                        ) : (
                          /* Distilled Empty Compartment Dropzone */
                          <div className="p-3.5 h-full min-h-[inherit] flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums opacity-60">
                              <span className="font-bold">{slotNumber}</span>
                              <span style={{ fontFamily: "'Noto Serif JP', serif" }}>
                                {recMeta.kanji} • {recMeta.labelTh}
                              </span>
                            </div>

                            <div className="my-auto py-4 flex flex-col items-center justify-center text-center border border-dashed border-current/25 rounded-lg p-3 opacity-65">
                              <span
                                className="text-lg font-serif mb-1 opacity-70"
                                style={{ fontFamily: "'Noto Serif JP', serif" }}
                              >
                                {recMeta.kanji}
                              </span>
                              <p className="text-xs font-medium">ลากภาพเมนูมาวางในช่องนี้</p>
                              <p className="text-[10px] opacity-70 mt-0.5">
                                แนะนำหมวด: {recMeta.labelTh}
                              </p>
                            </div>

                            <div className="text-[10px] opacity-45 tabular-nums">ว่าง</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E675F] px-1">
              <span>
                สามารถลากสลับช่องอาหารภายในกล่องได้โดยตรง และลากหมวด <strong>薬味 ท็อปปิ้ง & ซอส</strong> วางซ้อนทับช่องที่มีอาหารได้
              </span>
              <span className="tabular-nums font-medium text-[#181614]">
                จัดวางแล้ว {telemetry.filledCount} จาก {telemetry.totalSlots} ช่อง
              </span>
            </div>
          </div>

          {/* ARCHITECTURAL TELEMETRY LEDGER (Impeccable Anti-Slop: Unified Hairline Grid, Zero Rainbow Cards) */}
          <div className="bg-[#FDFBF7] rounded-2xl border border-[#E4DEC8] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E4DEC8]">
              {/* Left 7 Cols: Nutritional Breakdown */}
              <div className="md:col-span-7 p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C847A] block">
                      Nutritional Ledger
                    </span>
                    <h3 className="text-sm font-bold text-[#181614] mt-0.5">
                      สัดส่วนพลังงานและสารอาหารรวม
                    </h3>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-2xl font-bold text-[#181614]">{telemetry.calories}</span>
                    <span className="text-xs text-[#6E675F] ml-1">kcal / 850 kcal</span>
                  </div>
                </div>

                {/* Single Intentional Sumi/Vermilion Progress Bar */}
                <div className="w-full h-1.5 bg-[#EFECE4] rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-[#181614] transition-all duration-300"
                    style={{ width: `${Math.min(100, (telemetry.calories / 850) * 100)}%` }}
                  />
                </div>

                {/* Unified 3-Column Hairline Macro Grid */}
                <div className="grid grid-cols-3 divide-x divide-[#E4DEC8] border border-[#E4DEC8] rounded-xl bg-[#F6F3EC]/60 tabular-nums">
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5C564F]">
                      <span className="w-2 h-2 rounded-full bg-[#C83E2B]" />
                      <span>โปรตีน (Protein)</span>
                    </div>
                    <div className="text-lg font-bold text-[#181614] mt-1">{telemetry.protein}g</div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5C564F]">
                      <span className="w-2 h-2 rounded-full bg-[#B58448]" />
                      <span>คาร์บ (Carbs)</span>
                    </div>
                    <div className="text-lg font-bold text-[#181614] mt-1">{telemetry.carbs}g</div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5C564F]">
                      <span className="w-2 h-2 rounded-full bg-[#5C564F]" />
                      <span>ไขมัน (Fat)</span>
                    </div>
                    <div className="text-lg font-bold text-[#181614] mt-1">{telemetry.fat}g</div>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Washoku Goshiki & Checkout */}
              <div className="md:col-span-5 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C847A]">
                      Washoku Goshiki (五色)
                    </span>
                    <span className="text-xs font-bold text-[#181614] tabular-nums">
                      ความสมดุล {telemetry.harmonyScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E675F] mb-3">
                    หลักสมดุลสีอาหาร 5 สีตามศาสตร์การปรุงอาหารญี่ปุ่นดั้งเดิม
                  </p>

                  <div className="grid grid-cols-5 gap-1.5 mb-4">
                    {(Object.keys(WASHOKU_COLOR_META) as WashokuColor[]).map((colorKey) => {
                      const meta = WASHOKU_COLOR_META[colorKey];
                      const achieved = telemetry.colorsPresent.includes(colorKey);
                      return (
                        <div
                          key={colorKey}
                          title={meta.desc}
                          className={`py-2 px-1 rounded-lg border text-center transition-all ${
                            achieved
                              ? 'bg-[#181614] text-[#FAF8F5] border-[#181614]'
                              : 'bg-[#F6F3EC] text-[#8C847A] border-[#E4DEC8] opacity-60'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${meta.dotClass}`} />
                          <div className="text-[10px] font-medium truncate">{meta.nameTh}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E4DEC8] flex items-center justify-between gap-3">
                  <div className="tabular-nums">
                    <div className="text-[11px] text-[#6E675F]">ยอดรวมสุทธิ</div>
                    <div className="text-2xl font-bold text-[#181614]">฿{telemetry.totalPrice}</div>
                  </div>
                  <button
                    onClick={() => setIsOrderModalOpen(true)}
                    disabled={telemetry.filledCount === 0}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#C83E2B] hover:bg-[#A83221] disabled:opacity-40 text-white font-semibold text-xs tracking-wide transition-colors shadow-sm"
                  >
                    สรุปรายการสั่งทำเบนโตะ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ORDER RECEIPT MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] border border-[#E4DEC8] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-pop-in">
            <div className="flex items-start justify-between pb-3 border-b border-[#E4DEC8]">
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C83E2B]"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  御計算書 • BENTOCRAFT ATELIER
                </span>
                <h3 className="text-base font-bold text-[#181614] mt-0.5">{customLabel}</h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#EFECE4] hover:bg-[#E4DEC8] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-[#6E675F] pb-2 border-b border-dashed border-[#E4DEC8] tabular-nums">
                <span>
                  ภาชนะ: {currentLayout.nameTh} ({activeTheme.nameTh})
                </span>
                <span className="font-semibold text-[#181614]">฿{currentLayout.baseBoxFee}</span>
              </div>

              {currentLayout.slots.map((slot) => {
                const entry = bentoSlots[slot.id];
                if (!entry) return null;
                return (
                  <div key={slot.id} className="space-y-1">
                    <div className="flex justify-between items-center font-medium text-[#181614]">
                      <div className="flex items-center gap-2.5">
                        <FoodIllustration
                          foodId={entry.item.id}
                          nameTh={entry.item.nameTh}
                          emoji={entry.item.emoji}
                          size="sm"
                          className="!w-8 !h-8 !rounded-md"
                        />
                        <span>{entry.item.nameTh}</span>
                      </div>
                      <span className="tabular-nums font-bold">฿{entry.item.price}</span>
                    </div>
                    {entry.toppings.map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center text-[11px] text-[#6E675F] pl-10 tabular-nums"
                      >
                        <span>+ {t.nameTh}</span>
                        <span>฿{t.price}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F3EC] border border-[#E4DEC8] text-xs space-y-1.5 tabular-nums mb-4">
              <div className="flex justify-between">
                <span className="text-[#6E675F]">พลังงานรวม:</span>
                <span className="font-bold text-[#181614]">{telemetry.calories} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E675F]">สารอาหารหลัก (P / C / F):</span>
                <span className="font-bold text-[#181614]">
                  {telemetry.protein}g / {telemetry.carbs}g / {telemetry.fat}g
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#181614] pt-2 border-t border-[#E4DEC8]">
                <span>ยอดชำระสุทธิ</span>
                <span>฿{telemetry.totalPrice}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOrderModalOpen(false);
                setIsLidClosed(true);
                showToast('บันทึกคำสั่งทำและคาดสายโอบิเรียบร้อย');
              }}
              className="w-full py-3 rounded-xl bg-[#181614] hover:bg-[#C83E2B] text-[#FAF8F5] font-semibold text-xs tracking-wide transition-colors"
            >
              ยืนยันสั่งทำ & คาดสายโอบิปิดฝากล่อง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
