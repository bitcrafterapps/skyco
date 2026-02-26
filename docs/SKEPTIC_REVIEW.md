# Skeptic Review: Station Tracker System

**Reviewer:** Quality Reviewer / Skeptic
**Date:** 2026-02-15
**Project State:** Scaffolded (Next.js boilerplate + spec + DB schema + types only)
**Verdict:** The spec is a reasonable starting point, but there are significant gaps that will cause real problems on the factory floor if not addressed before and during implementation.

---

## Executive Summary

This project aims to replace a Google Sheets workflow with a touchscreen-optimized web app for tracking manufacturing orders across 7 production stations. The tech stack is Next.js 14+ with SQLite and SSE/polling. As of this review, the project consists of an unmodified `create-next-app` scaffold with a PROJECT_SPEC, a database schema (`src/lib/db.ts`), and TypeScript type definitions (`src/lib/types.ts`). No routes, API endpoints, UI components, or business logic have been implemented.

The spec captures the basics but leaves critical operational questions unanswered. The choices made so far are mostly defensible for a small factory deployment, but several will need explicit mitigation strategies to avoid production failures.

---

## 1. Architecture Gaps

### 1.1 SQLite Concurrency Model
**Severity: MEDIUM**

SQLite with WAL mode (correctly enabled in `db.ts` line 15) supports concurrent reads and a single writer. For 7 stations plus an admin panel, this is likely adequate -- the write volume is low (status taps, maybe a few per minute per station). However:

- **The real risk is not throughput but connection management.** The singleton pattern in `db.ts` stores the connection in a module-level variable (`let db: Database.Database | null = null`). In Next.js with the App Router, server components and API route handlers may run in different contexts. If the Next.js server forks worker processes (which it does in production by default), each worker gets its own connection. With WAL mode, this is fine for reads, but concurrent writes from different workers will cause `SQLITE_BUSY` errors.
- **Recommendation:** Add a `busy_timeout` pragma (e.g., `db.pragma("busy_timeout = 5000")`) so writes wait up to 5 seconds instead of failing immediately. This is a one-line fix that prevents the most common SQLite concurrency failure mode. This is not currently in the code.
- **Recommendation:** Consider whether Next.js production mode will spawn multiple workers and test accordingly.

### 1.2 SSE vs WebSockets vs Polling
**Severity: MEDIUM**

The spec says "Server-Sent Events (SSE) or polling for live updates" but makes no firm decision. This matters:

- **SSE is one-directional** (server to client). It is simpler than WebSockets and works well for this use case since the client only needs to receive order updates, not stream data back. Status changes go through normal HTTP POST calls anyway.
- **Factory WiFi is the real concern.** SSE connections stay open indefinitely. If WiFi drops (which it will -- metal buildings, machinery interference, concrete walls), the browser needs to reconnect. The `EventSource` API has built-in reconnection, which is good. But there is no spec for what happens during disconnection: does the station show stale data? Is there a visible "disconnected" indicator?
- **Polling is simpler and more resilient.** A 5-second polling interval means at most 5 seconds of stale data, and it naturally handles reconnection. At 7 stations, 5-second polling = 84 requests/minute. This is trivial for a local network server.
- **Recommendation:** Start with polling. It is simpler, more debuggable, and factory WiFi makes persistent connections unreliable. Add a visible connection-status indicator (green dot / red dot) on every station screen. If polling proves too laggy, upgrade to SSE later.

### 1.3 Server Failure / Offline Capability
**Severity: HIGH**

There is zero mention of what happens when the server goes down. In a factory, this means production stops or reverts to paper/memory.

- The application is entirely server-dependent. There is no service worker, no local storage fallback, no offline mode.
- If the Node.js process crashes, all 7 stations simultaneously show errors or blank screens.
- There is no health check endpoint specified.
- There is no process manager (pm2, systemd) mentioned for auto-restart.
- **Recommendation:** At minimum: (a) Use pm2 or systemd to auto-restart the Node.js process. (b) Add a `/api/health` endpoint. (c) On the client, display the last-known data with a prominent "DISCONNECTED - data may be stale" banner when the server is unreachable, rather than showing a blank screen or error. (d) Consider a brief localStorage cache of the current station's order list so the screen stays populated during short outages.

