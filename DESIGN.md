# DESIGN.md — Impeccable Design System for BentoCraft

## 1. Color Architecture (Washi, Sumi & Urushi)

| Token Role | Hex | Usage |
| :--- | :--- | :--- |
| **Canvas Surface (`Washi`)** | `#F6F3EC` | Primary page background — warm handmade paper tone |
| **Elevated Card (`Shiro`)** | `#FDFBF7` | Menu drawer, telemetry ledger, receipt slip |
| **Subtle Surface (`Suna`)** | `#EFECE4` | Inactive pills, subtle input fields, empty dropzones |
| **Hairline Border (`Kawa`)** | `#E4DEC8` | 1px structural dividers and card outlines |
| **Primary Ink (`Sumi`)** | `#181614` | Primary headings, prices, active control states |
| **Secondary Ink (`Haizumi`)** | `#5C564F` | Descriptions, secondary labels |
| **Muted Ink (`usu-zumi`)** | `#8C847A` | Japanese subtitles, unit suffixes (`kcal`, `g`) |
| **Brand Seal (`Shu-iro`)** | `#C83E2B` | Traditional Japanese vermilion stamp, primary accent |
| **Hinoki Gold (`Kitsune`)** | `#B58448` | Woodwork highlights, active drop-target rings |

## 2. Typography & Scannable Hierarchy
- **Primary Thai & UI Sans**: `'Prompt'`, `'Plus Jakarta Sans'`, sans-serif
- **Editorial Serif / Japanese Display**: `'Noto Serif JP'`, serif (used sparingly for authentic Japanese course titles and Hanko seals)
- **Numeric Discipline**: Mandatory `tabular-nums` on all prices (`฿`), energy (`kcal`), weights (`g`), and slot indices (`01`–`05`).

## 3. Concentric Border Radius Rule (`polish`)
- Outer Bento Tray: `rounded-[28px]` with `p-3.5` (14px) frame
- Inner Divider Bed: `rounded-[18px]`
- Individual Compartment Slot: `rounded-[12px]`
*(Concentric formula: Outer Radius ≈ Inner Radius + Padding, preventing pinched corners).*

## 4. Strict Anti-Slop Enforcement
- **Zero Emojis in UI Chrome**: All navigation, category tabs, metrics, and buttons use clean 1.5px stroke SVG iconography or typographic seals (`印`) instead of emoji characters.
- **Zero Rainbow Metric Boxes**: Macronutrients (Protein, Carbs, Fat) sit in a unified architectural grid separated by 1px hairlines (`divide-x border-[#E4DEC8]`) with small 6px semantic indicator dots.
- **Zero Card-in-Card Clutter**: The Oshinagaki menu uses a clean gallery list with 64×64px square-rounded (`rounded-xl`) studio photography, crisp typography, and a single tactile `+ จัดวาง` button.
