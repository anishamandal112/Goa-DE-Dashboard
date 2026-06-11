# Smart Meters & Data Health Page — Design Spec

**Date:** 2026-06-11  
**Status:** Approved  
**Dashboard:** Goa Electricity Department Executive Dashboard (GOA_ED3)

---

## Context

The dashboard currently has three navigation tabs. Executive Overview and Energy & Loss Analysis are complete. Smart Meters & Data Health renders a "Coming Soon" placeholder. This spec defines what replaces that placeholder.

The page targets senior leadership who need a single view of the RDSS modernisation programme: how many meters have been deployed, whether DT communication infrastructure is working, whether data quality is sufficient for accurate energy accounting, and which areas need immediate intervention.

---

## Design Constraints

- **File:** All code goes into `src/App.jsx` (monolithic pattern, no separate component files)
- **Styling:** Pure inline CSS-in-JS (`style={{}}` objects), no Tailwind, no CSS modules
- **Charts:** Recharts only (`BarChart`, `ComposedChart`, `PieChart`, `ResponsiveContainer`)
- **Icons:** Existing `Ic` object (inline SVG) — extend with `smartMeter`, `signal`, `database`, `shield` variants if needed
- **Theme:** Light mode, same color tokens as rest of dashboard
- **FY Filter:** `selectedFY` prop passed down from root `App`; data read from `YEAR_DATA[selectedFY].smartMeters`
- **Layout:** Same `Card` + `KPICard` + grid pattern as Energy & Loss page

---

## Color Tokens (unchanged)

| Purpose | Hex |
|---------|-----|
| Primary (Deep Blue) | `#1E40AF` |
| Secondary (Electric Blue) | `#0EA5E9` |
| Success | `#059669` |
| Warning | `#D97706` |
| Critical | `#DC2626` |
| Background | `#F8FAFC` |
| Card | `#FFFFFF` |
| Border | `#E5E7EB` |
| Text Primary | `#0F172A` |
| Text Secondary | `#64748B` |

---

## Data Model

A `smartMeters` key is added to every year entry in `YEAR_DATA`. Structure per year:

```js
smartMeters: {
  rollout: {
    consumerMeters: { installed: Number, target: 741160 },
    dtMeters:       { installed: Number, target: 8369 },
    feederMeters:   { installed: Number, target: 827 },
  },
  communication: {
    totalDTs:          8636,      // constant (physical infrastructure)
    communicableDTs:   Number,    // meters installed with comms capability
    activeDTs:         Number,    // successfully reporting
    communicationRate: Number,    // activeDTs / totalDTs * 100
  },
  dataQuality: {
    consumerTagging:  Number,     // % consumers tagged to a DT
    dataAvailability: Number,     // % expected data points received
    dataFreshness:    Number,     // % readings within 24h
    meterReporting:   Number,     // % meters reporting successfully
    networkVisibility:Number,     // % feeders with full metering coverage
  },
  divisions: [
    // 18 entries, one per division
    {
      name:            String,
      commRate:        Number,    // DT communication rate %
      taggingCoverage: Number,    // consumer tagging %
      dataScore:       Number,    // composite 0–100
    }
  ],
  modernization: [
    // 6 RDSS milestones
    {
      name:          String,
      status:        'complete' | 'in-progress' | 'pending',
      completionPct: Number,    // 0–100
      year:          String,    // e.g. 'FY 2021-22'
    }
  ],
  alerts: [
    { severity: 'high'|'medium'|'low', title: String, metric: String, detail: String }
  ],
  insights: [
    { icon: String, title: String, desc: String }
  ],
}
```

### FY Progression (synthetic, anchored to FY 2022-23 audit values)

| FY | Consumer Meters | DT Communicable | DT Active | Comm Rate |
|----|----------------|----------------|-----------|-----------|
| 2018-19 | 0 | 0 | 0 | 0% |
| 2019-20 | 0 | 420 | 90 | 1.0% |
| 2020-21 | 0 | 1,100 | 310 | 3.6% |
| 2021-22 | 0 | 2,200 | 720 | 8.3% |
| **2022-23** | **0** | **3,473** | **1,164** | **13.5%** |
| 2023-24 | 18,500 | 5,100 | 2,340 | 27.1% |
| 2024-25 | 74,200 | 6,800 | 4,250 | 49.2% |

