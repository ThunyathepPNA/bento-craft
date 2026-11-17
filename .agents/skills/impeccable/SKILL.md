---
name: impeccable
description: >-
  Impeccable design vocabulary, anti-slop detector, and frontend polish framework (adapted from
  pbakaus/impeccable). Use this skill whenever designing, reviewing, refactoring, or polishing web
  UIs to eliminate generic "AI slop" aesthetics and achieve intentional, editorial-grade craft.
---

# Impeccable — Design Vocabulary & Anti-Slop Framework

Impeccable replaces vague design prompts ("make it look modern") with **deterministic anti-slop rules**, **persistent design context (`PRODUCT.md` & `DESIGN.md`)**, and **24 specialized design commands**.

---

## 1. Persistent Context Protocol (`PRODUCT.md` & `DESIGN.md`)

Before modifying or creating UI in a project, check for (or initialize):
- **`PRODUCT.md`**: Defines the product's core purpose, target audience, domain metaphor, and primary user flow.
- **`DESIGN.md`**: Defines the exact color tokens, typographic scale, surface materials, border radii, shadow physics, and forbidden anti-patterns for that project.

---

## 2. The Anti-Slop Detector (Forbidden AI Clichés)

Never output generic "AI slop" patterns. Actively scan for and eliminate:

1. **Emoji-as-Icon Abuse**:
   - **Ban**: Sprinkling emojis (`🔥`, `🚀`, `📊`, `🎨`, `✨`, `💡`) in every section header, button label, and metric card.
   - **Fix**: Use custom minimalist 1.5px stroke SVG icons, typographic indices (`01`, `02`), Japanese Hanko seals, or pure typographic hierarchy.
2. **Rainbow Pastel Metric Cards**:
   - **Ban**: Coloring adjacent stat cards in arbitrary pastel rainbows (e.g., Card 1 = Pink, Card 2 = Yellow, Card 3 = Green) or using generic `from-emerald-500 via-amber-500 to-rose-500` progress bars.
   - **Fix**: Use a unified neutral surface (`bg-[#FAF8F5]`) with a single intentional semantic accent color and tabular numerals (`tabular-nums`).
3. **Unmotivated Gradients & Glows**:
   - **Ban**: Generic `from-purple-500 to-blue-500` or `from-amber-500 to-orange-500` pills and buttons without physical justification.
   - **Fix**: Use solid high-contrast ink buttons (`bg-[#181615] text-[#FAF8F5]`) or authentic material accents (e.g., Vermilion `#C83E2B`) with subtle 1px inner highlights.
4. **Cards-Inside-Cards (Box Soup)**:
   - **Ban**: Nesting 3+ levels of bordered, shadowed rounded boxes inside each other (`rounded-3xl` > `rounded-2xl` > `rounded-xl` with separate borders and shadows).
   - **Fix**: Use hairline dividers (`divide-y`, `border-b border-[#E6E0D6]`), whitespace, and background contrast instead of nested card borders.
5. **Badge Overload**:
   - **Ban**: Putting 3–4 pill badges on every list item.
   - **Fix**: Keep at most one subtle metadata tag or integrate category hierarchy via typography (`text-[11px] uppercase tracking-[0.12em] text-[#78716C]`).

---

## 3. Core Impeccable Command Vocabulary

When applying Impeccable to a project, execute these passes in sequence:

### Phase 1: Architecture & Context
- **`init`**: Create `PRODUCT.md` and `DESIGN.md` tailored to the project's domain.
- **`shape`**: Define spatial grid allocation, primary canvas vs. secondary drawers, and interaction ergonomics.

### Phase 2: Evaluation
- **`critique`**: Evaluate visual hierarchy, cognitive load, Nielsen heuristics, and brand authenticity. Rank issues `P0` (critical) to `P3` (polish).
- **`audit`**: Check contrast ratios, keyboard/click fallback for drag-and-drop, responsive breakpoints, and Anti-Slop violations.

### Phase 3: Refinement & Dials
- **`distill`**: Strip away redundant borders, duplicate labels, and decorative noise so the hero interactive canvas commands 100% focus.
- **`clarify`**: Sharpen microcopy, unit labels (`kcal`, `g`, `฿`), and empty-state instructions.
- **`quieter` / `bolder`**: Adjust visual weight—use `quieter` on chrome/controls so the food photography and tactile Bento tray look `bolder`.
- **`polish`**: Final pass on optical alignment, consistent border radii (outer radius = inner radius + padding), image lighting vignette, and micro-transitions.
