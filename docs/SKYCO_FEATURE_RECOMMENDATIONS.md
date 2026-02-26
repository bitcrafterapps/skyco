# Skyco App Feature Recommendations

## Implementation Checklist (Value-Graded)

| Implement | Feature | Value Grade |
|---|---|---|
| [ ] | Install Scheduling and Field Execution | A+ |
| [ ] | Material Readiness Gate | A+ |
| [ ] | At-Risk Order Engine | A |
| [ ] | Capacity and Bottleneck Planning | A |
| [ ] | Role-Based Access Control (RBAC) | A |
| [ ] | Structured Quality Loop | B+ |

## Context

The app is already solid for factory floor visibility: station tracking, order movement, real-time updates, imports, and basic reports.

For Skyco (automated blinds manufacturer + installer), the highest business value now comes from closing the gap between production and installation outcomes.

## Most Important Current Gaps

1. No install lifecycle tracking after production
2. No material readiness gate before release to production
3. No at-risk order detection tied to promised dates
4. No station capacity planning for tomorrow/this week
5. No role-based access and action permissions
6. Limited structured quality analytics (root cause trends)

## Value-Driven Features To Add (Priority Order)

### 1) Install Scheduling and Field Execution

- Why this matters: Revenue is only fully realized when installation is complete and accepted.
- MVP:
  - Install-ready queue from final production
  - Assign install window, crew, and truck
  - Track states: scheduled, dispatched, installed, callback, closed
  - Capture install notes/photos/punch list
- Expected value: Fewer missed installs, fewer callbacks, better customer experience.

### 2) Material Readiness Gate

- Why this matters: Missing motors/fabric/brackets create stop-start work and WIP waste.
- MVP:
  - Track required components per order
  - Prevent advancing orders when critical components are unavailable
  - Show shortage reason and expected availability date
- Expected value: Lower rework and less line disruption.

### 3) At-Risk Order Engine

- Why this matters: Teams need proactive warnings before due dates are missed.
- MVP:
  - Risk score from ship date proximity, hold time, missing flags, and station dwell time
  - Dedicated "At Risk" board and alert list
  - Owner assignment for escalation
- Expected value: Better on-time delivery and clearer daily priorities.

### 4) Capacity and Bottleneck Planning

- Why this matters: Throughput issues are predictable if planned load exceeds staffed hours.
- MVP:
  - Planned hours per station (next 1-5 days)
  - Capacity vs demand view by station
  - Suggested load balancing between stations/shifts
- Expected value: Higher throughput with fewer surprises.

### 5) Role-Based Access Control (RBAC)

- Why this matters: Operational data integrity requires controlled edit power.
- MVP:
  - Roles: operator, lead, scheduler, admin
  - Limit station actions vs admin actions
  - Require user identity on critical changes
- Expected value: Fewer accidental edits and stronger accountability.

### 6) Structured Quality Loop

- Why this matters: Hold/missing flags alone do not drive root-cause elimination.
- MVP:
  - Standardized issue codes (supplier defect, fabrication error, measurement issue, install damage, etc.)
  - First-pass yield and repeat-defect reporting
  - Weekly top-loss Pareto
- Expected value: Lower defect recurrence and measurable quality gains.

## Improvements To Existing Functionality

1. Improve reporting from descriptive to decision-grade:
   - Add aging by station and due-date miss risk trend
   - Add lead-time percentiles (not just counts)

2. Improve imports:
   - Add import templates with strict column validation
   - Add duplicate handling policy per customer/order revision

3. Improve audit usefulness:
   - Include actor identity consistently
   - Add reason-required for status reversals on completed work

4. Improve notes:
   - Split internal production notes vs installer/customer-facing notes
   - Add searchable tags

## Suggested Implementation Phases

- Phase 1 (highest ROI): install scheduling, at-risk engine, RBAC baseline
- Phase 2: material readiness gate, structured quality codes
- Phase 3: capacity planning and deeper predictive reporting