Data quality scores improve proportionally. Division data is synthetic but consistent with overall rates.

---

## Page Layout

Single scrollable view. Identical outer shell to Energy & Loss page: `TopBar` → scrollable content → `Footer`.

```
┌─────────────────────────────────────────────────────┐
│  [KPI Strip — 5 cards]                              │
├───────────────────────────────┬─────────────────────┤
│  Communication Health (60%)   │  Rollout Progress   │
│  (funnel bar chart + stats)   │  (3 progress bars)  │
├─────────────────────────────┬─┴─────────────────────┤
│  Data Quality Dashboard(55%)│  Division Health (45%)│
│  (5 metric bars + score)    │  (ranked 18 divisions)│
├──────────────────┬───────────┴────────┬─────────────┤
│  Modernization   │  Attention Req'd   │  Insights   │
│  Progress (RDSS) │  (alerts panel)    │  (3 cards)  │
└──────────────────┴────────────────────┴─────────────┘
```

---

## Component Breakdown

### `SmartMetersPage` (new top-level component)

Props: `yearData`, `kpi` (top-level KPIs), `selectedFY`, `prevYearData`

Renders the five rows described below. Follows the `EnergyLossPage` component pattern.

---

### Row 0 — KPI Strip

5 `KPICard` instances in a `display: grid; gridTemplateColumns: repeat(5, 1fr)` wrapper.

| Slot | Title | Value Source | Status Logic |
|------|-------|-------------|--------------|
| 1 | DT Communication Rate | `sm.communication.communicationRate` | <20% Critical, <50% Warning, ≥50% Good |
| 2 | Consumer Meter Target | `sm.rollout.consumerMeters.installed / target * 100` | 0% Critical, <50% Warning |
| 3 | DT Meter Rollout | `sm.rollout.dtMeters.installed / target * 100` | <40% Warning, ≥80% Good |
| 4 | Feeder Coverage | `sm.rollout.feederMeters.installed / target * 100` | same as DT |
| 5 | Data Availability | `sm.dataQuality.dataAvailability` | <70% Critical, <85% Warning |

Trend arrows compare current FY vs. previous FY using existing `pctTrend()` helper.

---

### Row 1 — Communication Health + Rollout Progress

**`DTCommunicationCard`** (left, ~60% width)

- Header: "DT Communication Health" with network icon
- Recharts `BarChart` (layout="vertical", 3 bars):
  - Total DTs: 8,636 (grey `#94A3B8`)
  - Communicable DTs: value (blue `#0EA5E9`)
  - Active Communicating: value (green `#059669`)
- Below chart: three stat tiles in a row (count + % of total) with matching color dots
- Custom tooltip showing absolute value and % of total

**`RolloutProgressCard`** (right, ~40% width)

- Header: "Smart Meter Rollout" with target badge ("RDSS Target")
- Three stacked sections (Consumer / DT Meters / Feeder Meters):
  - Label row: name on left, "X / Y (Z%)" on right
  - Progress bar: filled portion uses status color, background `#F1F5F9`
  - Bar height: 8px, border-radius 999px (pill shape)
  - Small status badge below each bar
- Same style as `NetworkAndDataHealth` progress bars

---

### Row 2 — Data Quality Dashboard + Division Health

**`DataQualityCard`** (left, ~55% width)

- Header shows composite **Data Health Score** (0–100, weighted average of 5 metrics) as a large number with color-coded badge
- 5 horizontal metric rows:
  1. Consumer Tagging Coverage
  2. Data Availability
  3. Data Freshness
  4. Meter Reporting Success
  5. Network Visibility Score
- Each row: label (left), color-filled bar (center, same pill style), % value + status badge (right)
- Color fill: `#DC2626` (<60%), `#D97706` (<80%), `#059669` (≥80%)

**`DivisionDataHealthCard`** (right, ~45% width)

- Header: "Division-wise Data Health" with rank count badge
- Scrollable list (max-height ~320px, overflow-y auto) of 18 division rows
- Each row:
  - Rank number badge (small circle, grey)
  - Division name (bold)
  - Three metric chips: comm rate / tagging / score (pill badges with value)
  - Status dot (right-aligned, color-coded)