### 1.4 Data Backup
**Severity: HIGH**

The database is a single file (`station-tracker.db` in the project root). The `.gitignore` correctly excludes `*.db`, but there is no backup strategy.

- SQLite WAL mode complicates backups -- you cannot just `cp` the `.db` file while the server is running; you also need the `-wal` and `-shm` files.
- A cron job using `sqlite3 station-tracker.db ".backup backup.db"` is the correct approach. This is not mentioned anywhere.
- Where do backups go? A USB drive? Network share? Cloud?
- **Recommendation:** Add a backup script that runs every hour via cron, using SQLite's `.backup` command. Keep at least 7 days of hourly backups. Store on a separate physical device or network location. Document the restore procedure.

### 1.5 Database File Location
**Severity: MEDIUM**

The DB path is `path.join(process.cwd(), "station-tracker.db")` (line 4 of `db.ts`). This ties the database location to whichever directory the process starts from. If someone runs `npm start` from a different directory, or if a process manager changes the working directory, the app creates a new empty database.

- **Recommendation:** Use an environment variable (`DATABASE_PATH`) with a fallback to a fixed absolute path (e.g., `/var/data/station-tracker/station-tracker.db`), not `process.cwd()`.

---

## 2. UX / Touchscreen Concerns

### 2.1 Touch Target Sizes
**Severity: HIGH**

The spec says "large tap targets" and "touch-friendly" but specifies no minimum sizes. WCAG 2.5.5 (Enhanced) recommends 44x44 CSS pixels minimum. For factory use with gloves:

- Workers often wear nitrile gloves, leather gloves, or have dirty/wet hands.
- Standard capacitive touchscreens do not respond to most work gloves.
- **Minimum recommended touch target: 64x64 pixels** for gloved or rough-handed use.
- The DONE/HOLD/MISSING columns need to be entire cell-sized tap targets, not small checkboxes or icons.
- **Recommendation:** Specify minimum touch target sizes in the spec (64px minimum). Ensure the touchscreen hardware is glove-compatible or that workers are expected to use bare hands. Test with actual gloves on actual hardware before deployment.

### 2.2 Accidental Tap Prevention
**Severity: HIGH**

The spec says "Tap to toggle DONE/HOLD/MISSING per order per station." A single tap toggling production status is extremely dangerous in a factory environment.

- Leaning on the screen, cleaning the screen, bumping it while walking by -- all trigger accidental taps.
- If someone accidentally marks an order DONE, it "auto-removes after a configurable delay" per the spec. If the delay is 30 seconds and nobody notices, the order disappears from the station view.
- There is no undo mechanism mentioned.
- There is no confirmation dialog mentioned.
- **Recommendation:** For DONE status: require a tap followed by a 5-second "undo" period with a prominent UNDO button before the status commits. For HOLD and MISSING: a simple confirmation ("Mark order 199544 as HOLD?") is appropriate. Never auto-remove an order without giving a window to reverse the action.

### 2.3 Undo / Error Recovery
**Severity: HIGH**

Related to 2.2 but broader. The spec has no undo mechanism for any action.

- If an order is accidentally marked DONE and auto-dismissed, how does a station operator get it back?
- Does it appear at the next station? What if the next station was not expecting it?
- Is there an admin function to reverse a status change?
- **Recommendation:** (a) Keep completed orders visible with an "UNDO" button for at least 30-60 seconds. (b) Provide an admin panel function to move orders back to any station. (c) Log all status changes with timestamps so mistakes can be traced.

### 2.4 Screen Readability
**Severity: MEDIUM**

The spec says "dark background, high contrast, large text" which is correct for factory environments. However:

