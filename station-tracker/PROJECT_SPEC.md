# Station Tracker - Production Order Management System

## Overview
A touchscreen-optimized web application for tracking manufacturing orders across production stations. Each station displays a prioritized stack of orders with real-time status indicators. Replaces existing Google Sheets workflow.

## Stations (in production flow order)
1. **Basket** - Orders cleared for production, usually in date order aside from rushes
2. **Fabric Cut** - Orders with Fabric Cut done or in process
3. **Extrusions** - Metal Cutting to coordinate with Fabric, Welding, and Packing
4. **Welding** - Orders with Welding done or in process
5. **Assembly** - Orders with Assembly done or in process
6. **Packing** - Orders done but not yet boxed
7. **Will Call** - Orders done but not shipped

## Station View (Touchscreen Display)
Each station shows a table with these columns:
- **ORDER#** - The order number (e.g., 199544, 200004)
- **DONE** - Green indicator when the station's work is complete for this order
- **HOLD** - Red indicator when order is on hold (e.g., credit hold, production hold)
- **MISSING** - Orange indicator when parts are missing

### Behavior
- Orders are displayed as a **priority stack** (rushes at top, then by date)
- When an order is marked DONE (green), it stays visible briefly, then auto-removes after a configurable delay
- New orders bubble up at the bottom of the stack
- Touch-friendly: large tap targets for marking DONE/HOLD/MISSING
- Dark background, high contrast, large text for factory floor visibility

## Data Model (from Production Sheet)
### Order Fields
- `orderNumber` (string) - e.g., "199544"
- `customerName` (string) - e.g., "DESERT WINDOW TREATMENTS"
- `department` (string) - "Roller Shade", "Exterior"
- `currentStation` (enum) - Which station the order is currently at
- `status` (enum) - Producible, Complete, Complete But M/P, Scheduling, etc.
- `isRush` (boolean) - Rush orders get priority
- `shipDate` (date/null)
- `saleAmount` (number)
- `sidemark` (string)
- `notes` (string)
- `target` (string)

### Order Status at Each Station
- `done` (boolean) - Work complete at this station
- `hold` (boolean) - Order on hold
- `holdReason` (string) - Why it's on hold
- `missing` (boolean) - Missing parts/materials
- `missingDetails` (string) - What's missing

### Status Descriptions (from sheet)
1. Producible
2. Missing Parts
3. Complete
4. Complete But M/P (Missing Parts)
5. Scheduling
6. Credit Hold
7. Sch + M/P
8. Tag Team
9. Sale Order
10. Production Order
20. Approved for Production
21. Print Hold
30. Production Order Printed
40. Production Label
45. Will Call
70. Full Packed
71. Full Packed
80. Part Packed
90. Invoiced
95. Invoiced (Balance Due)
96. Complete

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Database**: SQLite via better-sqlite3 (simple, file-based, no server needed)
- **Real-time**: Server-Sent Events (SSE) or polling for live updates

## Pages/Routes
- `/` - Dashboard overview showing all stations at a glance
- `/station/[stationId]` - Individual station touchscreen view
- `/admin` - Admin panel for managing orders, importing data
- `/api/orders` - CRUD API for orders
- `/api/orders/[orderId]/status` - Update order status at a station
- `/api/stations/[stationId]` - Get orders for a specific station

## Key Requirements
1. **Touchscreen-first** - Large buttons, no hover states, tap-friendly
2. **High visibility** - Dark theme, large fonts, color-coded status blocks
3. **Auto-refresh** - Stations auto-update without manual refresh
4. **Priority ordering** - Rush orders always at top, then by ship date
5. **Auto-dismiss** - Completed orders fade out after configurable delay (e.g., 30 seconds)
6. **Simple workflow** - Tap to toggle DONE/HOLD/MISSING per order per station

## Design Priorities (CRITICAL)
These apps run on **touchscreen tablets throughout the warehouse**. The interface must be:

### Simple & Intuitive
- Factory workers wearing gloves need to tap quickly and accurately
- No complex gestures, no multi-step workflows, no small text
- Glanceable: a worker walking past should understand the station status in 1 second
- Minimum touch target: 56-64px (larger than standard 48px to account for gloves)

### Polished & Modern
- This should NOT look like a spreadsheet ported to the web
- Use modern design patterns: rounded corners, subtle shadows, smooth transitions
- Glassmorphism or subtle gradients for depth on the dark theme
- Clean typography hierarchy with proper spacing
- Micro-interactions: satisfying tap feedback, smooth status transitions
- Professional color palette that looks intentional, not garish

### Mobile Responsive
- Must work across tablet sizes: 10" iPad, 12" Surface, 15" industrial touchscreen, 24" mounted display
- Fluid grid that adapts - not just "fits" but looks good at every breakpoint
- Dashboard should reflow from 1-col on small tablets to 3-4 col on large displays
- Station view should maximize screen real estate for the order stack

### Visual Design Language
- Dark mode as primary (factory floor lighting conditions)
- Status colors with enough contrast AND differentiation (colorblind-safe)
- Icons alongside colors (checkmark=done, pause=hold, warning=missing) - never rely on color alone
- Consistent spacing scale, consistent border radius, consistent shadow depth
- Subtle animations that feel responsive, not distracting
