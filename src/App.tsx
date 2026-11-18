import { useMemo, useState } from 'react';
import {
  BENTO_LAYOUTS,
  FOOD_ITEMS,
  isSeafoodMeat,
  REAL_BOX_PRESETS,
  ZEED_CATEGORY_META,
} from './data/bentoCatalog';
import type {
  BentoLayoutTemplate,
  FoodCategory,
  FoodItem,
  MeatChoice,
  SlottedFood,
} from './types/bento';
import { FoodIllustration } from './components/FoodIllustration';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let offsetX = x;
  let offsetY = y;
  if (imgRatio > boxRatio) {
    drawW = h * imgRatio;
    offsetX = x - (drawW - w) / 2;
  } else {
    drawH = w / imgRatio;
    offsetY = y - (drawH - h) / 2;
  }
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();
}

export function App() {
  const [layoutId, setLayoutId] = useState<BentoLayoutTemplate['id']>('box-3slot');
  const [viewMode, setViewMode] = useState<'compartment' | 'fullbox'>('compartment');
  const [onlyRealPhotos, setOnlyRealPhotos] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [boxCount, setBoxCount] = useState<number>(10);
  const [customerNote, setCustomerNote] = useState('ชุดจัดเบรกประชุม • ข้าวกล่อง ZeedKitchen');
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Track preferred meat per menu item in the catalog drawer
  const [menuMeatPrefs, setMenuMeatPrefs] = useState<Record<string, MeatChoice>>(() => {
    const prefs: Record<string, MeatChoice> = {};
    for (const item of FOOD_ITEMS) {
      if (item.defaultMeat) prefs[item.id] = item.defaultMeat;
    }
    return prefs;
  });

  const [slots, setSlots] = useState<Record<string, SlottedFood>>(() => {
    const find = (id: string) => FOOD_ITEMS.find((f) => f.id === id)!;
    return {
      // 3-slot defaults
      'slot-side': { item: find('base-salad-sauce'), toppings: [] },
      'slot-main': { item: find('menu-20-chicken-teriyaki'), toppings: [] },
      'slot-foil': { item: find('top-steamed-egg'), toppings: [] },
      // 2-slot defaults
      'slot-rice': { item: find('base-jasmine-rice'), toppings: [find('top-fried-egg')] },
      'slot-dish': {
        item: find('menu-03-panang'),
        selectedMeat: 'ไก่',
        toppings: [],
      },
    };
  });

  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot-main');
  const [draggedFoodId, setDraggedFoodId] = useState<string | null>(null);
  const [draggedFromSlotId, setDraggedFromSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const currentLayout = useMemo(
    () => BENTO_LAYOUTS.find((l) => l.id === layoutId) || BENTO_LAYOUTS[0],
    [layoutId]
  );

  const filteredFoods = useMemo(() => {
    return FOOD_ITEMS.filter((item) => {
      if (onlyRealPhotos && !item.hasRealPhoto) return false;
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.nameTh.toLowerCase().includes(q) ||
        item.subNameTh.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [onlyRealPhotos, activeCategory, searchQuery]);

  // Calculate authentic ZeedKitchen Set Price (50.- / 80.- / 100.- / 120.- + Egg Toppings)
  const pricing = useMemo(() => {
    let seafoodCount = 0;
    let addonTotal = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let filledCount = 0;
    let missingRealPhotoCount = 0;

    for (const slot of currentLayout.slots) {
      const slotted = slots[slot.id];
      if (!slotted) continue;
      filledCount += 1;

      const { item, selectedMeat, toppings } = slotted;
      if (!item.hasRealPhoto) missingRealPhotoCount += 1;

      totalCalories += item.calories;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFat += item.fat;

      if (isSeafoodMeat(selectedMeat, item.meatTier)) {
        seafoodCount += 1;
      }

      for (const top of toppings) {
        if (!top.hasRealPhoto) missingRealPhotoCount += 1;
        addonTotal += top.addonPrice;
        totalCalories += top.calories;
        totalProtein += top.protein;
        totalCarbs += top.carbs;
        totalFat += top.fat;
      }
    }

    let baseSetPrice = 50;
    let setName = 'เซตเริ่มต้น อิ่มคุ้ม (กับข้าว 1 อย่าง หมู/ไก่)';

    if (layoutId === 'box-2slot') {
      if (seafoodCount >= 1) {
        baseSetPrice = 70;
        setName = 'เซตเริ่มต้น เมนูทะเล (กล่อง 2 ช่อง)';
      } else {
        baseSetPrice = 50;
        setName = 'เซตเริ่มต้น อิ่มคุ้ม 50.- (กับข้าว 1 อย่าง หมู/ไก่)';
      }
    } else {
      if (seafoodCount >= 2) {
        baseSetPrice = 120;
        setName = 'เซตซีฟู้ดเลิฟเวอร์ 120.- (ทะเล 2 อย่าง)';
      } else if (seafoodCount === 1) {
        baseSetPrice = 100;
        setName = 'เซตยอดนิยม รวมทะเล 100.- (ทะเล 1 + หมู/ไก่ 1)';
      } else {
        baseSetPrice = 80;
        setName = 'เซตจุใจ ได้ 2 อย่าง 80.- (หมู/ไก่ 2 อย่าง)';
      }
    }

    const unitPrice = baseSetPrice + addonTotal;
    const grandTotal = unitPrice * Math.max(1, boxCount);

    const mainSlotId = layoutId === 'box-3slot' ? 'slot-main' : 'slot-dish';
    const foilSlotId = layoutId === 'box-3slot' ? 'slot-foil' : 'slot-rice';
    const mainSlotted = slots[mainSlotId];
    const foilSlotted = slots[foilSlotId];
    const mainItem = mainSlotted?.item;
    const foilItem = foilSlotted?.item;

    const customBoxPhoto =
      mainSlotted?.selectedMeat &&
      mainItem?.meatPhotoMap?.[mainSlotted.selectedMeat]?.fullBoxImage;

    const matchedPreset = REAL_BOX_PRESETS.find((p) => {
      if (p.layoutId !== layoutId) return false;
      const pMain = p.slots[mainSlotId]?.itemId;
      const pFoil = p.slots[foilSlotId]?.itemId;
      return pMain === mainItem?.id && (!pFoil || pFoil === foilItem?.id);
    });

    const referenceBoxPhoto =
      customBoxPhoto ||
      matchedPreset?.fullBoxPhoto ||
      mainItem?.fullBoxImage ||
      foilItem?.fullBoxImage ||
      './images/zeed/box-chicken-teriyaki-steamed-egg.jpg';

    return {
      baseSetPrice,
      addonTotal,
      unitPrice,
      grandTotal,
      setName,
      seafoodCount,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      filledCount,
      missingRealPhotoCount,
      matchedPreset,
      referenceBoxPhoto,
    };
  }, [currentLayout, slots, layoutId, boxCount]);

  const placeFoodInSlot = (slotId: string, food: FoodItem, meatOverride?: MeatChoice) => {
    const slotConfig = currentLayout.slots.find((s) => s.id === slotId);
    if (food.category === 'topping' && !slotConfig?.isFoilCup) {
      setSlots((prev) => {
        const existing = prev[slotId];
        if (!existing) {
          return { ...prev, [slotId]: { item: food, toppings: [] } };
        }
        const alreadyHas = existing.toppings.some((t) => t.id === food.id);
        const nextToppings = alreadyHas
          ? existing.toppings.filter((t) => t.id !== food.id)
          : [...existing.toppings.slice(-1), food];
        return {
          ...prev,
          [slotId]: { ...existing, toppings: nextToppings },
        };
      });
      return;
    }

    const chosenMeat = meatOverride || menuMeatPrefs[food.id] || food.defaultMeat;

    setSlots((prev) => ({
      ...prev,
      [slotId]: {
        item: food,
        selectedMeat: chosenMeat,
        toppings: prev[slotId]?.toppings || [],
      },
    }));
  };

  const handleMenuCardClick = (food: FoodItem, meatOverride?: MeatChoice) => {
    const activeSlotExists = currentLayout.slots.some((s) => s.id === selectedSlotId);
    let targetSlotId = activeSlotExists ? selectedSlotId : currentLayout.slots[0].id;

    if (layoutId === 'box-3slot') {
      if (food.category === 'soup') {
        targetSlotId = 'slot-foil';
      } else if (food.category === 'ricebowl' || food.category === 'stirfry') {
        if (selectedSlotId === 'slot-side') targetSlotId = 'slot-main';
      } else if (food.category === 'topping') {
        if (food.id === 'top-steamed-egg' && selectedSlotId === 'slot-foil') {
          targetSlotId = 'slot-foil';
        } else {
          targetSlotId = 'slot-main';
        }
      }
    } else if (layoutId === 'box-2slot') {
      if (food.category === 'stirfry' || food.category === 'ricebowl') {
        targetSlotId = 'slot-dish';
      } else if (food.category === 'topping') {
        targetSlotId = 'slot-rice';
      }
    }

    setSelectedSlotId(targetSlotId);
    placeFoodInSlot(targetSlotId, food, meatOverride);
  };

  const handleDropOnSlot = (targetSlotId: string) => {
    setDragOverSlotId(null);

    if (draggedFromSlotId && draggedFromSlotId !== targetSlotId) {
      setSlots((prev) => {
        const next = { ...prev };
        const sourceData = next[draggedFromSlotId];
        const targetData = next[targetSlotId];
        if (sourceData && targetData) {
          next[targetSlotId] = sourceData;
          next[draggedFromSlotId] = targetData;
        } else if (sourceData) {
          next[targetSlotId] = sourceData;
          delete next[draggedFromSlotId];
        }
        return next;
      });
      setSelectedSlotId(targetSlotId);
      setDraggedFromSlotId(null);
      setDraggedFoodId(null);
      return;
    }

    if (draggedFoodId) {
      const food = FOOD_ITEMS.find((f) => f.id === draggedFoodId);
      if (food) {
        placeFoodInSlot(targetSlotId, food);
        setSelectedSlotId(targetSlotId);
      }
    }
    setDraggedFoodId(null);
    setDraggedFromSlotId(null);
  };

  const applyRealPreset = (presetId: string) => {
    const preset = REAL_BOX_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setLayoutId(preset.layoutId);
    const nextSlots: Record<string, SlottedFood> = { ...slots };
    for (const [slotId, cfg] of Object.entries(preset.slots)) {
      const item = FOOD_ITEMS.find((f) => f.id === cfg.itemId);
      if (item) {
        const toppings = (cfg.toppingIds || [])
          .map((tid) => FOOD_ITEMS.find((f) => f.id === tid))
          .filter((t): t is FoodItem => Boolean(t));
        nextSlots[slotId] = {
          item,
          selectedMeat: cfg.selectedMeat || item.defaultMeat,
          toppings,
        };
      }
    }
    setSlots(nextSlots);
    setSelectedSlotId(preset.layoutId === 'box-3slot' ? 'slot-main' : 'slot-dish');
  };

  const formatSlotDishTitle = (sl?: SlottedFood) => {
    if (!sl) return '(ว่าง)';
    const meatSuffix = sl.selectedMeat ? ` (${sl.selectedMeat})` : '';
    return `${sl.item.nameTh}${meatSuffix}`;
  };

  const copyOrderSummary = () => {
    const lines = currentLayout.slots.map((s, idx) => {
      const sl = slots[s.id];
      if (!sl) return `${idx + 1}. ${s.labelTh}: (ว่าง)`;
      const topText =
        sl.toppings.length > 0
          ? ` + โปะท็อปปิ้ง [${sl.toppings.map((t) => `${t.nameTh} +${t.addonPrice}฿`).join(', ')}]`
          : '';
      return `${idx + 1}. ${s.labelTh}: ${formatSlotDishTitle(sl)}${topText}`;
    });

    const summary = [
      `🍱 ใบสั่งชุดข้าวกล่อง ZeedKitchen (แค่คิด...ก็อร่อย)`,
      `หมายเหตุ: ${customerNote}`,
      `รูปแบบกล่อง: ${currentLayout.nameTh}`,
      `แพ็กเกจราคา: ${pricing.setName}`,
      `--------------------------`,
      ...lines,
      `--------------------------`,
      `ราคาต่อกล่อง: ${pricing.unitPrice} บาท`,
      `จำนวนที่สั่ง: ${boxCount} กล่อง`,
      `ยอดรวมทั้งหมด: ${pricing.grandTotal.toLocaleString()} บาท`,
      `โทรสั่งร้าน ZeedKitchen: 095-945-3591 (จัดส่งทั่วระยอง)`,
    ].join('\n');

    navigator.clipboard?.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Export High-Resolution Order Image (.PNG) for sending directly in LINE chat!
  const downloadBentoOrderPng = async () => {
    setIsExportingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 820;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White card background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Header Banner
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, canvas.width, 108);

      const logoImg = await loadImage('./images/zeed/logo.jpg');
      if (logoImg) {
        drawCoverImage(ctx, logoImg, 36, 18, 72, 72, 14);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px Prompt, sans-serif';
      ctx.fillText('ZeedKitchen BentoCraft — ใบสั่งชุดข้าวกล่อง', 126, 54);

      ctx.fillStyle = '#D4D4D8';
      ctx.font = '500 18px Prompt, sans-serif';
      ctx.fillText(
        `ซี้ดคิทเช่น (แค่คิด...ก็อร่อย) • โทร. 095-945-3591 • จัดส่งทั่วระยอง`,
        126,
        84
      );

      // Left Side: Draw the Black Bento Box Frame (x=36, y=136, w=680, h=520)
      drawRoundedRect(ctx, 36, 136, 680, 520, 28);
      ctx.fillStyle = '#18181B';
      ctx.fill();

      drawRoundedRect(ctx, 54, 154, 644, 484, 20);
      ctx.fillStyle = '#27272A';
      ctx.fill();

      const slotRects =
        layoutId === 'box-3slot'
          ? [
              { id: 'slot-side', x: 70, y: 170, w: 256, h: 218 },
              { id: 'slot-foil', x: 70, y: 404, w: 256, h: 218 },
              { id: 'slot-main', x: 342, y: 170, w: 340, h: 452 },
            ]
          : [
              { id: 'slot-rice', x: 70, y: 170, w: 260, h: 452 },
              { id: 'slot-dish', x: 346, y: 170, w: 336, h: 452 },
            ];

      for (const sr of slotRects) {
        const sl = slots[sr.id];
        drawRoundedRect(ctx, sr.x, sr.y, sr.w, sr.h, 14);
        ctx.fillStyle = '#F4F4F5';
        ctx.fill();

        if (sl) {
          const cropSrc =
            (sl.selectedMeat && sl.item.meatPhotoMap?.[sl.selectedMeat]?.cropImage) ||
            sl.item.cropImage;
          if (sl.item.hasRealPhoto && cropSrc) {
            const foodImg = await loadImage(cropSrc);
            if (foodImg) {
              drawCoverImage(ctx, foodImg, sr.x, sr.y, sr.w, sr.h, 14);
            }
          } else {
            ctx.fillStyle = '#FEF3C7';
            drawRoundedRect(ctx, sr.x, sr.y, sr.w, sr.h, 14);
            ctx.fill();
            ctx.fillStyle = '#92400E';
            ctx.font = 'bold 18px Prompt, sans-serif';
            ctx.fillText('รอถ่ายรูปอาหารจริง', sr.x + 24, sr.y + sr.h / 2);
          }

          // Draw Egg Topping if present
          for (const top of sl.toppings) {
            if (top.diecutImage) {
              const topImg = await loadImage(top.diecutImage);
              if (topImg) {
                const eggSize = 130;
                ctx.drawImage(
                  topImg,
                  sr.x + (sr.w - eggSize) / 2,
                  sr.y + (sr.h - eggSize) / 2,
                  eggSize,
                  eggSize
                );
              }
            }
          }

          // Bottom white pill label inside compartment
          drawRoundedRect(ctx, sr.x + 12, sr.y + sr.h - 44, sr.w - 24, 32, 16);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
          ctx.fill();
          ctx.fillStyle = '#18181B';
          ctx.font = 'bold 15px Prompt, sans-serif';
          ctx.fillText(
            formatSlotDishTitle(sl).slice(0, 32),
            sr.x + 24,
            sr.y + sr.h - 22
          );
        }
      }

      // Right Side: Order Summary Ledger (x=746, y=136, w=498, h=640)
      drawRoundedRect(ctx, 746, 136, 498, 640, 24);
      ctx.fillStyle = '#FAFAFA';
      ctx.fill();
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 24px Prompt, sans-serif';
      ctx.fillText('สรุปรายการข้าวกล่องที่จัด', 776, 184);

      ctx.fillStyle = '#52525B';
      ctx.font = '500 16px Prompt, sans-serif';
      ctx.fillText(`หมายเหตุ: ${customerNote}`, 776, 214);

      drawRoundedRect(ctx, 776, 234, 438, 44, 10);
      ctx.fillStyle = '#ECFCCB';
      ctx.fill();
      ctx.fillStyle = '#365314';
      ctx.font = 'bold 16px Prompt, sans-serif';
      ctx.fillText(pricing.setName, 792, 262);

      let curY = 316;
      currentLayout.slots.forEach((slot, idx) => {
        const sl = slots[slot.id];
        ctx.fillStyle = '#71717A';
        ctx.font = '600 14px Prompt, sans-serif';
        ctx.fillText(`หลุม 0${idx + 1} • ${slot.labelTh}`, 776, curY);
        curY += 24;

        ctx.fillStyle = '#18181B';
        ctx.font = 'bold 17px Prompt, sans-serif';
        ctx.fillText(formatSlotDishTitle(sl), 776, curY);
        curY += 22;

        if (sl && sl.toppings.length > 0) {
          ctx.fillStyle = '#C83E2B';
          ctx.font = 'bold 15px Prompt, sans-serif';
          ctx.fillText(
            `+ ท็อปปิ้ง: ${sl.toppings.map((t) => `${t.nameTh} (+${t.addonPrice}฿)`).join(', ')}`,
            776,
            curY
          );
          curY += 22;
        }
        curY += 16;
      });

      // Divider & Totals
      ctx.strokeStyle = '#E4E4E7';
      ctx.beginPath();
      ctx.moveTo(776, 560);
      ctx.lineTo(1214, 560);
      ctx.stroke();

      ctx.fillStyle = '#52525B';
      ctx.font = '600 17px Prompt, sans-serif';
      ctx.fillText(`ราคาต่อกล่อง: ฿${pricing.unitPrice} บาท`, 776, 598);
      ctx.fillText(`จำนวนที่สั่ง: ${boxCount} กล่อง`, 776, 628);

      drawRoundedRect(ctx, 776, 652, 438, 96, 16);
      ctx.fillStyle = '#18181B';
      ctx.fill();

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '600 15px Prompt, sans-serif';
      ctx.fillText(`ยอดรวมทั้งสิ้น (${boxCount} กล่อง)`, 800, 686);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px Prompt, sans-serif';
      ctx.fillText(`฿${pricing.grandTotal.toLocaleString()} บาท`, 800, 728);

      // Footer note below Bento box
      ctx.fillStyle = '#52525B';
      ctx.font = '500 16px Prompt, sans-serif';
      ctx.fillText(
        'บันทึกภาพนี้ส่งเข้า LINE หรือแชทเพจร้าน ZeedKitchen เพื่อสั่งทำได้ทันที',
        42,
        700
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ZeedKitchen-Bento-${boxCount}boxes.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExportingPng(false);
    }
  };

  const realPhotoCount = useMemo(
    () => FOOD_ITEMS.filter((f) => f.hasRealPhoto).length,
    []
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col pb-20 lg:pb-0">
      {/* Top Header with Official ZeedKitchen Logo */}
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="./images/zeed/logo.jpg"
              alt="ZeedKitchen Logo"
              className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900">
                  ZeedKitchen BentoCraft
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-lime-100 text-lime-900 border border-lime-300">
                  แค่คิด...ก็อร่อย • จัดส่งทั่วระยอง
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-0.5">
                จำลองจัดชุดข้าวกล่องถาดดำของจริง • เลือกเนื้อสัตว์ หมู/ไก่/ทะเล & บันทึกรูปส่ง LINE • โทร. 095-945-3591
              </p>
            </div>
          </div>

          {/* Quick Real Box Presets from Dad's Kitchen */}
          <div className="flex flex-wrap items-center gap-1.5">
            {REAL_BOX_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyRealPreset(preset.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 transition-colors tabular-nums"
              >
                {preset.nameTh} ({preset.price}.-)
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): ZEEDKITCHEN MENU CATALOG */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-zinc-900 tracking-[-0.02em]">
                จานเมนูเลือกจัดลงกล่อง
              </h2>
              <span className="text-xs font-medium text-zinc-600 tabular-nums">
                แสดง {filteredFoods.length} จาก {FOOD_ITEMS.length} รายการ
              </span>
            </div>
            <p className="text-sm text-zinc-600 mb-3">
              กดเลือกชนิดเนื้อสัตว์ (หมู/ไก่/ทะเล) แล้วคลิกหรือลากใส่หลุมกล่องเบนโตะได้ทันที
            </p>

            {/* Filter: Real Photos Only vs All Menus */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                onClick={() => setOnlyRealPhotos(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors tabular-nums ${
                  !onlyRealPhotos
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                แสดงทุกเมนูในร้าน ({FOOD_ITEMS.length})
              </button>
              <button
                onClick={() => setOnlyRealPhotos(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors tabular-nums ${
                  onlyRealPhotos
                    ? 'bg-lime-800 text-white border-lime-800'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                เฉพาะเมนูที่มีรูปถ่ายจริงแล้ว ({realPhotoCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเมนู เช่น กะเพรา, พะแนง, ซาบะ, ต้มยำ, ไข่ดาว, ไข่ตุ๋น..."
                className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 transition-colors"
              />
              <svg
                className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-900 px-1"
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  activeCategory === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                ทั้งหมด
              </button>
              {(Object.keys(ZEED_CATEGORY_META) as FoodCategory[]).map((catKey) => {
                const meta = ZEED_CATEGORY_META[catKey];
                const isActive = activeCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setActiveCategory(catKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                      isActive
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    {meta.shortTh}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu List with Inline Meat Selector Buttons */}
          <div className="p-3 sm:p-4 max-h-[640px] overflow-y-auto divide-y divide-zinc-200">
            {filteredFoods.map((food) => {
              const activeMeat = menuMeatPrefs[food.id] || food.defaultMeat;
              const isSeafood = isSeafoodMeat(activeMeat, food.meatTier);
              const isSelectedInBox = currentLayout.slots.some(
                (s) =>
                  slots[s.id]?.item.id === food.id ||
                  slots[s.id]?.toppings.some((t) => t.id === food.id)
              );

              return (
                <div
                  key={food.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedFoodId(food.id);
                    setDraggedFromSlotId(null);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => {
                    setDraggedFoodId(null);
                    setDragOverSlotId(null);
                  }}
                  onClick={() => handleMenuCardClick(food, activeMeat)}
                  className={`group py-3 px-2.5 flex items-center gap-3.5 cursor-grab active:cursor-grabbing transition-colors rounded-xl ${
                    isSelectedInBox ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  }`}
                >
                  <FoodIllustration
                    item={food}
                    selectedMeat={activeMeat}
                    size="sm"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-900 truncate">
                        {food.nameTh}
                        {activeMeat ? ` (${activeMeat})` : ''}
                      </span>
                      <span
                        className={`text-xs font-bold tabular-nums shrink-0 ${
                          isSeafood ? 'text-[#C83E2B]' : 'text-zinc-900'
                        }`}
                      >
                        {food.category === 'topping'
                          ? `+${food.addonPrice} ฿`
                          : isSeafood
                          ? 'เรตทะเล'
                          : 'เรตหมู/ไก่'}
                      </span>
                    </div>

                    {/* Inline Meat Selector Pills ([หมู] [ไก่] [ทะเล]) */}
                    {food.availableMeats && food.availableMeats.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-xs text-zinc-600 mr-1">เนื้อสัตว์:</span>
                        {food.availableMeats.map((meat) => {
                          const isChosen = activeMeat === meat;
                          return (
                            <button
                              key={meat}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuMeatPrefs((prev) => ({
                                  ...prev,
                                  [food.id]: meat,
                                }));
                                // Also update any slot currently holding this dish
                                setSlots((prev) => {
                                  const next = { ...prev };
                                  for (const k of Object.keys(next)) {
                                    if (next[k]?.item.id === food.id) {
                                      next[k] = { ...next[k], selectedMeat: meat };
                                    }
                                  }
                                  return next;
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                                isChosen
                                  ? 'bg-zinc-900 text-white border-zinc-900'
                                  : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                              }`}
                            >
                              {meat}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded border ${
                          food.hasRealPhoto
                            ? 'bg-lime-50 text-lime-900 border-lime-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}
                      >
                        {food.hasRealPhoto ? 'มีรูปถ่ายจริง' : 'รอถ่ายรูปจริง'}
                      </span>
                      <span className="text-xs text-zinc-600 truncate">
                        {food.subNameTh}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN (7 cols): REAL BLACK BENTO BOX CONFIGURATOR */}
        <section className="lg:col-span-7 space-y-5">
          {/* Box Type & View Mode Control Bar */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 mb-2">
                เลือกรูปแบบกล่องเบนโตะและเซ็ตราคา
              </h2>
              <div className="flex flex-wrap gap-2">
                {BENTO_LAYOUTS.map((layout) => {
                  const active = layout.id === layoutId;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => {
                        setLayoutId(layout.id);
                        setSelectedSlotId(
                          layout.id === 'box-3slot' ? 'slot-main' : 'slot-dish'
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border tabular-nums ${
                        active
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      {layout.nameTh}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">
                สลับมุมมองกล่องข้าว
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setViewMode('compartment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    viewMode === 'compartment'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  โหมดจัดหลุมเบนโตะ (ลากสลับอิสระ)
                </button>
                <button
                  onClick={() => setViewMode('fullbox')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    viewMode === 'fullbox'
                      ? 'bg-[#C83E2B] text-white border-[#C83E2B]'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  ดูภาพกล่องจริง (17 รูปจากครัว)
                </button>
              </div>
            </div>
          </div>

          {/* THE REAL BLACK BENTO TRAY CANVAS */}
          {viewMode === 'compartment' ? (
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 tracking-[-0.02em]">
                    {currentLayout.nameTh}
                  </h2>
                  <p className="text-sm text-zinc-600">{currentLayout.subTitle}</p>
                </div>

                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-lime-100 text-lime-900 border border-lime-300 tabular-nums">
                  {pricing.setName}
                </span>
              </div>

              {/* Single Real Black Plastic Bento Tray of ZeedKitchen */}
              <div className="rounded-[28px] bg-zinc-900 p-3.5 sm:p-4 shadow-[0_22px_45px_-12px_rgba(0,0,0,0.35)] border-2 border-zinc-700">
                <div
                  className={`grid ${currentLayout.gridContainerClass} gap-3 bg-zinc-800 p-3 rounded-[20px] border border-zinc-700`}
                >
                  {currentLayout.slots.map((slot, index) => {
                    const slotted = slots[slot.id];
                    const isSelected = selectedSlotId === slot.id;
                    const isDragTarget = dragOverSlotId === slot.id;

                    return (
                      <div
                        key={slot.id}
                        draggable={Boolean(slotted)}
                        onDragStart={(e) => {
                          if (!slotted) return;
                          setDraggedFromSlotId(slot.id);
                          setDraggedFoodId(slotted.item.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverSlotId !== slot.id) {
                            setDragOverSlotId(slot.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverSlotId === slot.id) {
                            setDragOverSlotId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnSlot(slot.id);
                        }}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`group ${slot.gridSpanClass} ${slot.minHeightClass} relative rounded-[14px] overflow-hidden transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                          slot.isFoilCup
                            ? 'border-4 border-zinc-300 bg-zinc-100'
                            : 'border-2 border-zinc-700 bg-zinc-100'
                        } ${
                          isDragTarget
                            ? 'ring-4 ring-yellow-300 scale-[1.01]'
                            : isSelected
                            ? 'ring-4 ring-lime-400'
                            : ''
                        }`}
                      >
                        {/* Dashed Target Outline inside active compartment */}
                        {isSelected && (
                          <div className="pointer-events-none absolute inset-2 rounded-[10px] border-2 border-dashed border-white/95 z-20" />
                        )}

                        {slotted ? (
                          <div className="relative w-full h-full flex-1 flex flex-col justify-between min-h-[inherit]">
                            {/* 100% Full-Bleed Bright Food Image */}
                            <div className="absolute inset-0 w-full h-full">
                              <FoodIllustration
                                item={slotted.item}
                                selectedMeat={slotted.selectedMeat}
                                size="fill"
                                className="w-full h-full"
                              />
                            </div>

                            {/* Clean Floating Pill Header + Quick Meat Switcher inside Slot */}
                            <div className="relative z-10 p-2.5 flex flex-wrap items-center justify-between gap-1.5">
                              <span className="px-2.5 py-1 rounded-full bg-white/95 text-zinc-900 text-xs font-bold shadow-sm border border-zinc-200 tabular-nums">
                                0{index + 1} • {slot.labelTh}
                              </span>

                              {slotted.item.availableMeats &&
                              slotted.item.availableMeats.length > 1 ? (
                                <div className="flex items-center gap-1 bg-white/95 p-0.5 rounded-full shadow-sm border border-zinc-200">
                                  {slotted.item.availableMeats.map((meat) => (
                                    <button
                                      key={meat}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSlots((prev) => ({
                                          ...prev,
                                          [slot.id]: {
                                            ...prev[slot.id],
                                            selectedMeat: meat,
                                          },
                                        }));
                                      }}
                                      className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                                        slotted.selectedMeat === meat
                                          ? 'bg-zinc-900 text-white'
                                          : 'text-zinc-700 hover:bg-zinc-100'
                                      }`}
                                    >
                                      {meat}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                slot.isFoilCup && (
                                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-zinc-900 text-xs font-bold shadow-sm border border-zinc-200">
                                    ถ้วยฟอยล์
                                  </span>
                                )
                              )}
                            </div>

                            {/* Die-Cut Sunny-Side-Up Egg Topping sitting right on top of the food */}
                            {slotted.toppings.length > 0 && (
                              <div className="relative z-10 px-4 flex items-center justify-center my-auto pointer-events-none">
                                {slotted.toppings.map((top) => (
                                  <div
                                    key={top.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSlots((prev) => ({
                                        ...prev,
                                        [slot.id]: {
                                          ...prev[slot.id],
                                          toppings: prev[slot.id].toppings.filter(
                                            (t) => t.id !== top.id
                                          ),
                                        },
                                      }));
                                    }}
                                    title="คลิกเพื่อเอาท็อปปิ้งไข่ออก"
                                    className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 animate-pop-in"
                                  >
                                    {top.hasRealPhoto && top.diecutImage ? (
                                      <img
                                        src={top.diecutImage}
                                        alt={top.nameTh}
                                        draggable={false}
                                        className="w-full h-full object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)]"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                                        {top.nameTh}
                                      </div>
                                    )}
                                    <span className="absolute -bottom-1 right-0 bg-white text-zinc-900 border border-zinc-300 text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                                      {top.nameTh} +{top.addonPrice}฿
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Compact White Pill Label at Bottom-Left */}
                            <div className="relative z-10 p-2.5 flex items-end justify-between gap-2">
                              <span className="px-3 py-1 rounded-full bg-white/95 text-zinc-900 text-xs font-bold shadow-sm border border-zinc-200 truncate max-w-[75%]">
                                {formatSlotDishTitle(slotted)}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-white/95 text-zinc-800 text-xs font-semibold shadow-sm border border-zinc-200 tabular-nums shrink-0">
                                {slotted.item.calories} kcal
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <p className="text-xs font-bold text-zinc-800">
                              {slot.labelTh}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1">{slot.subLabel}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* FULL REAL BOX PHOTO GALLERY MODE */
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    ภาพถ่ายกล่องจริงทั้งใบจากครัวคุณพ่อ (100% Real Kitchen Photo)
                  </h2>
                  <p className="text-sm text-zinc-600">
                    คลิกเลือกชุดด้านล่างเพื่อดูภาพถ่ายจริงเมื่อจัดลงกล่องพร้อมส่งลูกค้า
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('compartment')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white"
                >
                  กลับไปโหมดจัดหลุมเบนโตะ
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-zinc-300 bg-zinc-100 max-h-[440px] flex items-center justify-center">
                <img
                  src={pricing.referenceBoxPhoto}
                  alt="ZeedKitchen Real Box"
                  className="w-full h-[400px] object-cover object-center"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {REAL_BOX_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyRealPreset(preset.id)}
                    className="text-left p-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors"
                  >
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {preset.nameTh}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5 tabular-nums">
                      {preset.setTierName}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PRICING & BULK ORDER LEDGER */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
              {/* Left 7 Cols: Set Pricing Breakdown & Quantity Calculator */}
              <div className="md:col-span-7 p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-base font-bold text-zinc-900 tracking-[-0.02em]">
                    คำนวณราคาตามเรตเซ็ตจริงของร้าน
                  </h3>
                  <div className="text-right tabular-nums">
                    <span className="text-2xl font-bold text-zinc-900">
                      ฿{pricing.unitPrice}
                    </span>
                    <span className="text-xs text-zinc-600 ml-1">/ กล่อง</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 mb-3">{pricing.setName}</p>

                {/* Quantity Selector for Catering / Break Box Orders */}
                <div className="pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-700">
                    จำนวนกล่องที่ต้องการสั่ง (จัดเบรก/ประชุม):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 5, 10, 20, 50, 100].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setBoxCount(qty)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border tabular-nums ${
                          boxCount === qty
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        {qty} กล่อง
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-200 grid grid-cols-3 gap-4 tabular-nums">
                  <div>
                    <span className="text-xs font-medium text-zinc-600 block">
                      ราคาเซ็ตฐาน
                    </span>
                    <p className="text-base font-bold text-zinc-900 mt-0.5">
                      ฿{pricing.baseSetPrice}
                    </p>
                  </div>
                  <div className="border-l border-zinc-200 pl-3">
                    <span className="text-xs font-medium text-zinc-600 block">
                      ท็อปปิ้งไข่เพิ่ม
                    </span>
                    <p className="text-base font-bold text-zinc-900 mt-0.5">
                      +฿{pricing.addonTotal}
                    </p>
                  </div>
                  <div className="border-l border-zinc-200 pl-3">
                    <span className="text-xs font-medium text-zinc-600 block">
                      รวมทั้งสิ้น ({boxCount} กล่อง)
                    </span>
                    <p className="text-base font-bold text-[#C83E2B] mt-0.5">
                      ฿{pricing.grandTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Order Note, Download PNG & Export to LINE */}
              <div className="md:col-span-5 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 tracking-[-0.02em] mb-1">
                    บันทึกรูปภาพ & ส่งใบสั่งเข้า LINE ร้าน
                  </h3>
                  <p className="text-sm text-zinc-600 mb-3">
                    กดบันทึกรูปชุดข้าวกล่องที่จัดเสร็จแล้วเป็นไฟล์ .PNG หรือคัดลอกข้อความส่งให้คุณพ่อได้ทันที
                  </p>

                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    ชื่อลูกค้า / หมายเหตุถึงครัว (เช่น ไม่เผ็ด, แยกพริกน้ำปลา)
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 mb-3"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={downloadBentoOrderPng}
                    disabled={isExportingPng}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#C83E2B] hover:bg-red-800 text-white transition-colors tabular-nums"
                  >
                    {isExportingPng
                      ? 'กำลังสร้างไฟล์รูปภาพ...'
                      : 'บันทึกรูปกล่องข้าว + ใบสรุปราคา (.PNG) ส่ง LINE'}
                  </button>
                  <button
                    onClick={copyOrderSummary}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition-colors tabular-nums"
                  >
                    {copiedToast
                      ? 'คัดลอกข้อความใบสั่งซื้อเรียบร้อย!'
                      : `คัดลอกข้อความใบสั่งซื้อ (${boxCount} กล่อง • ฿${pricing.grandTotal.toLocaleString()})`}
                  </button>
                  <button
                    onClick={() => setShowOrderSlip((prev) => !prev)}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 transition-colors"
                  >
                    {showOrderSlip ? 'ซ่อนใบสรุปรายการ' : 'ดูใบสรุปรายการและเช็คสถานะรูปจริง'}
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Order Slip */}
            {showOrderSlip && (
              <div className="border-t border-zinc-200 p-5 bg-zinc-50">
                <div className="flex items-start justify-between pb-3 border-b border-zinc-200">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      ใบสรุปชุดข้าวกล่อง ZeedKitchen — {customerNote}
                    </h3>
                    <p className="text-sm text-zinc-600">
                      โทร. 095-945-3591 • จัดส่งทั่วระยอง • แพ็กเกจ: {pricing.setName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOrderSlip(false)}
                    className="px-3 py-1 rounded-lg border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    ปิด
                  </button>
                </div>

                <div className="py-3 divide-y divide-zinc-200">
                  {currentLayout.slots.map((slot, idx) => {
                    const sl = slots[slot.id];
                    if (!sl) return null;
                    return (
                      <div
                        key={slot.id}
                        className="py-2 flex items-center justify-between text-sm tabular-nums"
                      >
                        <div>
                          <span className="font-semibold text-zinc-900">
                            หลุม 0{idx + 1} ({slot.labelTh}): {formatSlotDishTitle(sl)}
                          </span>
                          {sl.toppings.length > 0 && (
                            <span className="text-xs text-zinc-600 ml-2">
                              + ท็อปปิ้ง:{' '}
                              {sl.toppings
                                .map((t) => `${t.nameTh} (+${t.addonPrice}฿)`)
                                .join(', ')}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            sl.item.hasRealPhoto
                              ? 'bg-lime-100 text-lime-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {sl.item.hasRealPhoto ? 'มีรูปถ่ายจริงแล้ว' : 'รอถ่ายรูปจริง'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Sticky Bottom Order Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-zinc-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        <div className="tabular-nums">
          <p className="text-xs font-semibold text-zinc-600">
            {boxCount} กล่อง ({pricing.unitPrice}฿/กล่อง)
          </p>
          <p className="text-lg font-bold text-zinc-900">
            รวม ฿{pricing.grandTotal.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadBentoOrderPng}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C83E2B] text-white"
          >
            เซฟรูป .PNG
          </button>
          <button
            onClick={copyOrderSummary}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white"
          >
            {copiedToast ? 'คัดลอกแล้ว!' : 'คัดลอกส่ง LINE'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