- The current `globals.css` uses `--background: #0a0a0a` for dark mode, which is near-black. Pure dark backgrounds can cause halation (glowing text effect) under bright factory lighting.
- What font size is "large"? For a 10-foot viewing distance (common in factories), text needs to be at least 24-32px. For arm's-length touchscreen use, 18-20px minimum for body text, 28px+ for order numbers.
- The spec does not mention screen orientation (landscape vs portrait) or resolution.
- What about color blindness? Red (HOLD) and green (DONE) are the classic problem pair for red-green color blindness, which affects ~8% of males. The system relies entirely on these colors.
- **Recommendation:** (a) Use a dark gray background (#1a1a1a to #222222) rather than near-black. (b) Specify minimum font sizes: 28px for order numbers, 20px for supporting text. (c) Add text labels or icons alongside colors: green cells should also say "DONE", red cells "HOLD", orange cells "MISSING" -- do not rely on color alone. (d) Specify screen hardware requirements (size, resolution, brightness in nits).

### 2.5 Dirty/Wet Screen Handling
**Severity: LOW**

This is mostly a hardware concern, but the software can help:

- Capacitive touchscreens can register false inputs from water droplets.
- The UI should have generous spacing between interactive elements to reduce accidental activation from adjacent water/dirt.
- **Recommendation:** Ensure minimum 16px spacing between all interactive elements. Consider a "lock screen" gesture (e.g., long-press to unlock) if false touches from water become a problem in practice.

---

## 3. Data Flow Gaps

### 3.1 Data Ingestion -- How Do Orders Enter the System?
**Severity: CRITICAL**

This is the single biggest gap in the entire spec. The system tracks orders, but:

- How do orders get INTO the database? The spec mentions an "Admin panel for managing orders, importing data" and that is it.
- The existing workflow uses Google Sheets. Is there an import from Google Sheets? CSV upload? Manual entry one-by-one?
- If orders are entered manually, who does it? How many orders per day? What is the error rate?
- Is there an upstream ERP or order management system? The production sheet statuses (Sale Order, Production Order, Approved for Production, Production Order Printed, Production Label, Invoiced) suggest there is a system upstream that generates these statuses. How does this system integrate with it?
- If there is no integration, someone has to manually enter every order and keep statuses in sync between two systems. That person becomes a bottleneck and a single point of failure.
- **Recommendation:** Before writing any more code, document the exact data flow: Where do orders originate? How do they enter this system? Is there an API to pull from? A CSV export from the existing system? Define the import mechanism and frequency (real-time API sync vs daily CSV upload vs manual entry). This decision shapes the entire architecture.

### 3.2 Order Station Advancement
**Severity: HIGH**

The spec is ambiguous about how orders move between stations:

- When a station marks an order DONE, does it automatically appear at the next station? The `current_station` field on the `orders` table suggests orders have a single current station, and `order_station_status` tracks per-station completion.
- But the STATIONS array defines a fixed flow: basket -> fabric_cut -> extrusions -> welding -> assembly -> packing -> will_call. Not all orders go through all stations. The spec mentions "Roller Shade" and "Exterior" departments -- do these have different station sequences?
- What triggers an order appearing at a station? Is it (a) when the previous station marks it DONE, (b) when `current_station` is manually updated, or (c) when it has the right `status` value?
- The `current_station` field on the order seems redundant with the `order_station_status` table. If station A marks an order done, does `current_station` auto-advance to station B? Who/what updates it?
- **Recommendation:** Define explicit station advancement rules. Document whether it is automatic (marking DONE at station N advances to station N+1) or manual (admin moves orders between stations). Define per-department station sequences if they differ.

### 3.3 Upstream Data Changes
**Severity: MEDIUM**

What happens when order data changes in the upstream system (the original Google Sheets or ERP)?

- If a customer name changes, a ship date moves, or a sale amount is corrected upstream, how does that propagate?
- If this system is the source of truth for station status but not for order metadata, there needs to be a sync mechanism that updates metadata without overwriting station status changes.
- **Recommendation:** Define which fields are "owned" by this system (station statuses, done/hold/missing) vs which are read from upstream (customer name, ship date, sale amount, etc.). Build a sync mechanism for upstream-owned fields that does not clobber locally-owned fields.

### 3.4 Audit Logging
**Severity: HIGH**

There is no audit trail in the current schema.

- The `order_station_status` table has a `done_at` timestamp, which is good. But there is no record of who made the change, and no history of state transitions (e.g., if someone toggles HOLD on and then off, the off-state leaves no trace).
- In a manufacturing environment, audit trails are often required for quality control, dispute resolution ("who marked this DONE when it wasn't?"), and process improvement.
- The `orders` table has `updated_at` but no change history.
- **Recommendation:** Add an `audit_log` table: `(id, order_id, station, field_changed, old_value, new_value, changed_at, changed_by)`. Even without authentication, `changed_by` could be the station name (since each station is a dedicated touchscreen). This is cheap storage and invaluable for debugging production issues.

### 3.5 "Already Counted" and Other Sheet Statuses
**Severity: MEDIUM**

The production sheet reference includes an "Already Counted" status that does not appear in the `ORDER_STATUSES` enum in `types.ts`. The enum also lists 18 statuses but the spec lists 21 numbered items (with some duplicates like two "Full Packed" entries at codes 70 and 71, and "Complete" at both 3 and 96).

- Status code 96 "Complete" is different from status 3 "Complete" -- one is production complete, the other is probably order-lifecycle complete. The current enum has a single `complete` value.
- The numeric codes from the sheet (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21, 30, 40, 45, 70, 71, 80, 90, 95, 96) are not captured anywhere in the data model. If the upstream system uses these codes, there is no mapping.
- **Recommendation:** (a) Add the numeric status codes to the data model for upstream compatibility. (b) Clarify the difference between status 3 "Complete" and status 96 "Complete". (c) Determine if "Already Counted" and any other sheet-specific statuses need representation. (d) Create an explicit mapping table between upstream status codes and internal status enums.

---

## 4. Missing Features from the Google Sheet

### 4.1 Order Detail Visibility
**Severity: MEDIUM**

The production sheet shows: Ship Date, Sale Amount, Notes, Target, Sidemark, Department, Customer Name. The station view spec only shows ORDER#, DONE, HOLD, MISSING.

- Where do operators see the other fields? Sometimes a packer needs to know the customer name or ship date to prioritize. Sometimes assembly needs to see the sidemark to identify the physical product.
- The data model includes all these fields, but the station view spec does not show them.
- **Recommendation:** Add a "tap to expand" detail view on the station screen. Tapping an order number should show a slide-out or modal with all order details. The default list view should show ORDER# and optionally 1-2 key fields (customer name, ship date) as secondary text.

### 4.2 Shipping Information
**Severity: MEDIUM**

The reference sheet tracks shipping details: "Ship Friday", "RUSH" labels, carrier information. The current data model has `ship_date` and `is_rush` but:

- There is no field for shipping carrier or shipping method.
- "Ship Friday" seems to be a recurring pattern (consolidated weekly shipments?) that is not captured.
- RUSH orders are flagged but there is no visual distinction in the spec beyond "rushes at top." RUSH labels in the sheet are prominently highlighted -- the station view needs equally prominent visual treatment.
- **Recommendation:** (a) Add `ship_method` or `ship_carrier` field if needed. (b) Ensure RUSH orders have a visually distinctive treatment (red border, flashing indicator, "RUSH" badge) beyond just sort order. (c) Clarify what "Ship Friday" means operationally and whether it needs a dedicated field or is derived from ship_date.

### 4.3 Department-Specific Station Views
**Severity: HIGH**

The spec mentions departments "Roller Shade" and "Exterior" but does not explain how departments affect station views.

- Do all departments flow through all 7 stations? Probably not -- "Exterior" products likely skip "Fabric Cut."
- Should a station only see orders for departments it handles? If the Welding station only welds Exterior products, showing Roller Shade orders there is confusing.
- The `department` field exists on orders but there is no station-to-department mapping.
- **Recommendation:** Define which stations apply to which departments. Add a station configuration that filters orders by department. This may require a `station_departments` mapping table or configuration.

---

## 5. Security and Reliability Concerns

### 5.1 No Authentication
**Severity: HIGH**

There is zero authentication in the spec or codebase. Anyone on the factory network can:

- Access any station view
- Change any order status
- Access the admin panel
- Delete orders (if admin allows it)
- Import/overwrite data

In a factory, this means a visitor, a delivery driver on the WiFi, or a disgruntled employee can modify production data.

- **Recommendation:** At minimum, implement: (a) PIN-based access for the admin panel (a simple 4-6 digit PIN stored as an environment variable). (b) Station views can remain unauthenticated since they are dedicated kiosk devices. (c) API endpoints for destructive operations (delete, bulk import) should require the admin PIN. (d) Rate-limit status change endpoints to prevent abuse.

### 5.2 No Role-Based Access
**Severity: MEDIUM**

Related to 5.1. Even with basic auth, there is no distinction between:

- Station operator (can toggle DONE/HOLD/MISSING for their station only)
- Supervisor (can see all stations, move orders between stations)
- Admin (can import data, configure stations, delete orders)

For an initial deployment this may be acceptable, but it should be on the roadmap.

- **Recommendation:** For v1, at minimum restrict the admin panel. For v2, consider simple role-based access. Station touchscreens could be "locked" to their station via a URL parameter or local config.

### 5.3 Concurrent Modification
**Severity: MEDIUM**

What if two people tap the same order at the same time on different stations (or the same station on two browsers)?

- The toggle operation (read current state, flip it, write back) is a classic race condition.
- With SQLite WAL mode, one write will succeed and the other will either wait (with busy_timeout) or fail (without it).
- But even with serialized writes, toggling is inherently racy: both read "done=0", both write "done=1" -- the result is correct by luck. If both read "done=1" and write "done=0", you get an accidental un-done.
- **Recommendation:** Use atomic SQL updates (`UPDATE ... SET done = 1 WHERE done = 0 AND ...`) rather than read-toggle-write patterns. Return the actual new state to the client. The UI should show the server-confirmed state, not an optimistic toggle.

### 5.4 Data Deletion Protection
**Severity: MEDIUM**

The schema uses `ON DELETE CASCADE` for order-station-status records. If an order is deleted from the `orders` table, all station status history is silently deleted.

- There is no soft-delete mechanism.
- There is no confirmation workflow for deletions.
- **Recommendation:** Add an `archived` or `deleted_at` column to orders for soft deletion. Never hard-delete orders. Admin "delete" should set `deleted_at` and hide from views. Keep hard delete as a separate database maintenance operation.

---

## 6. Performance Concerns

### 6.1 Order Volume
**Severity: MEDIUM**

The spec does not mention expected order volumes. The performance characteristics differ vastly between:

- 10 active orders per station (trivial)
- 50 active orders per station (needs pagination or virtual scrolling)
- 200 active orders per station (needs major UI and query optimization)

For a single-factory operation, 20-50 active orders per station seems likely, but this should be confirmed.

- **Recommendation:** Get the actual number of active orders per station from current Google Sheets usage. Design the UI for that number plus 2x headroom. If over 50, implement virtual scrolling. If over 100, implement server-side pagination.

### 6.2 Polling/SSE Load
**Severity: LOW**

With polling at 5-second intervals across 7 stations plus an admin dashboard = ~96 requests/minute. Each request queries SQLite for a station's orders (maybe 20-50 rows with a JOIN). This is negligible for SQLite -- it can handle thousands of queries per second.

With SSE, 8 persistent connections is also trivial for Node.js.

- **This is not a real concern for this scale.** The system would need to grow to hundreds of clients before this matters.
- **Recommendation:** No action needed for v1. Monitor server CPU and memory after deployment as a baseline.

### 6.3 Memory and Resource Usage
**Severity: LOW**

Next.js SSR with a SQLite database is lightweight. Expected memory usage: 100-300MB for the Node.js process. This is fine for any modern machine.

The bigger concern is that Next.js is a relatively heavy framework for what is essentially a CRUD app with 7 views. A simpler framework (Express + HTMX, or even plain static HTML with API calls) would be lighter and have fewer moving parts to break. However, Next.js is a defensible choice for developer productivity and the ecosystem.

- **Recommendation:** No action needed, but monitor memory usage in production to establish a baseline.

---

## 7. Deployment and Operations

### 7.1 Deployment Strategy
**Severity: CRITICAL**

There is no deployment plan. This is a factory-floor system, not a cloud SaaS. Key questions:

- **Where does the server run?** A local machine on the factory network? A Raspberry Pi? A cloud VM?
- If local: What hardware? Who provisions it? What happens when it fails? Is there a spare?
- If cloud: What about latency? Is the factory's internet reliable enough for production-critical use? What about internet outages?
- The spec and README mention Vercel deployment, which is absurd for a factory floor system using a local SQLite database. Vercel serverless functions cannot use a persistent SQLite file.
- **Recommendation:** Deploy on a local machine on the factory network. Specify the hardware (a mini PC like an Intel NUC or Mac Mini is sufficient). Use a process manager (pm2 or systemd) with auto-restart. Document the full deployment procedure. Have a documented plan for hardware failure (spare machine, restore from backup).

### 7.2 Touchscreen Kiosk Setup
**Severity: HIGH**

7 touchscreens need to be set up and maintained. The spec says nothing about:

- What touchscreen hardware? (Size, resolution, mounting, brightness for factory lighting)
- Kiosk mode configuration (Chrome kiosk mode? Android kiosk app? Dedicated hardware?)
- How to prevent users from navigating away, closing the browser, or accessing other websites?
- How to handle screen lock/sleep? (Factory touchscreens should never sleep)
- How to remotely manage 7 kiosk devices? (Push URL changes, restart browsers, update configurations)
- **Recommendation:** Document the kiosk hardware and software setup. Recommend Chrome in kiosk mode (`--kiosk` flag) on a locked-down OS. Disable screen sleep. Consider a remote management solution for the 7 devices. Specify screen size (minimum 15" recommended for factory use) and brightness (minimum 500 nits for well-lit factory environments).

### 7.3 System Maintenance
**Severity: HIGH**

Who maintains this system after deployment?

- Who restarts it when it crashes? (See 1.3 -- auto-restart helps but is not foolproof)
- Who updates the software? How are updates deployed without disrupting production?
- Who monitors for errors? Is there logging? Alerting?
- What happens when the database grows? Is there a data retention policy? Archival?
- Who is the on-call person when the system is down during production hours?
- **Recommendation:** (a) Set up structured logging (at minimum, log to a file with rotation). (b) Create a simple monitoring script that pings `/api/health` and sends an alert (email, SMS, Slack) if it fails. (c) Document a maintenance runbook: how to restart, how to backup, how to restore, how to update. (d) Define a data retention policy (archive orders older than X months).

### 7.4 Database Corruption Recovery
**Severity: HIGH**

SQLite databases can become corrupted from:

- Power loss during a write (common in factories with unreliable power)
- Disk full conditions
- Hardware failure
- Software bugs

WAL mode reduces but does not eliminate corruption risk.

- **Recommendation:** (a) Use a UPS (uninterruptible power supply) for the server machine. (b) Run `PRAGMA integrity_check` as part of the backup script. (c) Document the recovery procedure: stop server, restore from latest backup, restart. (d) Keep at least 3 recent backups in case the latest is also corrupted. (e) Consider enabling `PRAGMA synchronous = FULL` for maximum durability at the cost of slight write performance (irrelevant at this scale).

---

## 8. Implementation Gaps (Current Code State)

### 8.1 No Application Code Exists
**Severity: OBSERVATION**

The project is currently a `create-next-app` scaffold. The home page (`src/app/page.tsx`) is the default Next.js welcome page. None of the specified routes, API endpoints, or UI components exist yet. The only project-specific code is:

- `src/lib/db.ts` -- Database connection and schema initialization (70 lines)
- `src/lib/types.ts` -- TypeScript type definitions (140 lines)

This means every feature in the spec still needs to be built. The review above applies to the spec and architectural decisions, not to implemented code.

### 8.2 Schema Gaps in db.ts
**Severity: MEDIUM**

The schema is reasonable but missing:

- No `audit_log` table (see 3.4)
- No `archived` / `deleted_at` column (see 5.4)
- No `busy_timeout` pragma (see 1.1)
- `done_at` is tracked on `order_station_status` but there is no `hold_at` or `missing_at` -- inconsistent timestamp tracking
- No `changed_by` field anywhere -- even a station identifier would help
- The `status` column on `orders` is a free-text field with no CHECK constraint. Invalid values can be inserted.
- **Recommendation:** Revise the schema before building on top of it. Adding columns later is possible but messier.

### 8.3 Type Safety Gaps in types.ts
**Severity: LOW**

- `is_rush`, `done`, `hold`, `missing` are typed as `number` with comments saying "SQLite boolean (0 or 1)". Consider a utility type or helper function to convert to actual booleans at the boundary.
- The `StationOrder` interface duplicates all fields from `Order` plus `OrderStationStatus`. Consider using intersection types or a pick/omit pattern to reduce maintenance burden.
- The `ORDER_STATUSES` array has `will_call` which collides conceptually with the `will_call` station name. This could cause confusion in code.

---

## 9. Priority Summary

### CRITICAL (Must address before any deployment)
| # | Finding | Section |
|---|---------|---------|
| 1 | **No data ingestion strategy** -- How do orders enter the system? | 3.1 |
| 2 | **No deployment plan** -- Where does the server run? What hardware? | 7.1 |

### HIGH (Must address before production use)
| # | Finding | Section |
|---|---------|---------|
| 3 | No server failure handling or offline resilience | 1.3 |
| 4 | No data backup strategy | 1.4 |
| 5 | No minimum touch target sizes specified | 2.1 |
| 6 | No accidental tap prevention (single tap toggles production status) | 2.2 |
| 7 | No undo mechanism for any action | 2.3 |
| 8 | Order station advancement logic undefined | 3.2 |
| 9 | No audit logging | 3.4 |
| 10 | Department-to-station mapping undefined | 4.3 |
| 11 | No authentication on admin panel | 5.1 |
| 12 | No kiosk setup documentation | 7.2 |
| 13 | No maintenance/operations plan | 7.3 |
| 14 | No database corruption recovery plan | 7.4 |

### MEDIUM (Should address before production use)
| # | Finding | Section |
|---|---------|---------|
| 15 | SQLite busy_timeout not set | 1.1 |
| 16 | SSE vs polling decision not made | 1.2 |
| 17 | DB file location tied to process.cwd() | 1.5 |
| 18 | Color-blindness accessibility (red/green) | 2.4 |
| 19 | Upstream data sync strategy undefined | 3.3 |
| 20 | Status code mapping incomplete/inconsistent | 3.5 |
| 21 | Order detail visibility on station screens | 4.1 |
| 22 | Shipping info fields incomplete | 4.2 |
| 23 | No role-based access control | 5.2 |
| 24 | Race condition on concurrent status toggles | 5.3 |
| 25 | No soft-delete for orders | 5.4 |
| 26 | Order volume expectations not documented | 6.1 |
| 27 | Schema missing several recommended columns | 8.2 |

### LOW (Nice to have, address when convenient)
| # | Finding | Section |
|---|---------|---------|
| 28 | Dirty/wet screen handling | 2.5 |
| 29 | Polling/SSE load (not a real concern at this scale) | 6.2 |
| 30 | Memory usage (not a real concern for this stack) | 6.3 |
| 31 | Type safety improvements in types.ts | 8.3 |

---

## 10. Recommended Immediate Actions

Before writing more application code, these items should be resolved:

1. **Answer the data ingestion question** (3.1). This shapes everything. Talk to the people currently managing the Google Sheets and the upstream order system. Determine: Is there an API? Can we get CSV exports? How often? Who is responsible?

2. **Define the deployment target** (7.1). Buy/designate the server hardware. Decide local vs cloud. If local, get a UPS.

3. **Revise the database schema** (8.2). Add: `busy_timeout` pragma, `audit_log` table, `deleted_at` column on orders, `hold_at`/`missing_at` timestamps on station status, consider a `changed_by` column.

4. **Define station advancement rules** (3.2). Write out: "When station X marks order Y as DONE, the following happens: ___." Cover all 7 stations and both departments.

5. **Specify touch interaction patterns** (2.2, 2.3). Design the tap-confirm-undo flow before building the UI. This affects every component.

6. **Add a backup script and document recovery** (1.4, 7.4).

---

## 11. What the Spec Gets Right

To be fair, the spec makes several good decisions:

- **SQLite is a reasonable choice** for a single-server, low-write-volume factory app. It eliminates an entire class of infrastructure (no PostgreSQL to install/maintain/backup separately).
- **WAL mode is correctly enabled** in the existing code.
- **The data model is sound** at its core -- separate order metadata from per-station status is the right design.
- **Dark theme with high contrast** is correct for factory visibility.
- **Priority ordering (rush first, then date)** matches how factories actually work.
- **The station list and flow** appears to match the real production process.
- **Next.js with TypeScript** is a productive, well-supported stack with good developer tooling.
- **The `better-sqlite3` package** is the correct choice for synchronous SQLite in Node.js (vs the async `sqlite3` package which is more error-prone).

The foundation is defensible. The gaps are in operational planning, edge cases, and the unsexy-but-critical details that determine whether a factory system survives its first week of real use.

---

*End of review. The hard questions are better asked now than answered in a post-mortem.*
