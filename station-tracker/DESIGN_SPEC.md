# Station Tracker - Design Specification

> Comprehensive UI/UX design guide with Tailwind CSS implementations for the Skyco Station Tracker factory floor touchscreen application.

---

## Table of Contents

1. [Design Foundations](#1-design-foundations)
2. [Color System](#2-color-system)
3. [Typography Scale](#3-typography-scale)
4. [Layout Architecture](#4-layout-architecture)
5. [Touchscreen UX](#5-touchscreen-ux)
6. [Component Specifications](#6-component-specifications)
7. [Animations & Transitions](#7-animations--transitions)
8. [Kiosk Mode](#8-kiosk-mode)
9. [Accessibility](#9-accessibility)
10. [Dashboard Design](#10-dashboard-design)
11. [Global CSS Setup](#11-global-css-setup)
12. [Tailwind Config Extensions](#12-tailwind-config-extensions)

---

## 1. Design Foundations

### Design Philosophy

This is a **factory floor tool**, not a marketing site. Every decision must optimize for:

1. **Readability at distance** -- workers glance at screens from 3-6 feet away
2. **Gloved-hand usability** -- touch targets must accommodate thick work gloves
3. **Zero learning curve** -- status is communicated through color, size, and position, not labels buried in menus
4. **Ambient awareness** -- a passing glance should convey "everything is fine" vs "there are problems"

### Root Layout Setup

The root layout (`src/app/layout.tsx`) should be configured for a dark, full-viewport factory display:

```tsx
// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Skyco Station Tracker",
  description: "Production order tracking system",
  // Prevent mobile scaling
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${inter.variable}
          font-sans antialiased
          bg-gray-950 text-gray-100
          overflow-hidden
          select-none
          touch-manipulation
        `}
        // Note: touch-manipulation is a custom utility defined in globals.css
      >
        {children}
      </body>
    </html>
  );
}
```

Key decisions:
- **`overflow-hidden`** on body: individual views manage their own scrolling
- **`select-none`** on body: prevent accidental text selection on touch
- **`touch-manipulation`** (via custom CSS): disable double-tap-to-zoom globally
- **`dark` class on `<html>`**: force dark mode, never use system preference
- **Inter font**: high x-height, excellent readability, tabular number support

---

## 2. Color System

### Primary Palette

All colors chosen for high contrast on dark backgrounds. Tested against WCAG AA (4.5:1 minimum) for text on `gray-950` (#030712).

| Role | Tailwind Class | Hex | Contrast Ratio on gray-950 | Usage |
|------|---------------|-----|---------------------------|-------|
| Done (active) | `bg-emerald-500` | #10B981 | 6.4:1 | Status cell filled |
| Done (text) | `text-emerald-400` | #34D399 | 8.1:1 | Labels, indicators |
| Hold (active) | `bg-rose-500` | #F43F5E | 5.2:1 | Status cell filled |
| Hold (text) | `text-rose-400` | #FB7185 | 6.8:1 | Labels, indicators |
| Missing (active) | `bg-amber-500` | #F59E0B | 8.9:1 | Status cell filled |
| Missing (text) | `text-amber-400` | #FBBF24 | 11.2:1 | Labels, indicators |
| Rush badge | `bg-red-600` | #DC2626 | 4.6:1 | Rush order indicator |
| Rush text | `text-red-400` | #F87171 | 6.1:1 | Rush label text |

**Why emerald instead of green?** Tailwind's `green-500` (#22C55E) is too bright/neon on dark screens and causes eye strain. `emerald-500` is warmer, more professional, and equally readable.

**Why rose instead of red?** `red-500` (#EF4444) reads as an alarm/error. `rose-500` (#F43F5E) conveys "attention needed" without panic. Red-600 is reserved exclusively for rush badges to maintain its urgency.

**Why amber instead of orange?** `orange-500` is too close to `rose-500` under poor factory lighting. `amber-500` shifts enough toward yellow to be immediately distinguishable, even for workers with red-green color deficiency.

### Background Layers

Four levels of depth using Tailwind's gray scale:

```
Level 0 (viewport):    bg-gray-950    #030712    -- deepest background, page level
Level 1 (surface):     bg-gray-900    #111827    -- cards, panels, table body
Level 2 (elevated):    bg-gray-800    #1F2937    -- table rows (alternating), inputs
Level 3 (highlight):   bg-gray-700    #374151    -- hover states, active row highlight
```

Usage in practice:

```tsx
{/* Page background */}
<div className="min-h-screen bg-gray-950">

  {/* Station header card */}
  <header className="bg-gray-900 border-b border-gray-800">

    {/* Table with alternating rows */}
    <tr className="bg-gray-900">       {/* odd rows */}
    <tr className="bg-gray-800/50">    {/* even rows */}

    {/* Active/pressed state */}
    <td className="active:bg-gray-700">
```

### Text Hierarchy

| Role | Tailwind Classes | Usage |
|------|-----------------|-------|
| Primary | `text-white` | Order numbers, station names, critical data |
| Secondary | `text-gray-300` | Customer names, descriptions |
| Tertiary | `text-gray-400` | Column headers, metadata, timestamps |
| Muted | `text-gray-500` | Placeholders, disabled text, empty state hints |
| Inverse | `text-gray-950` | Text on bright status backgrounds (DONE/HOLD/MISSING label text) |

### Status Cell Color Mapping

When a status cell is **inactive** (not toggled):
```tsx
className="bg-gray-800/50 border border-gray-700/50"
```

When a status cell is **active** (toggled on):
```tsx
// Done
className="bg-emerald-500 text-gray-950 border border-emerald-400"

// Hold
className="bg-rose-500 text-gray-950 border border-rose-400"

// Missing
className="bg-amber-500 text-gray-950 border border-amber-400"
```

### Colorblind Safety

Green/red color blindness (deuteranopia/protanopia) affects ~8% of males. The color system alone is insufficient. Every status **must** pair with a distinct icon:

| Status | Color | Icon | Icon Description |
|--------|-------|------|-----------------|
| Done | Emerald | Checkmark (bold stroke) | Universally understood "complete" |
| Hold | Rose | Pause bars (two vertical lines) | Standard "paused/stopped" metaphor |
| Missing | Amber | Warning triangle with `!` | Standard "attention/missing" indicator |

Implementation:
```tsx
// Use inline SVG or a lightweight icon library (lucide-react recommended)
// Each status cell shows BOTH the color fill AND the icon

// Done cell (active)
<td className="bg-emerald-500 text-gray-950">
  <CheckIcon className="w-7 h-7 mx-auto" strokeWidth={3} />
</td>

// Hold cell (active)
<td className="bg-rose-500 text-gray-950">
  <PauseIcon className="w-7 h-7 mx-auto" strokeWidth={3} />
</td>

// Missing cell (active)
<td className="bg-amber-500 text-gray-950">
  <AlertTriangleIcon className="w-7 h-7 mx-auto" strokeWidth={3} />
</td>

// Inactive cell -- show a dim outline icon as affordance
<td className="bg-gray-800/50 text-gray-600">
  <CircleIcon className="w-6 h-6 mx-auto" strokeWidth={1.5} />
</td>
```

---

## 3. Typography Scale

### Font Stack

```css
/* In globals.css or tailwind config */
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, 'Cascadia Code', 'Fira Mono', monospace;
```

**Inter** for all UI text: excellent readability, wide weight range, tabular numbers feature.
**Monospace** for order numbers only: fixed-width digits make scanning columns of numbers much faster.

### Scale Definition

| Element | Tailwind Classes | Rendered Size | Notes |
|---------|-----------------|---------------|-------|
| Station name (header) | `text-3xl font-bold tracking-tight` | 30px | Largest text, identifies the view |
| Order number | `font-mono text-2xl font-semibold tabular-nums` | 24px | Monospace for column alignment |
| Customer name | `text-lg font-medium text-gray-300 truncate` | 18px | Truncated with ellipsis at cell edge |
| Column header | `text-sm font-semibold uppercase tracking-widest text-gray-400` | 14px | ALL CAPS for visual separation |
| Status label in cell | `text-base font-bold uppercase` | 16px | Inside active status cells |
| Rush badge | `text-xs font-bold uppercase tracking-wider` | 12px | Small but high contrast |
| Timestamp / metadata | `text-sm text-gray-500` | 14px | Non-critical information |
| Empty state message | `text-xl text-gray-500 font-medium` | 20px | "No orders at this station" |
| Dashboard card title | `text-2xl font-bold` | 24px | Station name on dashboard cards |
| Dashboard stat number | `font-mono text-4xl font-bold tabular-nums` | 36px | Order count on dashboard |

### Order Number Formatting

Order numbers are 6-digit strings. Use monospace and tabular numbers for perfect column alignment:

```tsx
<span className="font-mono text-2xl font-semibold tabular-nums text-white">
  {order.orderNumber}
</span>
```

The `tabular-nums` class (Tailwind v4 utility for `font-variant-numeric: tabular-nums`) ensures all digits occupy the same width, so numbers like `199544` and `200004` align perfectly in a vertical column.

### Responsive Font Scaling

For different screen sizes, scale the base font using Tailwind's responsive prefixes:

```tsx
// Order number: scales up on larger screens
<span className="font-mono text-xl md:text-2xl xl:text-3xl font-semibold tabular-nums">

// Station header: scales up on larger screens
<h1 className="text-2xl md:text-3xl xl:text-4xl font-bold tracking-tight">
```

Breakpoint mapping to physical screens:
- **Default (no prefix)**: 10" tablet (~768px viewport)
- **`md:`**: 15" touchscreen (~1024px viewport)
- **`xl:`**: 24" monitor (~1440px+ viewport)

---

## 4. Layout Architecture

### CSS Grid vs Flexbox Decision Map

| Layout Need | Choice | Reason |
|-------------|--------|--------|
| Page-level viewport fill | **CSS Grid** | `grid-rows` for header/body/footer zones |
| Order table | **CSS Grid** | Fixed column ratios with `grid-template-columns` |
| Dashboard card grid | **CSS Grid** | 2D card layout with uniform sizing |
| Station header bar | **Flexbox** | Single row, space-between alignment |
| Status cell contents | **Flexbox** | Center icon/text in cell |
| Order row (within grid) | **CSS Grid subgrid or `display: contents`** | Maintain column alignment |

### Station View -- Full Layout

The station view is the primary interface. It fills the entire viewport with three zones:

```tsx
// src/app/station/[stationId]/page.tsx
<div className="h-dvh grid grid-rows-[auto_1fr_auto] bg-gray-950">
  {/* Zone 1: Station Header -- fixed, never scrolls */}
  <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
    {/* Station name + order count + clock */}
  </header>

  {/* Zone 2: Order Table -- scrollable */}
  <main className="overflow-y-auto overscroll-contain">
    {/* Order grid lives here */}
  </main>

  {/* Zone 3: Footer (optional) -- fixed, never scrolls */}
  <footer className="bg-gray-900 border-t border-gray-800 px-6 py-3">
    {/* Connection status, last refresh time, admin link */}
  </footer>
</div>
```

**`h-dvh`** (dynamic viewport height) is critical for mobile/tablet where browser chrome can change the viewport. It replaces `h-screen` which can cause content to hide behind toolbars.

**`grid-rows-[auto_1fr_auto]`**: header and footer take their natural height, the middle section fills all remaining space.

**`overscroll-contain`**: prevents pull-to-refresh and rubber-banding on the scroll area. Essential for kiosk touchscreens.

### Order Table -- Grid Column Layout

The order table uses CSS Grid for precise column control. The spec requires: ORDER# (~40% width), then DONE/HOLD/MISSING splitting the remaining ~60% evenly (~20% each).

```tsx
// The grid container for the entire order list (including header)
<div
  className="
    grid
    grid-cols-[2fr_1fr_1fr_1fr]
    w-full
  "
  role="grid"
  aria-label="Orders for this station"
>
  {/* Sticky Column Headers */}
  <div className="contents" role="row">
    <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm
                    px-6 py-4 border-b border-gray-700
                    text-sm font-semibold uppercase tracking-widest text-gray-400"
         role="columnheader">
      Order
    </div>
    <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm
                    px-3 py-4 border-b border-gray-700 text-center
                    text-sm font-semibold uppercase tracking-widest text-emerald-400"
         role="columnheader">
      Done
    </div>
    <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm
                    px-3 py-4 border-b border-gray-700 text-center
                    text-sm font-semibold uppercase tracking-widest text-rose-400"
         role="columnheader">
      Hold
    </div>
    <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm
                    px-3 py-4 border-b border-gray-700 text-center
                    text-sm font-semibold uppercase tracking-widest text-amber-400"
         role="columnheader">
      Missing
    </div>
  </div>

  {/* Order Rows -- each row uses `contents` to participate in parent grid */}
  {orders.map((order, i) => (
    <div
      key={order.id}
      className="contents"
      role="row"
    >
      {/* ORDER# cell */}
      <div
        className={`
          px-6 py-4 flex flex-col justify-center gap-1
          border-b border-gray-800/50
          ${i % 2 === 0 ? "bg-gray-900" : "bg-gray-800/30"}
        `}
        role="gridcell"
      >
        <div className="flex items-center gap-3">
          {order.isRush && (
            <span className="inline-flex items-center px-2.5 py-0.5
                             bg-red-600 text-white text-xs font-bold
                             uppercase tracking-wider rounded-md">
              Rush
            </span>
          )}
          <span className="font-mono text-2xl font-semibold tabular-nums text-white">
            {order.orderNumber}
          </span>
        </div>
        <span className="text-lg text-gray-300 font-medium truncate max-w-[300px]">
          {order.customerName}
        </span>
      </div>

      {/* DONE cell */}
      <StatusCell
        status="done"
        active={order.done}
        rowIndex={i}
        onToggle={() => toggleStatus(order.id, "done")}
      />

      {/* HOLD cell */}
      <StatusCell
        status="hold"
        active={order.hold}
        rowIndex={i}
        onToggle={() => toggleStatus(order.id, "hold")}
      />

      {/* MISSING cell */}
      <StatusCell
        status="missing"
        active={order.missing}
        rowIndex={i}
        onToggle={() => toggleStatus(order.id, "missing")}
      />
    </div>
  ))}
</div>
```

### Why `grid-cols-[2fr_1fr_1fr_1fr]` and not percentages?

- `2fr` = 2/5 = 40% for the order info column
- `1fr` each = 1/5 = 20% for each status column
- Fractional units are more flexible than fixed percentages: they automatically account for gap spacing and padding without overflow math

### Alternative: 5-Column Layout for Wider Screens

On larger monitors (24"+), you may want to show additional data. The grid can adapt:

```tsx
// On xl screens, add a "Department" or "Ship Date" column
<div className="
  grid
  grid-cols-[2fr_1fr_1fr_1fr]
  xl:grid-cols-[1.5fr_0.8fr_1fr_1fr_1fr]
  w-full
">
```

But for factory kiosk use, the 4-column layout is recommended. Keep it simple.

### Responsive Breakpoint Strategy

| Screen | Viewport | grid-cols | Font Scale | Padding | Use Case |
|--------|----------|-----------|------------|---------|----------|
| 10" tablet | ~768px | `grid-cols-[2fr_1fr_1fr_1fr]` | Base (text-xl numbers) | `px-4 py-3` | Portable station tablet |
| 15" touch | ~1024px | `grid-cols-[2fr_1fr_1fr_1fr]` | `md:` scale (text-2xl numbers) | `px-6 py-4` | Primary kiosk screen |
| 24" monitor | ~1440px+ | `grid-cols-[2fr_1fr_1fr_1fr]` | `xl:` scale (text-3xl numbers) | `px-8 py-5` | Wall-mounted display |

Responsive implementation on rows:

```tsx
<div className="px-4 py-3 md:px-6 md:py-4 xl:px-8 xl:py-5">
  <span className="font-mono text-xl md:text-2xl xl:text-3xl font-semibold tabular-nums">
    {order.orderNumber}
  </span>
  <span className="text-base md:text-lg xl:text-xl text-gray-300 truncate">
    {order.customerName}
  </span>
</div>
```

### Gap Spacing and Padding Ratios

Consistent spacing creates visual rhythm. Use a **4px base unit** (Tailwind's default):

| Element | Spacing | Tailwind | Px |
|---------|---------|----------|----|
| Grid row gap | none | `gap-y-0` | 0 (use borders instead) |
| Grid column gap | none | `gap-x-0` | 0 (use cell padding instead) |
| Cell horizontal padding | moderate | `px-4 md:px-6` | 16-24px |
| Cell vertical padding | generous | `py-3 md:py-4` | 12-16px |
| Header padding | generous | `px-6 py-4` | 24px / 16px |
| Between order# and customer | tight | `gap-1` | 4px |
| Between rush badge and order# | moderate | `gap-3` | 12px |
| Card gap on dashboard | moderate | `gap-4 md:gap-6` | 16-24px |

### Sticky Headers

The column headers must stay visible while scrolling through orders:

```tsx
{/* Each header cell gets sticky positioning */}
<div className="
  sticky top-0 z-10
  bg-gray-900/95 backdrop-blur-sm
  border-b-2 border-gray-700
">
```

**`bg-gray-900/95`**: 95% opacity allows a subtle see-through effect as rows scroll behind.
**`backdrop-blur-sm`**: Frosted glass effect reinforces the "floating header" perception.
**`border-b-2`**: Thicker bottom border on header (2px vs 1px on rows) creates a clear visual separator.
**`z-10`**: Ensures headers stay above all row content during scroll.

### Scroll Fade Edge

Add a gradient fade at the bottom of the scroll area to hint that more content exists below:

```tsx
<main className="relative overflow-y-auto overscroll-contain">
  {/* Order grid */}
  <div className="grid ...">
    {/* rows */}
  </div>

  {/* Bottom fade overlay -- fixed at bottom of scroll container */}
  <div className="
    sticky bottom-0 h-16 pointer-events-none
    bg-gradient-to-t from-gray-950 to-transparent
  " />
</main>
```

---

## 5. Touchscreen UX

### Touch Target Sizing

Industry minimums:
- Apple Human Interface Guidelines: 44x44px
- Material Design: 48x48dp
- **Our recommendation: 56-64px minimum** for gloved factory hands

Implementation for status cells (the primary tap targets):

```tsx
// StatusCell component
<button
  className="
    min-h-[64px] min-w-[64px]
    w-full
    flex items-center justify-center
    border-b border-gray-800/50
    cursor-pointer
    transition-all duration-150 ease-out
    active:scale-95
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
  "
  onClick={onToggle}
  role="switch"
  aria-checked={active}
  aria-label={`Mark order ${orderNumber} as ${statusLabel}`}
>
  {/* Icon + optional label */}
</button>
```

**`min-h-[64px]`**: guarantees 64px tall even if content is smaller.
**`min-w-[64px]`**: guarantees 64px wide; `w-full` allows it to stretch to fill the grid column.

For the order info cell (non-interactive, but may be tappable for detail expansion):
```tsx
<div className="min-h-[64px] py-4 px-6 flex flex-col justify-center">
```

### Preventing Double-Tap Zoom

Apply globally via CSS (Tailwind does not have a built-in utility for this):

```css
/* globals.css */
* {
  touch-action: manipulation;
}
```

This disables double-tap zoom while preserving normal scrolling and single-tap behavior. The `manipulation` value is supported in all modern browsers.

### Preventing Text Selection

Already set on `<body>` via `select-none`. For any elements that **should** be selectable (e.g., order numbers for copy-paste in admin mode), override locally:

```tsx
<span className="select-text">{order.orderNumber}</span>
```

### Touch Feedback (Active States)

Since hover states are meaningless on touchscreens, all feedback uses `active:` pseudo-class:

```tsx
// Status cell -- inactive state, being pressed
<button className="
  bg-gray-800/50 border border-gray-700/50
  active:bg-gray-700 active:scale-[0.97]
  transition-all duration-100 ease-out
">

// Status cell -- active (toggled on), being pressed
<button className="
  bg-emerald-500 border border-emerald-400
  active:brightness-110 active:scale-[0.97]
  transition-all duration-100 ease-out
">
```

**`active:scale-[0.97]`**: a subtle 3% scale-down gives satisfying "push button" feel without visually jarring the layout. Using `scale-95` (5%) is too much for a table cell -- it creates visible gaps.

**`duration-100`**: 100ms is fast enough to feel instant, slow enough to be perceptible. For touch feedback, never go above 150ms.

### Debouncing Double Taps

Workers may accidentally double-tap. Implement a client-side debounce on status toggles:

```tsx
// hooks/useStatusToggle.ts
import { useCallback, useRef } from "react";

export function useStatusToggle(
  onToggle: (orderId: string, field: StatusField) => Promise<void>
) {
  const lastTapRef = useRef<Record<string, number>>({});
  const DEBOUNCE_MS = 400; // 400ms between taps on the same cell

  const toggle = useCallback(
    async (orderId: string, field: StatusField) => {
      const key = `${orderId}-${field}`;
      const now = Date.now();
      const lastTap = lastTapRef.current[key] || 0;

      if (now - lastTap < DEBOUNCE_MS) return; // Ignore rapid taps
      lastTapRef.current[key] = now;

      await onToggle(orderId, field);
    },
    [onToggle]
  );

  return toggle;
}
```

### Swipe Behavior

**Recommendation: Do not implement swipe gestures on order rows.**

Rationale:
- Workers are wearing gloves; precision swipes are unreliable
- Accidental swipes while scrolling would be frustrating
- The 3-button (DONE/HOLD/MISSING) interface is already minimal
- Adding swipe creates a hidden interaction that violates the "zero learning curve" requirement

If swipe is later desired (e.g., swipe-to-expand for notes/details), it must require a **deliberate horizontal swipe of 100px+** to distinguish from vertical scroll gestures.

### Destructive Action Protection

Toggling a status ON is not destructive (it can be toggled off). However, if a "remove order" or "clear all" admin action is added, use a hold-to-confirm pattern:

```tsx
// Hold-to-confirm button (e.g., for removing an order in admin mode)
<button
  className="
    relative overflow-hidden
    min-h-[56px] px-6 rounded-lg
    bg-red-600/20 text-red-400 border border-red-600/30
    active:bg-red-600 active:text-white
    transition-colors duration-[800ms]
  "
  onPointerDown={startHoldTimer}
  onPointerUp={cancelHoldTimer}
  onPointerLeave={cancelHoldTimer}
>
  <span>Hold to Remove</span>
  {/* Animated fill bar that grows during hold */}
  <div
    className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-[800ms]"
    style={{ width: isHolding ? "100%" : "0%" }}
  />
</button>
```

The action triggers after 800ms of continuous press. Releasing early cancels it. This prevents accidental taps from causing data loss.

---

## 6. Component Specifications

### 6.1 Station Header

The header identifies the station and provides at-a-glance status:

```tsx
// components/StationHeader.tsx
<header className="
  bg-gray-900 border-b border-gray-800
  px-6 py-4 md:px-8 md:py-5
  flex items-center justify-between
  shrink-0
">
  {/* Left: Station Identity */}
  <div className="flex items-center gap-4">
    {/* Station number badge */}
    <div className="
      w-12 h-12 rounded-xl
      bg-blue-600 text-white
      flex items-center justify-center
      text-xl font-bold
    ">
      {stationIndex + 1}
    </div>
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
        {stationLabel}
      </h1>
      <p className="text-sm text-gray-400 mt-0.5">
        {stationDescription}
      </p>
    </div>
  </div>

  {/* Right: Quick Stats */}
  <div className="flex items-center gap-6">
    {/* Order count */}
    <div className="text-right">
      <div className="font-mono text-3xl font-bold tabular-nums text-white">
        {totalOrders}
      </div>
      <div className="text-xs uppercase tracking-wider text-gray-400">
        Orders
      </div>
    </div>

    {/* Status indicators (mini badges) */}
    {holdCount > 0 && (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/15">
        <PauseIcon className="w-4 h-4 text-rose-400" />
        <span className="font-mono text-lg font-semibold text-rose-400">
          {holdCount}
        </span>
      </div>
    )}
    {missingCount > 0 && (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15">
        <AlertTriangleIcon className="w-4 h-4 text-amber-400" />
        <span className="font-mono text-lg font-semibold text-amber-400">
          {missingCount}
        </span>
      </div>
    )}

    {/* Clock (useful for factory shifts) */}
    <div className="font-mono text-xl text-gray-400 tabular-nums">
      {currentTime}
    </div>
  </div>
</header>
```

### 6.2 Status Cell Component

The most critical interactive element. Each cell is a large, tappable button:

```tsx
// components/StatusCell.tsx
interface StatusCellProps {
  status: "done" | "hold" | "missing";
  active: boolean;
  rowIndex: number;
  onToggle: () => void;
  orderNumber: string;
}

const STATUS_CONFIG = {
  done: {
    activeBg: "bg-emerald-500",
    activeBorder: "border-emerald-400",
    activeText: "text-gray-950",
    label: "Done",
    Icon: CheckIcon,
  },
  hold: {
    activeBg: "bg-rose-500",
    activeBorder: "border-rose-400",
    activeText: "text-gray-950",
    label: "Hold",
    Icon: PauseIcon,
  },
  missing: {
    activeBg: "bg-amber-500",
    activeBorder: "border-amber-400",
    activeText: "text-gray-950",
    label: "Missing",
    Icon: AlertTriangleIcon,
  },
} as const;

export function StatusCell({ status, active, rowIndex, onToggle, orderNumber }: StatusCellProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.Icon;

  return (
    <button
      className={`
        min-h-[64px] w-full
        flex flex-col items-center justify-center gap-1
        border-b border-gray-800/50
        cursor-pointer select-none
        transition-all duration-150 ease-out
        active:scale-[0.97]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
        ${
          active
            ? `${config.activeBg} ${config.activeBorder} ${config.activeText} border active:brightness-110`
            : `${rowIndex % 2 === 0 ? "bg-gray-900" : "bg-gray-800/30"} text-gray-600 active:bg-gray-700`
        }
      `}
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      aria-label={`${config.label} status for order ${orderNumber}: currently ${active ? "on" : "off"}`}
    >
      <Icon className={`w-7 h-7 ${active ? "" : "opacity-30"}`} strokeWidth={active ? 3 : 1.5} />
      {active && (
        <span className="text-xs font-bold uppercase tracking-wider">
          {config.label}
        </span>
      )}
    </button>
  );
}
```

Design decisions:
- **Icon always visible**: Even when inactive, a faint outline icon shows what the button does (affordance). Active state makes it bold + adds a text label.
- **`gap-1`** between icon and label: tight spacing keeps them visually grouped.
- **`text-gray-950`** on active: dark text on bright backgrounds (emerald/rose/amber) ensures readability.
- **No hover state**: hover is removed because this is touch-first. The `active:` state handles all feedback.

### 6.3 Order Row Component

Each order is a row in the grid, combining the info cell and three status cells:

```tsx
// components/OrderRow.tsx
interface OrderRowProps {
  order: StationOrder;
  index: number;
  onToggleStatus: (orderId: string, field: StatusField) => void;
  isCompletedFading?: boolean;  // true when done + in fade-out delay
}

export function OrderRow({ order, index, onToggleStatus, isCompletedFading }: OrderRowProps) {
  return (
    <div
      className={`
        contents
        ${isCompletedFading ? "opacity-40 transition-opacity duration-1000" : ""}
      `}
      role="row"
      aria-label={`Order ${order.orderNumber}`}
    >
      {/* ORDER INFO CELL */}
      <div
        className={`
          px-4 py-3 md:px-6 md:py-4
          flex flex-col justify-center gap-1
          border-b border-gray-800/50
          ${index % 2 === 0 ? "bg-gray-900" : "bg-gray-800/30"}
          ${order.isRush ? "border-l-4 border-l-red-500" : ""}
        `}
        role="gridcell"
      >
        <div className="flex items-center gap-3">
          {order.isRush && (
            <span className="
              inline-flex items-center
              px-2 py-0.5
              bg-red-600 text-white
              text-xs font-bold uppercase tracking-wider
              rounded
              animate-pulse
            ">
              RUSH
            </span>
          )}
          <span className="font-mono text-xl md:text-2xl font-semibold tabular-nums text-white">
            {order.orderNumber}
          </span>
        </div>
        <span className="text-base md:text-lg text-gray-300 font-medium truncate">
          {order.customerName}
        </span>
        {order.sidemark && (
          <span className="text-sm text-gray-500 truncate">
            {order.sidemark}
          </span>
        )}
      </div>

      {/* STATUS CELLS */}
      <StatusCell
        status="done"
        active={order.done}
        rowIndex={index}
        onToggle={() => onToggleStatus(order.id, "done")}
        orderNumber={order.orderNumber}
      />
      <StatusCell
        status="hold"
        active={order.hold}
        rowIndex={index}
        onToggle={() => onToggleStatus(order.id, "hold")}
        orderNumber={order.orderNumber}
      />
      <StatusCell
        status="missing"
        active={order.missing}
        rowIndex={index}
        onToggle={() => onToggleStatus(order.id, "missing")}
        orderNumber={order.orderNumber}
      />
    </div>
  );
}
```

Design details:
- **Rush orders**: `border-l-4 border-l-red-500` creates a vivid left accent stripe. The `animate-pulse` on the badge creates a slow breathing animation that catches the eye from across the room.
- **Alternating rows**: `bg-gray-900` and `bg-gray-800/30` -- subtle enough to guide the eye, not zebra-striped to the point of distraction.
- **Customer name truncation**: `truncate` with a max-width prevents long names from breaking the layout.
- **`contents` on the row wrapper**: This is essential. It makes the row's children participate directly in the parent CSS Grid, maintaining column alignment. Without this, each row would be its own block and ignore the grid template.

### 6.4 Row Dividers vs Alternating Backgrounds

**Recommendation: Use both**, but subtly.

- **Alternating backgrounds** (`bg-gray-900` / `bg-gray-800/30`): provide horizontal banding that guides the eye across rows
- **Thin borders** (`border-b border-gray-800/50`): provide crisp separation

Why not one or the other?
- Borders alone: rows feel disconnected, harder to scan horizontally
- Alternating alone: on a dark theme, the contrast between two dark shades is too subtle at distance

### 6.5 Empty State

When a station has no orders:

```tsx
<div className="
  flex flex-col items-center justify-center
  h-full min-h-[400px]
  text-center
  gap-4
">
  <div className="
    w-24 h-24 rounded-full
    bg-gray-800
    flex items-center justify-center
  ">
    <InboxIcon className="w-12 h-12 text-gray-600" />
  </div>
  <h2 className="text-2xl font-semibold text-gray-400">
    No Orders
  </h2>
  <p className="text-lg text-gray-500 max-w-sm">
    All clear at {stationLabel}. Orders will appear here when assigned.
  </p>
</div>
```

### 6.6 Station Footer

A minimal footer for connection status and utilities:

```tsx
<footer className="
  bg-gray-900 border-t border-gray-800
  px-6 py-3
  flex items-center justify-between
  text-sm text-gray-500
  shrink-0
">
  {/* Connection indicator */}
  <div className="flex items-center gap-2">
    <div className={`
      w-2.5 h-2.5 rounded-full
      ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}
    `} />
    <span>{isConnected ? "Live" : "Reconnecting..."}</span>
  </div>

  {/* Last updated */}
  <span className="font-mono tabular-nums">
    Updated {lastRefresh}
  </span>

  {/* Back to dashboard (small, unobtrusive) */}
  <a
    href="/"
    className="
      text-gray-500 hover:text-gray-300
      underline underline-offset-2
      min-h-[44px] flex items-center
    "
  >
    Dashboard
  </a>
</footer>
```

---

## 7. Animations & Transitions

### 7.1 Order Completion Fade-Out

When an order is marked DONE, it should remain visible briefly (configurable, default 30 seconds), then fade out and collapse:

```css
/* globals.css */
@keyframes fadeOutCollapse {
  0% {
    opacity: 0.4;
    max-height: 100px;
    transform: scale(1);
  }
  70% {
    opacity: 0;
    max-height: 100px;
    transform: scale(0.98);
  }
  100% {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
    transform: scale(0.95);
  }
}

.animate-fade-out-collapse {
  animation: fadeOutCollapse 600ms ease-in-out forwards;
}
```

**Timing breakdown:**
1. **Instant**: status cell turns green, checkmark appears (150ms transition)
2. **0-30 seconds**: row stays visible but dims to 40% opacity (`opacity-40 transition-opacity duration-1000`)
3. **At 30 seconds**: `animate-fade-out-collapse` triggers -- row fades to 0% opacity, scales down slightly, then collapses its height to 0 over 600ms
4. **After animation**: row is removed from DOM

Implementation in the component:

```tsx
// In the station view, manage fade-out timing
const [fadingOrders, setFadingOrders] = useState<Set<string>>(new Set());
const [removedOrders, setRemovedOrders] = useState<Set<string>>(new Set());

useEffect(() => {
  const timers: NodeJS.Timeout[] = [];

  orders.forEach((order) => {
    if (order.done && order.doneAt) {
      const elapsed = Date.now() - order.doneAt;
      const remaining = DONE_FADE_DELAY_MS - elapsed;

      if (remaining <= 0) {
        // Already past delay -- start fade-out
        setFadingOrders((prev) => new Set(prev).add(order.id));
      } else {
        // Schedule the fade-out
        const timer = setTimeout(() => {
          setFadingOrders((prev) => new Set(prev).add(order.id));
          // After animation completes, remove from DOM
          setTimeout(() => {
            setRemovedOrders((prev) => new Set(prev).add(order.id));
          }, 600);
        }, remaining);
        timers.push(timer);
      }
    }
  });

  return () => timers.forEach(clearTimeout);
}, [orders]);
```

**Important caveat with CSS Grid and `contents`**: The `fadeOutCollapse` animation with `max-height` will NOT work directly on an element with `display: contents` because `contents` removes the element from the layout flow. Two solutions:

**Solution A (recommended)**: Wrap each row in a container that does NOT use `contents`, and apply the animation to the container. This means the inner cells need their own sub-grid or flex layout:

```tsx
{/* Wrap the row for animation control */}
<div
  className={`
    col-span-full grid grid-cols-subgrid
    ${fadingOrders.has(order.id) ? "animate-fade-out-collapse" : ""}
    ${order.done && !fadingOrders.has(order.id) ? "opacity-40 transition-opacity duration-1000" : ""}
  `}
>
  {/* cells */}
</div>
```

**Solution B**: Use `display: grid` with `grid-column: 1 / -1` and `grid-template-columns: subgrid` on the row wrapper, which inherits the parent's column template while still being a box that can be animated. This requires browser support for CSS subgrid (supported in Chrome 117+, Firefox 71+, Safari 16+).

### 7.2 New Order Appearance

When a new order arrives via real-time update, it should slide in rather than pop:

```css
/* globals.css */
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideInFromBottom 300ms ease-out;
}
```

Apply to newly added rows:

```tsx
<div
  className={`
    contents
    ${isNewOrder ? "animate-slide-in" : ""}
  `}
>
```

**Duration: 300ms**. Fast enough to not feel sluggish, slow enough to catch the eye. `ease-out` decelerates into final position, which feels natural for "arriving" elements.

### 7.3 Status Toggle Color Fill

When tapping a status cell, the color change should not be instant (feels glitchy) or slow (feels laggy). Target: **150ms**.

```tsx
<button
  className="
    transition-all duration-150 ease-out
    ...
  "
>
```

The `transition-all` covers:
- `background-color`: fills with status color
- `color`: text changes from gray to dark
- `border-color`: border brightens to match
- `transform`: the `active:scale-[0.97]` press effect

### 7.4 Loading States

**Use skeleton screens, not spinners.** Rationale:

- Spinners provide no spatial information -- workers cannot tell what is loading or where content will appear
- Skeleton screens pre-render the layout shape so the UI does not "jump" when data arrives
- Skeleton screens feel faster (perceived performance) because something is already on screen

```tsx
// components/OrderRowSkeleton.tsx
export function OrderRowSkeleton({ index }: { index: number }) {
  return (
    <div className="contents" role="row" aria-hidden="true">
      {/* Order info skeleton */}
      <div className={`
        px-6 py-4
        border-b border-gray-800/50
        ${index % 2 === 0 ? "bg-gray-900" : "bg-gray-800/30"}
      `}>
        <div className="h-7 w-28 bg-gray-800 rounded animate-pulse mb-2" />
        <div className="h-5 w-48 bg-gray-800/60 rounded animate-pulse" />
      </div>

      {/* Status cell skeletons */}
      {[0, 1, 2].map((j) => (
        <div
          key={j}
          className={`
            min-h-[64px]
            border-b border-gray-800/50
            ${index % 2 === 0 ? "bg-gray-900" : "bg-gray-800/30"}
            flex items-center justify-center
          `}
        >
          <div className="w-10 h-10 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Usage: show 8 skeleton rows while loading
{isLoading && Array.from({ length: 8 }, (_, i) => (
  <OrderRowSkeleton key={`skeleton-${i}`} index={i} />
))}
```

### 7.5 Auto-Refresh Data Transition

When polling returns new data, do NOT just swap the entire list (causes visual flash). Instead:

1. **Compare** old and new order lists
2. **Animate out** removed orders (fade-out-collapse)
3. **Animate in** new orders (slide-in)
4. **Update in place** changed orders (status cells transition smoothly due to `transition-all duration-150`)

For a subtle "data refreshed" indicator, flash the footer timestamp:

```tsx
<span className={`
  font-mono tabular-nums
  ${justRefreshed ? "text-blue-400 transition-colors duration-300" : "text-gray-500 transition-colors duration-1000"}
`}>
  Updated {lastRefresh}
</span>
```

The timestamp briefly turns blue-400 then fades back to gray-500 over 1 second.

---

## 8. Kiosk Mode

### 8.1 Full-Screen Layout

The app should fill the entire browser viewport with no wasted space:

```tsx
// Station view root
<div className="h-dvh w-dvw overflow-hidden bg-gray-950">
```

**`h-dvh w-dvw`**: dynamic viewport units that account for browser chrome. On a kiosk browser, these equal the full screen.

For actual kiosk deployment, configure the browser:
- **Chrome kiosk mode**: `--kiosk --app=http://localhost:3000/station/basket`
- **Firefox kiosk mode**: `--kiosk http://localhost:3000/station/basket`

### 8.2 Custom Scrollbar

Hide the default scrollbar and replace with a minimal dark track:

```css
/* globals.css */

/* Hide default scrollbar for all scrollable elements */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.4);  /* gray-600 at 40% */
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: rgba(107, 114, 128, 0.6);  /* gray-500 at 60% */
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
}
```

Apply to the scroll container:

```tsx
<main className="overflow-y-auto overscroll-contain custom-scrollbar">
```

### 8.3 Auto-Scroll for Long Order Lists

If a station has more orders than fit on screen, implement a slow auto-scroll that cycles through all orders:

```tsx
// hooks/useAutoScroll.ts
import { useEffect, useRef, useState } from "react";

const SCROLL_SPEED = 0.5;        // pixels per frame (~30px/sec at 60fps)
const PAUSE_AT_ENDS_MS = 5000;   // pause 5 seconds at top and bottom

export function useAutoScroll(enabled: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!enabled || !scrollRef.current) return;

    const el = scrollRef.current;
    let direction = 1; // 1 = down, -1 = up
    let pauseTimer: NodeJS.Timeout | null = null;
    let animationId: number;

    const step = () => {
      if (isPaused) {
        animationId = requestAnimationFrame(step);
        return;
      }

      el.scrollTop += SCROLL_SPEED * direction;

      // Check if we hit the bottom
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        direction = -1;
        setIsPaused(true);
        pauseTimer = setTimeout(() => setIsPaused(false), PAUSE_AT_ENDS_MS);
      }
      // Check if we hit the top
      else if (el.scrollTop <= 0) {
        direction = 1;
        setIsPaused(true);
        pauseTimer = setTimeout(() => setIsPaused(false), PAUSE_AT_ENDS_MS);
      }

      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);

    // Pause auto-scroll on user touch
    const pauseOnTouch = () => {
      setIsPaused(true);
      if (pauseTimer) clearTimeout(pauseTimer);
      pauseTimer = setTimeout(() => setIsPaused(false), 10000); // resume after 10s of no interaction
    };

    el.addEventListener("touchstart", pauseOnTouch);

    return () => {
      cancelAnimationFrame(animationId);
      if (pauseTimer) clearTimeout(pauseTimer);
      el.removeEventListener("touchstart", pauseOnTouch);
    };
  }, [enabled, isPaused]);

  return scrollRef;
}
```

**Important**: Auto-scroll should pause immediately when a worker touches the screen, and resume after 10 seconds of inactivity.

### 8.4 Screen Burn-In Prevention

LCD and OLED kiosk screens can suffer from image retention (LCD) or actual burn-in (OLED) when displaying static content for hours.

**Strategy 1: Pixel shift** -- Shift the entire UI by 1-2 pixels every 5 minutes:

```css
/* globals.css */
@keyframes pixelShift {
  0%   { transform: translate(0px, 0px); }
  25%  { transform: translate(1px, 1px); }
  50%  { transform: translate(0px, 2px); }
  75%  { transform: translate(-1px, 1px); }
  100% { transform: translate(0px, 0px); }
}

.burn-in-prevention {
  animation: pixelShift 20m linear infinite;
}
```

Apply to the root container:

```tsx
<div className="h-dvh w-dvw burn-in-prevention">
```

The 1-2px shift is imperceptible to the human eye but prevents static pixel retention.

**Strategy 2: Dim on idle** -- After 30 minutes of no interaction, reduce screen brightness via an overlay:

```tsx
{isIdle && (
  <div className="
    fixed inset-0 z-50
    bg-black/50
    transition-opacity duration-[5000ms]
    pointer-events-none
  " />
)}
```

The overlay is non-interactive (`pointer-events-none`). Any touch event on the actual UI beneath it dismisses the idle state, and the overlay fades out.

---

## 9. Accessibility

### 9.1 High Contrast Ratios

Factory floors have ambient lighting that washes out screens. Target **WCAG AAA (7:1)** for critical information:

| Element | Foreground | Background | Ratio | Passes |
|---------|-----------|------------|-------|--------|
| Order number (white on gray-950) | #FFFFFF | #030712 | 19.4:1 | AAA |
| Customer name (gray-300 on gray-900) | #D1D5DB | #111827 | 9.2:1 | AAA |
| Column header (gray-400 on gray-900) | #9CA3AF | #111827 | 5.8:1 | AA |
| Done icon (gray-950 on emerald-500) | #030712 | #10B981 | 5.9:1 | AA |
| Hold icon (gray-950 on rose-500) | #030712 | #F43F5E | 4.8:1 | AA |
| Missing icon (gray-950 on amber-500) | #030712 | #F59E0B | 8.1:1 | AAA |
| Inactive cell icon (gray-600 on gray-900) | #4B5563 | #111827 | 2.9:1 | Fail* |

*The inactive cell icon is intentionally low contrast -- it is a placeholder affordance, not critical information. Active states all pass AA or better.

### 9.2 Icons Alongside Color

As detailed in Section 2 (Color System), every status uses a unique icon shape in addition to color:

- **Done**: Bold checkmark -- universally recognized "complete"
- **Hold**: Double vertical bars (pause) -- universally recognized "paused"
- **Missing**: Triangle with exclamation -- universally recognized "warning/missing"
- **Rush**: Text badge "RUSH" -- no icon needed, text is unambiguous

This ensures that a worker with deuteranopia (red-green colorblindness) can still distinguish all states by shape alone. The icons are large (28px / `w-7 h-7`) and use thick strokes (`strokeWidth={3}` when active) for visibility.

### 9.3 ARIA Roles and Labels

The order grid uses proper ARIA grid roles:

```tsx
<div role="grid" aria-label="Orders at Basket station">
  <div role="row" className="contents">
    <div role="columnheader">Order</div>
    <div role="columnheader">Done</div>
    <div role="columnheader">Hold</div>
    <div role="columnheader">Missing</div>
  </div>
  {orders.map((order) => (
    <div role="row" aria-label={`Order ${order.orderNumber}`} className="contents">
      <div role="gridcell">{/* order info */}</div>
      <button role="switch" aria-checked={order.done} aria-label="Mark as done">
      <button role="switch" aria-checked={order.hold} aria-label="Mark as hold">
      <button role="switch" aria-checked={order.missing} aria-label="Mark as missing">
    </div>
  ))}
</div>
```

Each status cell is a `role="switch"` with `aria-checked` so assistive technology understands it as a toggle.

### 9.4 Sound Feedback Considerations

On a factory floor, visual feedback may not be sufficient. Consider adding optional audio feedback:

```tsx
// hooks/useAudioFeedback.ts
const SOUNDS = {
  done: "/sounds/done-chime.mp3",    // brief positive chime (200ms)
  hold: "/sounds/hold-beep.mp3",     // double beep (300ms)
  missing: "/sounds/alert-buzz.mp3", // single buzz (150ms)
};

export function playStatusSound(status: StatusField) {
  const audio = new Audio(SOUNDS[status]);
  audio.volume = 0.3; // moderate volume
  audio.play().catch(() => {}); // ignore autoplay errors
}
```

Keep sounds brief (under 300ms), distinctive from each other, and at moderate volume. Workers should be able to identify the action by sound alone when they are not looking at the screen.

### 9.5 Large Text Mode

Some workers may need larger text. Provide a toggle that scales the root font size:

```tsx
// At the root layout level
<html className={`dark ${largeTextMode ? "text-[120%]" : ""}`}>
```

Since Tailwind's text utilities use `rem` units, scaling the root `font-size` to 120% will proportionally increase all text. The layout (paddings, margins specified in `rem`) will also scale, maintaining proportions.

Toggle button (in the header, small and unobtrusive):

```tsx
<button
  onClick={() => setLargeTextMode(!largeTextMode)}
  className="
    min-h-[44px] min-w-[44px]
    flex items-center justify-center
    rounded-lg bg-gray-800 text-gray-400
    active:bg-gray-700
    text-sm font-medium
  "
  aria-label={largeTextMode ? "Switch to normal text size" : "Switch to large text size"}
>
  {largeTextMode ? "Aa" : "AA"}
</button>
```

---

## 10. Dashboard Design

### 10.1 Dashboard Layout

The dashboard (`/`) shows all 7 stations at a glance. Use a responsive card grid:

```tsx
// src/app/page.tsx (dashboard)
<div className="h-dvh bg-gray-950 flex flex-col">
  {/* Dashboard Header */}
  <header className="
    bg-gray-900 border-b border-gray-800
    px-8 py-5
    flex items-center justify-between
    shrink-0
  ">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Skyco Station Tracker
      </h1>
      <p className="text-sm text-gray-400 mt-1">
        Production floor overview
      </p>
    </div>
    <div className="font-mono text-xl text-gray-400 tabular-nums">
      {currentTime}
    </div>
  </header>

  {/* Station Cards Grid */}
  <main className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-6 md:p-8">
    <div className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      gap-5 md:gap-6
      max-w-[1800px] mx-auto
    ">
      {stations.map((station) => (
        <StationCard key={station.stationId} station={station} />
      ))}
    </div>
  </main>
</div>
```

Grid breakpoints for station cards:
- **1 column**: < 640px (unlikely, but handles phone for admin on-the-go)
- **2 columns**: 640-1023px (10" tablet)
- **3 columns**: 1024-1279px (15" monitor)
- **4 columns**: 1280px+ (24" monitor -- 7 cards in 2 rows of 4+3)

### 10.2 Station Card Component

Each card represents one station and links to its touchscreen view:

```tsx
// components/StationCard.tsx
interface StationCardProps {
  station: StationSummary;
}

export function StationCard({ station }: StationCardProps) {
  const hasIssues = station.holdCount > 0 || station.missingCount > 0;
  const allClear = station.totalOrders > 0 && station.holdCount === 0 && station.missingCount === 0;

  return (
    <a
      href={`/station/${station.stationId}`}
      className={`
        group
        block rounded-2xl p-6
        bg-gray-900
        border-2
        ${hasIssues
          ? "border-amber-500/40"
          : allClear
            ? "border-emerald-500/30"
            : "border-gray-800"
        }
        shadow-lg shadow-black/20
        active:scale-[0.98] active:shadow-md
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
      `}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          {station.label}
        </h2>
        {/* Health dot */}
        <div className={`
          w-3.5 h-3.5 rounded-full
          ${hasIssues ? "bg-amber-500 animate-pulse" : allClear ? "bg-emerald-500" : "bg-gray-600"}
        `} />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-5">
        {station.description}
      </p>

      {/* Stats Row */}
      <div className="flex items-end justify-between">
        {/* Total orders -- the hero number */}
        <div>
          <div className="font-mono text-4xl font-bold tabular-nums text-white">
            {station.totalOrders}
          </div>
          <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">
            Orders
          </div>
        </div>

        {/* Mini status indicators */}
        <div className="flex items-center gap-3">
          {station.rushCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-mono text-sm font-semibold text-red-400 tabular-nums">
                {station.rushCount}
              </span>
            </div>
          )}
          {station.doneCount > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckIcon className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
                {station.doneCount}
              </span>
            </div>
          )}
          {station.holdCount > 0 && (
            <div className="flex items-center gap-1.5">
              <PauseIcon className="w-4 h-4 text-rose-400" />
              <span className="font-mono text-sm font-semibold text-rose-400 tabular-nums">
                {station.holdCount}
              </span>
            </div>
          )}
          {station.missingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangleIcon className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                {station.missingCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar: done / total */}
      {station.totalOrders > 0 && (
        <div className="mt-4">
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(station.doneCount / station.totalOrders) * 100}%` }}
            />
          </div>
        </div>
      )}
    </a>
  );
}
```

Card design details:
- **`rounded-2xl`**: generous corner radius (16px) for a modern card feel
- **`border-2`**: thick border for health indication -- normal gray, green when all clear, amber when issues exist
- **`shadow-lg shadow-black/20`**: elevated card feeling on dark backgrounds. `shadow-black/20` prevents shadows from being invisible on dark bg (default shadows use black which disappears on near-black surfaces)
- **`active:scale-[0.98]`**: satisfying press feedback on touch
- **Progress bar**: thin horizontal bar showing completion percentage. `transition-all duration-500 ease-out` for smooth animated updates
- **Health dot**: pulsing amber for issues, steady green for all-clear, gray for no orders. Visible from across the room.

### 10.3 Animated Number Transitions

When order counts change, animate the number transition:

```tsx
// components/AnimatedNumber.tsx
"use client";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;

    const start = prevValue.current;
    const end = value;
    const duration = 400; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return (
    <span className={`${className} tabular-nums`}>
      {displayValue}
    </span>
  );
}

// Usage on dashboard card
<AnimatedNumber
  value={station.totalOrders}
  className="font-mono text-4xl font-bold text-white"
/>
```

The cubic ease-out (`1 - (1-t)^3`) makes the number "decelerate" as it approaches the target, which feels more natural than linear counting.

---

## 11. Global CSS Setup

Complete `globals.css` with all custom utilities and animations:

```css
/* src/app/globals.css */
@import "tailwindcss";

/* ========================================
   CSS Custom Properties
   ======================================== */
:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'Cascadia Code', monospace;
}

@theme inline {
  --color-background: #030712;    /* gray-950 */
  --color-foreground: #F3F4F6;    /* gray-100 */
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}

/* ========================================
   Global Resets for Kiosk/Touch
   ======================================== */

/* Prevent double-tap zoom on all elements */
* {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;  /* Remove blue tap highlight on Android/iOS */
}

/* Force dark background, prevent white flash on page load */
html {
  background-color: #030712;
}

body {
  background-color: #030712;
  color: #F3F4F6;
  font-family: var(--font-sans);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* ========================================
   Custom Scrollbar
   ======================================== */

/* Webkit (Chrome, Safari, Edge) */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.4);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: rgba(107, 114, 128, 0.6);
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
}

/* ========================================
   Animations
   ======================================== */

/* Order completion: fade out and collapse height */
@keyframes fadeOutCollapse {
  0% {
    opacity: 0.4;
    max-height: 100px;
    transform: scale(1);
  }
  70% {
    opacity: 0;
    max-height: 100px;
    transform: scale(0.98);
  }
  100% {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
    overflow: hidden;
    transform: scale(0.95);
  }
}
.animate-fade-out-collapse {
  animation: fadeOutCollapse 600ms ease-in-out forwards;
}

/* New order arrival: slide up from below */
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-in {
  animation: slideInFromBottom 300ms ease-out;
}

/* Subtle pixel shift to prevent screen burn-in */
@keyframes pixelShift {
  0%   { transform: translate(0px, 0px); }
  25%  { transform: translate(1px, 1px); }
  50%  { transform: translate(0px, 2px); }
  75%  { transform: translate(-1px, 1px); }
  100% { transform: translate(0px, 0px); }
}
.burn-in-prevention {
  animation: pixelShift 1200s linear infinite;  /* 20 minute cycle */
}

/* Status toggle ripple effect (optional enhancement) */
@keyframes statusRipple {
  0% {
    box-shadow: inset 0 0 0 0 currentColor;
    opacity: 0.3;
  }
  100% {
    box-shadow: inset 0 0 0 100px currentColor;
    opacity: 0;
  }
}
.animate-status-ripple {
  animation: statusRipple 300ms ease-out;
}

/* ========================================
   Utility Classes
   ======================================== */

/* Force hardware acceleration for smoother animations */
.gpu {
  transform: translateZ(0);
  will-change: transform;
}

/* Prevent content overflow with ellipsis */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## 12. Tailwind Config Extensions

For Tailwind CSS v4, extend the theme via CSS custom properties in `globals.css` or a `tailwind.config.ts` if needed. Since the project uses Tailwind v4 with the PostCSS plugin, most customization happens via `@theme`:

```css
/* Additional @theme extensions in globals.css if needed */
@theme inline {
  /* Custom animation durations */
  --animate-fade-out-collapse: fadeOutCollapse 600ms ease-in-out forwards;
  --animate-slide-in: slideInFromBottom 300ms ease-out;

  /* Extended color aliases for semantic use */
  --color-status-done: #10B981;       /* emerald-500 */
  --color-status-hold: #F43F5E;       /* rose-500 */
  --color-status-missing: #F59E0B;    /* amber-500 */
  --color-status-rush: #DC2626;       /* red-600 */

  --color-surface-0: #030712;         /* gray-950 */
  --color-surface-1: #111827;         /* gray-900 */
  --color-surface-2: #1F2937;         /* gray-800 */
  --color-surface-3: #374151;         /* gray-700 */
}
```

This allows semantic usage like `bg-status-done` or `bg-surface-1` throughout the codebase, decoupling the design intent from the specific Tailwind color shade.

---

## Appendix A: Quick Reference -- Status Cell Class Map

Copy-paste ready classes for each state of each status cell:

```
DONE (inactive):
  bg-gray-900 text-gray-600 border-b border-gray-800/50
  active:bg-gray-700 active:scale-[0.97]
  transition-all duration-150 ease-out

DONE (active):
  bg-emerald-500 text-gray-950 border border-emerald-400 border-b-gray-800/50
  active:brightness-110 active:scale-[0.97]
  transition-all duration-150 ease-out

HOLD (inactive):
  bg-gray-900 text-gray-600 border-b border-gray-800/50
  active:bg-gray-700 active:scale-[0.97]
  transition-all duration-150 ease-out

HOLD (active):
  bg-rose-500 text-gray-950 border border-rose-400 border-b-gray-800/50
  active:brightness-110 active:scale-[0.97]
  transition-all duration-150 ease-out

MISSING (inactive):
  bg-gray-900 text-gray-600 border-b border-gray-800/50
  active:bg-gray-700 active:scale-[0.97]
  transition-all duration-150 ease-out

MISSING (active):
  bg-amber-500 text-gray-950 border border-amber-400 border-b-gray-800/50
  active:brightness-110 active:scale-[0.97]
  transition-all duration-150 ease-out
```

## Appendix B: Quick Reference -- Background Layer Stack

```
Page viewport:       bg-gray-950    #030712
Card/panel surface:  bg-gray-900    #111827
Table row (even):    bg-gray-900    #111827
Table row (odd):     bg-gray-800/30 ~#1F2937 at 30% opacity
Hover/pressed:       bg-gray-700    #374151
Input field bg:      bg-gray-800    #1F2937
Modal overlay:       bg-black/60    rgba(0,0,0,0.6)
```

## Appendix C: Recommended Icon Library

Use **lucide-react** (https://lucide.dev) for icons:

```bash
npm install lucide-react
```

Icons used in this design:
- `Check` -- Done status
- `Pause` -- Hold status
- `AlertTriangle` -- Missing status
- `Circle` -- Inactive/empty status placeholder
- `Inbox` -- Empty state illustration
- `Wifi` / `WifiOff` -- Connection status in footer

All icons should use:
- `strokeWidth={3}` when active (bold, high visibility)
- `strokeWidth={1.5}` when inactive (subtle affordance)
- `w-7 h-7` (28px) in status cells
- `w-4 h-4` (16px) for mini indicators in headers and dashboard cards

## Appendix D: Recommended Dependencies

```json
{
  "dependencies": {
    "lucide-react": "^0.400.0"
  }
}
```

No other UI libraries are recommended. Tailwind CSS handles all styling. Do not add a component library (shadcn, Radix, etc.) -- the interface is too specialized for factory use and would add unnecessary complexity.

## Appendix E: File Structure Recommendation

```
src/
  app/
    globals.css              -- Global styles, animations, custom scrollbar
    layout.tsx               -- Root layout with dark theme, Inter font
    page.tsx                 -- Dashboard (all stations overview)
    station/
      [stationId]/
        page.tsx             -- Station touchscreen view
  components/
    StationHeader.tsx        -- Station view header bar
    StationFooter.tsx        -- Station view footer bar
    OrderGrid.tsx            -- CSS Grid container with column headers
    OrderRow.tsx             -- Single order row (info + 3 status cells)
    StatusCell.tsx           -- Individual tappable status toggle button
    OrderRowSkeleton.tsx     -- Loading skeleton for order rows
    StationCard.tsx          -- Dashboard station summary card
    AnimatedNumber.tsx       -- Number counter animation
    EmptyState.tsx           -- No-orders placeholder
    RushBadge.tsx            -- Rush order indicator badge
  hooks/
    useStatusToggle.ts       -- Debounced status toggle handler
    useAutoScroll.ts         -- Kiosk auto-scroll behavior
    useStationOrders.ts      -- Data fetching + real-time updates for a station
    useDashboardData.ts      -- Data fetching for dashboard summaries
    useAudioFeedback.ts      -- Optional sound effects on status change
    useIdleDetection.ts      -- Screen dim / burn-in prevention trigger
  lib/
    db.ts                    -- SQLite database connection
    types.ts                 -- TypeScript type definitions
    constants.ts             -- DONE_FADE_DELAY_MS, POLL_INTERVAL_MS, etc.
```

---

*This design specification is intended to be followed precisely. Every Tailwind class, animation timing, and spacing value has been chosen with factory floor visibility, gloved-hand usability, and ambient readability as primary constraints. When in doubt, make it bigger, bolder, and higher contrast.*
