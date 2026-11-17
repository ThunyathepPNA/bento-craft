---
name: modern-ui-design
description: >-
  Use this skill when the user asks to design, build, or style modern, high-craft web UIs,
  interactive applications, dashboards, or drag-and-drop interfaces using React, TypeScript,
  and Tailwind CSS.
---

# Modern Web UI & Interactive Craft Skill (`modern-ui-design`)

This skill defines the design principles, component architecture, and interaction patterns for building polished, modern web applications using **React + TypeScript + Tailwind CSS**.

---

## 1. Core Aesthetic & Design Trends (2025–2026)

1. **Bento Grid Architecture**:
   - Organize layouts into modular, asymmetric rounded containers (`rounded-2xl` or `rounded-3xl`) with consistent gap spacing (`gap-4` to `gap-6`).
   - Use subtle inner borders (`border border-stone-200/80` or `ring-1 ring-black/5`) paired with layered soft shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.06)]`).
2. **Tactile Surfaces & Glassmorphism**:
   - Combine warm neutral backgrounds (`bg-[#FAF7F2]`, `bg-stone-50`) with translucent floating panels (`bg-white/80 backdrop-blur-xl`).
   - For physical metaphors (like trays, boxes, or cards), use multi-layered borders, subtle gradients, and inset shadows (`shadow-inner`) to create realistic depth.
3. **Expressive Typography & Hierarchy**:
   - Pair clean geometric/humanist Thai & Latin fonts (`Prompt`, `Kanit`, or `Plus Jakarta Sans` / `Inter`).
   - Use clear typographic contrast: bold high-tracking badges (`text-xs font-semibold uppercase tracking-wider`), crisp titles (`text-2xl font-bold tracking-tight`), and tabular numbers (`tabular-nums`) for prices, calories, and counters.
4. **Micro-Interactions & Visual Feedback**:
   - Every interactive item must respond to hover (`hover:-translate-y-0.5 hover:shadow-md`), active press (`active:scale-95`), and focus states.
   - Use smooth transitions (`transition-all duration-200 ease-out`) and animated progress bars for real-time metrics.

---

## 2. Drag-and-Drop (DnD) UX Best Practices

When building Drag-and-Drop interfaces (such as Bento builders, Kanban boards, or canvas tools):

1. **Dual Input Support (Drag + Click-to-Assign)**:
   - Always support **HTML5 Drag and Drop** (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) **AND** **Click/Tap selection** (click an item, then click a target slot, or auto-fill the next matching slot) so the UI works seamlessly on both desktop mice and mobile/tablet touchscreens.
2. **Clear Drop-Zone Affordances**:
   - Highlight valid target slots while dragging (`ring-2 ring-amber-500 bg-amber-50/70 scale-[1.01]`).
   - Show category hints inside empty slots (e.g., dashed border `border-2 border-dashed`, icon watermark, and recommended category label).
3. **Rich Item Cards**:
   - Display custom vector illustrations/SVG icons, Thai + Japanese/English names, calorie/macro pills, dietary tags, and quick add/remove buttons.
4. **Real-Time Telemetry & Summary**:
   - Provide live feedback as items are placed: total price, calorie meter, macronutrient breakdown (Protein, Carbs, Fat), and preset templates for instant inspiration.

---

## 3. Implementation Workflow

1. **Scaffold & Dependencies**:
   - Prefer React 19 + TypeScript + Vite + Tailwind CSS.
   - Load Google Fonts (`Prompt` and `Plus Jakarta Sans`) in `index.html` for authentic Thai & modern UI typography.
2. **Component Structure**:
   - Separate data/catalog (`data/`), types (`types/`), and interactive views.
   - Keep state predictable: support Undo/Clear, Preset loading, Box Layout switching, and Order Summary modal.
3. **Verification**:
   - Run `npm run build` to verify zero TypeScript or Vite bundling errors.
   - Verify responsive layout across desktop (3-column or split workspace) and mobile screens.
