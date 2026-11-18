# DESIGN.md — Impeccable Design System for ZeedKitchen BentoCraft

## 1. Color Architecture (Clean Gallery & Real Black Bento Tray)

| Token Role | Hex / Class | Usage |
| :--- | :--- | :--- |
| **Primary Page Canvas** | `#FFFFFF` (`bg-white`) | Clean white gallery surface so real food photography pops without AI cream/beige tint |
| **Subtle Surface** | `#F4F4F5` (`bg-zinc-100`) | Filter pills, inactive controls, table headers |
| **Structural Hairline** | `#E4E4E7` (`border-zinc-200`) | 1px architectural grid lines and dividers |
| **Primary Ink** | `#18181B` (`text-zinc-900`) | Headings, dish titles, prices |
| **Secondary Ink** | `#52525B` (`text-zinc-600`) | Descriptions, subtitles, placeholders (WCAG AA contrast > 7:1) |
| **ZeedKitchen Brand Green** | `#4D7C0F` (`lime-700`) | Brand identity accent from Logo Zeedkidchen |
| **Chili Accent Red** | `#C83E2B` | Spicy badges, primary CTA, active focus ring |
| **Real Black Bento Tray** | `#141416` (`bg-zinc-950`) | Matches ZeedKitchen's real corrugated black plastic 2-slot & 3-slot bento boxes |

## 2. Typography & Numeric Discipline
- **Thai & UI Font**: `'Prompt'`, `'Plus Jakarta Sans'`, sans-serif
- **Minimum Font Floor**: `12px` (`text-xs`) for badges/buttons, `14px` (`text-sm`) for body copy, `text-wrap: pretty` on paragraphs
- **Tabular Numerals**: `tabular-nums` on all prices (`฿`), box counts, and calorie metrics