- Top division gets green "Best" badge; bottom gets red "Action Needed" badge
- Rows sorted desc by `dataScore`

---

### Row 3 — Modernization + Attention + Insights

**`ModernizationCard`** (left ~33%)

- Header: "RDSS Modernization Progress"
- Vertical milestone timeline (6 items):
  1. Baseline Survey & Indexing
  2. Consumer-DT Tagging
  3. DT Metering Phase 1
  4. Feeder Separation Works
  5. Smart Meter Pilot (Urban)
  6. AMI Full Rollout
- Each milestone: status icon (✓ green / ⟳ blue / ○ grey), name, year label, progress bar
- Connecting vertical line between milestones (border-left dashed `#E5E7EB`)

**`SmartMetersAttentionPanel`** (center ~33%)

- Reuses `AttentionPanel` component directly, passing `yearData.smartMeters.alerts`
- Same severity-coded card pattern (red/orange/blue borders)
- 4–6 alerts per FY

**`SmartMetersInsightsPanel`** (right ~33%)

- Reuses `KeyInsights` component, passing `yearData.smartMeters.insights`
- 3 insight cards stacked vertically (not the 5-column grid — narrower context)
- Same icon badge + title + desc pattern

---

## Synthetic Data Values (FY 2022-23 — anchored)

### Communication
- Total DTs: 8,636 | Communicable: 3,473 | Active: 1,164 | Rate: 13.5%

### Data Quality
- Consumer Tagging: 61% | Data Availability: 68% | Data Freshness: 72% | Meter Reporting: 58% | Network Visibility: 44%
- Composite Data Health Score: 61/100

### Rollout
- Consumer Meters: 0 / 741,160 (0%) | DT Meters: 3,473 / 8,369 (41.5%) | Feeder Meters: 0 / 827 (0%)

### RDSS Milestones (as of FY 2022-23)
1. Baseline Survey — Complete (100%)
2. Consumer-DT Tagging — In Progress (61%)
3. DT Metering Phase 1 — In Progress (41%)
4. Feeder Separation — In Progress (28%)
5. Smart Meter Pilot — Pending (0%)
6. AMI Full Rollout — Pending (0%)

### Alerts (FY 2022-23)
- HIGH: DT Communication Below Threshold — 13.5% active rate (target: 90%)
- HIGH: Consumer-DT Tagging Incomplete — 39% of consumers untagged
- MEDIUM: Feeder Visibility Gap — 56% of feeders lack full metering
- MEDIUM: Meter Reporting Rate Low — 42% of meters not reporting
- LOW: Smart Meter Pilot Not Yet Started — 0 consumer meters deployed
- LOW: Data Freshness Below Target — 28% readings older than 24h

### Insights (FY 2022-23)
1. Communication infrastructure exists but activation lags — 3,473 DTs have meters but only 1,164 actively communicate; network/SIM provisioning is the bottleneck.
2. Consumer tagging is the critical data quality dependency — until 95%+ consumers are mapped to DTs, feeder-level loss calculation will remain unreliable.
3. RDSS Phase 1 groundwork is in place — baseline survey and partial DT metering create the foundation; consumer meter rollout is the next acceleration trigger.

---

## Verification

1. Run `npm run dev` and navigate to the Smart Meters tab — page renders without errors
2. Switch FY via the top filter — all 5 KPI cards, both Row 1 charts, all Row 2 metrics, and Row 3 content update
3. FY 2022-23 KPI cards show: 13.5% comm rate (Critical/Warning), 0% consumer meters (Critical), 41.5% DT meters (Warning), 0% feeder (Critical), 68% data availability (Warning)
4. Division list shows 18 rows sorted by data score; top row has "Best" badge, bottom has "Action Needed"
5. RDSS timeline shows 1 complete, 3 in-progress, 2 pending milestones for FY 2022-23
6. FY 2024-25 shows meaningfully higher rollout numbers (74,200 consumer meters, 49.2% comm rate)
7. Attention Required and Insights panels show correct FY-specific content
8. Page is visually consistent with Executive Overview and Energy & Loss pages (same fonts, spacing, card shadows)
