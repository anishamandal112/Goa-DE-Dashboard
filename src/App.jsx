import React, { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const FY_OPTIONS = [
  'FY 2018-19', 'FY 2019-20', 'FY 2020-21', 'FY 2021-22',
  'FY 2022-23', 'FY 2023-24', 'FY 2024-25',
];

const FY_SHORT = {
  'FY 2018-19': 'FY 18-19',
  'FY 2019-20': 'FY 19-20',
  'FY 2020-21': 'FY 20-21',
  'FY 2021-22': 'FY 21-22',
  'FY 2022-23': 'FY 22-23',
  'FY 2023-24': 'FY 23-24',
  'FY 2024-25': 'FY 24-25',
};

// ─────────────────────────────────────────────────────────────────────────────
// BASE DIVISION DATA (FY 2022-23 actuals — used as scaling baseline)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DIVISIONS = [
  { name: 'Ponda X',        loss: 9.0,  confirmed: true  },
  { name: 'Margao XVI',     loss: 9.0,  confirmed: true  },
  { name: 'Calangute XIV',  loss: 8.4,  confirmed: false },
  { name: 'Mapusa XVII',    loss: 8.0,  confirmed: true  },
  { name: 'Mormugao IV',    loss: 7.9,  confirmed: false },
  { name: 'Margao V',       loss: 7.9,  confirmed: false },
  { name: 'Bicholim XI',    loss: 7.8,  confirmed: false },
  { name: 'Mapusa XV',      loss: 7.7,  confirmed: false },
  { name: 'Vasco III',      loss: 7.6,  confirmed: false },
  { name: 'Quepem VIII',    loss: 7.5,  confirmed: false },
  { name: 'South Urban VI', loss: 7.4,  confirmed: false },
  { name: 'Cuncolim XVIII', loss: 7.3,  confirmed: false },
  { name: 'Panaji II',      loss: 7.2,  confirmed: false },
  { name: 'Pernem XIII',    loss: 7.1,  confirmed: false },
  { name: 'Panaji I',       loss: 6.8,  confirmed: false },
  { name: 'Valpoi XII',     loss: 6.4,  confirmed: false },
  { name: 'Sanguem VII',    loss: 6.1,  confirmed: false },
  { name: 'Canacona IX',    loss: 5.9,  confirmed: false },
];

function scaleDivisions(tdLoss, preserveConfirmed = false) {
  const ratio = tdLoss / 7.83;
  return BASE_DIVISIONS
    .map(d => ({
      name: d.name,
      loss: Math.round(d.loss * ratio * 10) / 10,
      confirmed: preserveConfirmed ? d.confirmed : false,
    }))
    .sort((a, b) => b.loss - a.loss);
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART METER DIVISION BASE DATA (FY 2022-23 audit baseline)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_SM_DIVISIONS = [
  { name: 'Panaji I',        commRate: 24.8, tagging: 85 },
  { name: 'Panaji II',       commRate: 23.5, tagging: 82 },
  { name: 'Vasco III',       commRate: 22.1, tagging: 80 },
  { name: 'Calangute XIV',   commRate: 21.4, tagging: 78 },
  { name: 'South Urban VI',  commRate: 20.3, tagging: 76 },
  { name: 'Mapusa XVII',     commRate: 19.1, tagging: 74 },
  { name: 'Ponda X',         commRate: 18.2, tagging: 72 },
  { name: 'Mormugao IV',     commRate: 17.3, tagging: 65 },
  { name: 'Margao XVI',      commRate: 16.8, tagging: 68 },
  { name: 'Mapusa XV',       commRate: 15.6, tagging: 66 },
  { name: 'Margao V',        commRate: 14.2, tagging: 62 },
  { name: 'Cuncolim XVIII',  commRate: 11.2, tagging: 52 },
  { name: 'Bicholim XI',     commRate:  9.8, tagging: 48 },
  { name: 'Quepem VIII',     commRate:  8.4, tagging: 44 },
  { name: 'Pernem XIII',     commRate:  7.6, tagging: 40 },
  { name: 'Valpoi XII',      commRate:  6.3, tagging: 36 },
  { name: 'Sanguem VII',     commRate:  5.1, tagging: 32 },
  { name: 'Canacona IX',     commRate:  4.2, tagging: 28 },
];

function scaleSmDivisions(commRatio, tagRatio) {
  return BASE_SM_DIVISIONS.map(d => {
    const comm  = Math.min(99, Math.round(d.commRate * commRatio * 10) / 10);
    const tag   = Math.min(99, Math.round(d.tagging  * tagRatio));
    const score = Math.min(99, Math.round(comm * 0.5 + tag * 0.5));
    return { name: d.name, commRate: comm, taggingCoverage: tag, dataScore: score };
  }).sort((a, b) => b.dataScore - a.dataScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// YEAR DATA
// ─────────────────────────────────────────────────────────────────────────────

const YEAR_DATA = {
  'FY 2018-19': {
    kpis: { atcLoss: 17.52, tdLoss: 13.46, collEff: 95.30, inputEnergy: 4520, energySales: 3912, energyLoss: 608, outstandingDues: 520 },
    divisions: scaleDivisions(13.46),
    network: { dtMeteredPct: 15.0, dtCommPct: 5.0, dtMeteredCount: 1295, dtCommCount: 432 },
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'State T&D Loss — 13.46% (Severely Above Benchmark)', desc: 'Loss stands at 13.46%, nearly double the national best-practice of 7–8%. Immediate loss audit, DT-level metering, and anti-theft drives required across all divisions.', metric: '13.46%', metricSub: 'T&D Loss' },
      { sev: 'critical', badge: 'Critical', title: 'AT&C Loss — 17.52% (Highest in 7-Year Period)', desc: '17.52% AT&C loss signals substantial commercial and collection losses alongside technical losses. Revenue at significant risk without targeted intervention.', metric: '17.52%', metricSub: 'AT&C Loss' },
      { sev: 'warning',  badge: 'Warning',  title: 'Collection Efficiency — 95.30% (Marginally Below Target)', desc: 'Collections marginally below 95% threshold. Consumer payment drive and dues reconciliation required to restore target performance.', metric: '95.30%', metricSub: 'Coll. Eff.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Deployment — Only 4% Coverage', desc: 'Metering infrastructure at 4% — data-driven loss management not yet feasible. Rollout acceleration is the top priority for FY 2019-20.', metric: '4%', metricSub: 'SM Coverage' },
    ],
    insights: [
      { title: 'AT&C Loss at 17.52% — Highest Recorded', desc: 'FY 2018-19 marks the starting baseline — 17.52% AT&C reflects significant commercial and technical loss challenges across the network.', accentColor: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
      { title: 'T&D Loss at 13.46% — Elevated', desc: '13.46% T&D loss indicates major infrastructure inefficiency. National benchmark is <10%. Immediate field and infrastructure intervention is required.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Collection Efficiency at 95.30%', desc: 'Despite high losses, collections remained close to the 95% target — indicating billing and collection processes were largely functional.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: 'Smart Meter Coverage at Only 4%', desc: 'Metering rollout in its infancy. Loss attribution is largely estimative at this stage with minimal granular visibility at DT level.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
      { title: 'DT Communication Gap — Critical', desc: 'Only 5% of DTs communicating. No granular loss analytics possible. Metering and communication infrastructure investment is the immediate priority.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
  'FY 2019-20': {
    kpis: { atcLoss: 15.03, tdLoss: 15.03, collEff: 101.38, inputEnergy: 4610, energySales: 3917, energyLoss: 693, outstandingDues: 490 },
    divisions: scaleDivisions(15.03),
    network: { dtMeteredPct: 20.0, dtCommPct: 7.0, dtMeteredCount: 1727, dtCommCount: 605 },
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'T&D Loss Spike — 15.03% (Worst in 7-Year Period)', desc: 'Year-on-year increase from 13.46% to 15.03% — either audit anomaly or actual infrastructure deterioration. Forensic field audit strongly recommended.', metric: '15.03%', metricSub: 'T&D Loss' },
      { sev: 'critical', badge: 'Critical', title: 'AT&C Loss — 15.03% (Persisting High Loss)', desc: 'AT&C loss unchanged in absolute terms despite collection overshoot. Commercial losses are offsetting improved billing recovery.', metric: '15.03%', metricSub: 'AT&C Loss' },
      { sev: 'warning',  badge: 'Warning',  title: 'Outstanding Dues — ₹490 Crore Pending', desc: 'Despite 101.38% collection efficiency (driven by prior-year arrear recovery), fresh billing recovery and structural dues management remain a concern.', metric: '₹490 Cr', metricSub: 'Outstanding' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Coverage — Only 7%', desc: 'Rollout pace insufficient to support granular loss attribution. Significant acceleration required to enable data-driven management.', metric: '7%', metricSub: 'SM Coverage' },
    ],
    insights: [
      { title: 'T&D Loss Spike — 15.03% (Peak Year)', desc: 'FY 2019-20 marks the worst T&D loss in the 7-year period. A forensic audit is essential to distinguish an audit anomaly from actual network deterioration.', accentColor: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
      { title: 'Collection Efficiency at 101.38%', desc: 'Exceptional recovery attributed to prior-year arrear collection — not a structural improvement. Underlying billing challenges persisted through the year.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'AT&C Improved 2.49 pp YoY', desc: 'Despite the T&D spike, AT&C improved from 17.52% to 15.03% — reflecting better commercial collections even as technical losses worsened.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'DT Metering at 20%', desc: '1,727 DTs metered (20%) but communication at only 7% (605 DTs) still limits real-time loss visibility significantly.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Revenue Risk Remains Elevated', desc: '15% loss on 4,610 MU input equals ~693 MU unaccounted. At prevailing tariffs this represents hundreds of crores in unrecovered revenue annually.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
  'FY 2020-21': {
    kpis: { atcLoss: 13.52, tdLoss: 7.73, collEff: 94.40, inputEnergy: 4680, energySales: 4318, energyLoss: 362, outstandingDues: 540 },
    divisions: scaleDivisions(7.73),
    network: { dtMeteredPct: 25.0, dtCommPct: 9.0, dtMeteredCount: 2159, dtCommCount: 777 },
    alerts: [
      { sev: 'warning',  badge: 'Warning',  title: 'AT&C Loss — 13.52% (Still Above 12% Target)', desc: 'Significant improvement in T&D (7.73%) but AT&C remains 1.52 pp above target. Collection efficiency dip to 94.40% is the primary gap driver.', metric: '13.52%', metricSub: 'AT&C Loss' },
      { sev: 'warning',  badge: 'Warning',  title: 'Collection Efficiency — 94.40% (Below Target)', desc: 'COVID-19 disruption likely contributed to collection shortfall. Recovery drive and expanded payment facilities recommended for FY 2021-22.', metric: '94.40%', metricSub: 'Coll. Eff.' },
      { sev: 'warning',  badge: 'Warning',  title: 'DT Communication — Only 9% Active', desc: 'Of 8,636 DTs, 2,159 metered (25%) but only 777 communicating (9%) — creating a significant data blindspot for granular loss attribution.', metric: '9%', metricSub: 'DTs Online' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Rollout — 12% Coverage', desc: 'Progress noted but pace needs acceleration. Target of 25–30% coverage should be set for FY 2021-22.', metric: '12%', metricSub: 'SM Coverage' },
    ],
    insights: [
      { title: 'T&D Loss — Dramatic Recovery to 7.73%', desc: 'T&D fell from 15.03% to 7.73% — a 7.3 pp improvement. Strong field intervention, improved audit practices, and infrastructure upgrades drove this turnaround.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'AT&C Still at 13.52% — Gap Remains', desc: 'Despite the T&D recovery, AT&C at 13.52% reflects weak collection in the COVID year. Commercial loss management needs parallel focus in FY 2021-22.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Collection Efficiency Dipped to 94.40%', desc: 'First year below 95% in the period. COVID-19 restrictions and lockdowns significantly impacted field collection operations across all divisions.', accentColor: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
      { title: 'DT Metering Progress — 25% Coverage', desc: 'Metering at 25% (2,159 DTs) shows steady progress. Communication infrastructure (9%) is the lagging constraint that must be resolved.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Energy Loss Reduced by 331 MU YoY', desc: 'Energy loss fell from 693 MU to 362 MU — a 52% reduction in one year. This represents a substantial improvement in network efficiency.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
  'FY 2021-22': {
    kpis: { atcLoss: 13.00, tdLoss: 8.46, collEff: 95.00, inputEnergy: 4740, energySales: 4339, energyLoss: 401, outstandingDues: 570 },
    divisions: scaleDivisions(8.46),
    network: { dtMeteredPct: 32.0, dtCommPct: 11.0, dtMeteredCount: 2763, dtCommCount: 950 },
    alerts: [
      { sev: 'warning',  badge: 'Warning',  title: 'T&D Loss Regression — 8.46% (Above Prior Year)', desc: 'T&D increased from 7.73% (FY 20-21) to 8.46% — a 0.73 pp setback. Field investigation into which divisions drove this regression is required.', metric: '8.46%', metricSub: 'T&D Loss' },
      { sev: 'warning',  badge: 'Warning',  title: 'AT&C Loss — 13.00% (1 pp from Target)', desc: 'AT&C approaching the 12% target. A focused push through billing accuracy improvement and targeted collection drives can achieve the milestone in FY 2022-23.', metric: '13.00%', metricSub: 'AT&C Loss' },
      { sev: 'warning',  badge: 'Warning',  title: 'Outstanding Dues — ₹570 Crore Pending', desc: 'Dues growing year-on-year. A structured debt recovery plan with legal escalation for high-value defaulters is urgently required.', metric: '₹570 Cr', metricSub: 'Outstanding' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Communication — 11% Active', desc: 'Improving but 89% of DTs still offline. AMI expansion should be prioritised to unlock granular loss data by FY 2022-23.', metric: '11%', metricSub: 'DTs Online' },
    ],
    insights: [
      { title: 'AT&C Improved to 13.00% — Near Target', desc: 'AT&C at 13.00% is the closest to the 12% target in the 4-year trend. Sustained effort in FY 2022-23 can achieve this long-standing milestone.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'T&D Loss Regression — 8.46% from 7.73%', desc: 'T&D increased by 0.73 pp from the FY 20-21 low. Understanding the root cause is essential before it becomes a recurring trend.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Collection Efficiency Recovered to 95.00%', desc: 'Post-COVID collections stabilised above the 95% target — demonstrating that the FY 20-21 dip was temporary and operationally driven.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Smart Meter at 22% — Steady Progress', desc: '2,763 DTs metered (32%) and 22% smart meter coverage. The rollout is progressing but needs acceleration to deliver full AMI value.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: 'Outstanding Dues Growing — Monitor Closely', desc: 'Dues rose to ₹570 Cr from ₹540 Cr. Without a structured recovery intervention, this trajectory creates growing cash-flow risk.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
  'FY 2022-23': {
    kpis: { atcLoss: 12.00, tdLoss: 7.83, collEff: 95.55, inputEnergy: 4812, energySales: 4435, energyLoss: 377, outstandingDues: 600 },
    divisions: scaleDivisions(7.83, true),
    network: { dtMeteredPct: 40.2, dtCommPct: 13.5, dtMeteredCount: 3473, dtCommCount: 1164 },
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'Margao XVI & Ponda X — 9.0% T&D Loss', desc: 'Both divisions are 15% above the state benchmark. Targeted field audit, theft detection drive, and infrastructure review recommended.', metric: '9.0%', metricSub: 'T&D Loss' },
      { sev: 'critical', badge: 'Critical', title: 'Outstanding Dues — ₹600 Crore Pending', desc: 'Substantial collection backlog creating cash-flow risk. Legal escalation, disconnection drives, and payment facilitation urgently needed.', metric: '₹600 Cr', metricSub: 'Outstanding' },
      { sev: 'warning',  badge: 'Warning',  title: 'DT Communication — Only 13.5% Active', desc: 'Of 8,636 DTs, only 3,473 have meters (40.2%). Of those, only 1,164 communicate successfully — creating major data blindspots.', metric: '13.5%', metricSub: 'DTs Online' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Rollout — Progress Tracking', desc: 'DT-level metering at 40.2% coverage. Communication lag must be resolved before further AMI expansion.', metric: '40.2%', metricSub: 'DT Coverage' },
    ],
    insights: [
      { title: 'AT&C Loss Down 5.52 pp', desc: 'From 17.52% (FY 18-19) to 12.00% (FY 22-23) — consistent five-year reduction.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'T&D Loss — Strong Recovery', desc: 'Peaked at 15.03% in FY 19-20, recovered to 7.83% in FY 22-23 — a 7.2 pp improvement.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Collection Efficiency Stable', desc: '95.55% in FY 22-23. FY 19-20 exception (101.38%) attributed to prior-year arrear recovery.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: '79.97% Residential Base', desc: '5.71 lakh of 7.14 lakh consumers are residential — cross-subsidy planning implications.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Digitisation Gap — Priority', desc: 'Only 33.5% of metered DTs communicating. Resolving this unlocks granular loss analytics.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
  'FY 2023-24': {
    kpis: { atcLoss: 11.20, tdLoss: 7.50, collEff: 95.80, inputEnergy: 4890, energySales: 4523, energyLoss: 367, outstandingDues: 580 },
    divisions: scaleDivisions(7.50),
    network: { dtMeteredPct: 52.0, dtCommPct: 24.0, dtMeteredCount: 4491, dtCommCount: 2073 },
    alerts: [
      { sev: 'warning',  badge: 'Warning',  title: 'Top Divisions — Still Above 8.5% T&D Loss', desc: 'Despite state-level improvement, top-ranked divisions remain above the 8.5% threshold. Division-specific field audit and intervention required.', metric: '8.6%', metricSub: 'Peak Loss' },
      { sev: 'warning',  badge: 'Warning',  title: 'Outstanding Dues — ₹580 Crore Pending', desc: 'Dues remain elevated despite strong collection efficiency. Structured recovery with legal escalation for chronic defaulters is recommended.', metric: '₹580 Cr', metricSub: 'Outstanding' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Communication — 24% Active', desc: 'Significant improvement from 13.5% (FY 22-23). Continued investment in communication infrastructure required to reach the 50%+ milestone.', metric: '24%', metricSub: 'DTs Online' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter at 58% — Final Push Needed', desc: 'More than half of coverage achieved. Completing rollout to 80–90% in FY 2024-25 will unlock full AMI benefits across the network.', metric: '58%', metricSub: 'SM Coverage' },
    ],
    insights: [
      { title: 'AT&C Below 12% for the First Time', desc: 'AT&C at 11.20% crosses the long-standing 12% target — a significant milestone achieved through sustained commercial loss reduction.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'T&D Loss at 7.50% — Continued Improvement', desc: 'T&D improving for the second consecutive year, now at 7.50% — approaching best-in-class levels for a state distribution utility.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'DT Communication Doubled to 24%', desc: 'Major infrastructure push nearly doubled DT communication from 13.5% to 24% — enabling granular data for loss attribution in over 2,000 DTs.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: 'Smart Meter at 58% — Halfway Milestone', desc: 'Over half of planned smart meter coverage achieved. AMI data is now available for the majority of the network, enabling demand analytics.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Collection Efficiency at 95.80%', desc: 'Highest collection efficiency in the loss-normalised period (excluding the FY 19-20 arrear spike). Billing accuracy improvements are consistently delivering.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
  'FY 2024-25': {
    kpis: { atcLoss: 10.50, tdLoss: 7.20, collEff: 96.20, inputEnergy: 4960, energySales: 4603, energyLoss: 357, outstandingDues: 555 },
    divisions: scaleDivisions(7.20),
    network: { dtMeteredPct: 65.0, dtCommPct: 38.0, dtMeteredCount: 5613, dtCommCount: 3282 },
    alerts: [
      { sev: 'monitor',  badge: 'Monitor',  title: 'AT&C Loss — 10.50% (Approaching National Benchmark)', desc: 'AT&C within 0.5 pp of the 10% national benchmark. Sustained collection efficiency and commercial loss reduction can achieve this milestone in FY 2025-26.', metric: '10.50%', metricSub: 'AT&C Loss' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter — 72% (Final 28% Remaining)', desc: 'Strong progress. Completing the remaining 28% coverage will enable real-time loss monitoring and full demand-response capability across the network.', metric: '72%', metricSub: 'SM Coverage' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Communication — 38% Active', desc: 'Continued improvement. The remaining gap to 100% represents the largest outstanding data quality risk for accurate loss attribution.', metric: '38%', metricSub: 'DTs Online' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Outstanding Dues — ₹555 Crore (Gradual Reduction)', desc: 'Dues trending down from ₹600 Cr peak. Structured recovery maintaining momentum. Target <₹400 Cr should be set for the next planning cycle.', metric: '₹555 Cr', metricSub: 'Outstanding' },
    ],
    insights: [
      { title: 'AT&C at 10.50% — Near National Benchmark', desc: 'From 17.52% to 10.50% in 7 years — a 7.02 pp improvement. One more focused year can achieve the 10% national benchmark.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'T&D Loss at 7.20% — Best in Period', desc: 'Lowest T&D loss in the 7-year history. Network upgrade investments and anti-theft measures are delivering sustained, compounding results.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Collection Efficiency at 96.20% — Highest', desc: 'Best collection efficiency in the normalised period. Digital payment adoption and billing system improvements are driving consistently above-target performance.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: 'Smart Meter at 72% — Nearing Completion', desc: '72% smart meter coverage — the AMI network now supports real-time load management and granular loss analytics for the majority of the system.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'DT Communication at 38% — Accelerating', desc: '3,282 DTs communicating — up from 1,164 in FY 22-23. The data foundation for full network-wide loss attribution is being built at scale.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SMART METER YEAR DATA (7-year synthetic progression, anchored to FY 2022-23)
// ─────────────────────────────────────────────────────────────────────────────

const SMART_METER_YEAR_DATA = {
  'FY 2018-19': {
    rollout: {
      consumerMeters: { installed: 0,    target: 741160 },
      dtMeters:       { installed: 1295, target: 8369 },
      feederMeters:   { installed: 0,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 1295, activeDTs: 432, communicationRate: 5.0 },
    dataQuality: { consumerTagging: 18, dataAvailability: 22, dataFreshness: 25, meterReporting: 12, networkVisibility: 8 },
    divisions: scaleSmDivisions(5 / 13.5, 18 / 61),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'in-progress', completionPct: 35,  year: 'FY 2018-19' },
      { name: 'Consumer-DT Tagging',         status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'DT Metering Phase 1',         status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'Feeder Separation Works',     status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 0,   year: '—' },
    ],
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'DT Metering — Only 15% Coverage', metric: '15%',  metricSub: 'DT Metered',  desc: 'Only 1,295 of 8,636 DTs have meters. Accurate loss attribution is not possible without DT-level metering across the network.' },
      { sev: 'critical', badge: 'Critical', title: 'No Consumer Smart Meters Deployed', metric: '0',  metricSub: 'SM Installed', desc: 'Consumer smart meter programme has not commenced. Manual reading dependency creates billing inaccuracy and revenue leakage.' },
      { sev: 'critical', badge: 'Critical', title: 'DT Communication — Only 5% Active', metric: '5%', metricSub: 'Comm Rate',   desc: 'Only 432 of 1,295 metered DTs are communicating. Network and SIM provisioning needs immediate attention.' },
      { sev: 'warning',  badge: 'Warning',  title: 'Consumer-DT Tagging Not Started',  metric: '18%', metricSub: 'Tag Coverage', desc: 'Consumer-DT mapping essential for feeder-level loss analysis has not begun. This is a prerequisite for accurate energy accounting.' },
    ],
    insights: [
      { title: 'Pre-Modernisation Baseline', desc: 'FY 2018-19 represents the starting point for RDSS. No consumer smart meters, minimal DT metering, and negligible communication infrastructure in place.', accentColor: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
      { title: 'DT Metering at 15%', desc: 'With only 1,295 DTs metered, loss attribution relies almost entirely on estimates. Building the metering foundation is the immediate infrastructure priority.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Manual Reading Dependency', desc: 'All 714,431 consumers on manual meter reading cycles. Billing errors, reading delays, and field fraud risk remain elevated until AMI rollout commences.', accentColor: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
    ],
  },

  'FY 2019-20': {
    rollout: {
      consumerMeters: { installed: 0,    target: 741160 },
      dtMeters:       { installed: 1727, target: 8369 },
      feederMeters:   { installed: 0,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 1727, activeDTs: 605, communicationRate: 7.0 },
    dataQuality: { consumerTagging: 25, dataAvailability: 30, dataFreshness: 32, meterReporting: 18, networkVisibility: 14 },
    divisions: scaleSmDivisions(7 / 13.5, 25 / 61),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'in-progress', completionPct: 65,  year: 'FY 2019-20' },
      { name: 'Consumer-DT Tagging',         status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'DT Metering Phase 1',         status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'Feeder Separation Works',     status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 0,   year: '—' },
    ],
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'No Consumer Smart Meters Deployed', metric: '0',   metricSub: 'SM Installed', desc: 'Consumer smart meter programme yet to commence. All billing remains manual with associated leakage and accuracy risk.' },
      { sev: 'critical', badge: 'Critical', title: 'DT Communication — Only 7% Active', metric: '7%',  metricSub: 'Comm Rate',    desc: '605 of 1,727 metered DTs are communicating. SIM provisioning and network backhaul remain the primary bottleneck.' },
      { sev: 'warning',  badge: 'Warning',  title: 'Consumer-DT Tagging Nascent',       metric: '25%', metricSub: 'Tag Coverage', desc: 'Tagging work commenced but 75% of consumers remain unmapped to their distribution transformer.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Metering Progressing — 20%',     metric: '20%', metricSub: 'DT Metered',   desc: '1,727 DTs metered. Communication activation is the next priority once metering installation stabilises.' },
    ],
    insights: [
      { title: 'DT Metering Growing — 20%', desc: '1,727 DTs metered (20%) shows steady infrastructure progress. However, communication activation at 7% remains the critical gap for real-time data.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: 'Communication Rate Improved to 7%', desc: 'Up from 5% in FY 2018-19. While the trend is positive, significant investment in communication backhaul is required to unlock analytics value.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Consumer Tagging Gap Persists', desc: 'With only 25% tagging coverage, feeder-level loss calculation remains largely estimative. Tagging must be treated as a parallel workstream to metering.', accentColor: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
    ],
  },

  'FY 2020-21': {
    rollout: {
      consumerMeters: { installed: 0,    target: 741160 },
      dtMeters:       { installed: 2159, target: 8369 },
      feederMeters:   { installed: 0,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 2159, activeDTs: 777, communicationRate: 9.0 },
    dataQuality: { consumerTagging: 35, dataAvailability: 40, dataFreshness: 42, meterReporting: 28, networkVisibility: 20 },
    divisions: scaleSmDivisions(9 / 13.5, 35 / 61),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'complete',    completionPct: 100, year: 'FY 2020-21' },
      { name: 'Consumer-DT Tagging',         status: 'in-progress', completionPct: 22,  year: 'FY 2020-21' },
      { name: 'DT Metering Phase 1',         status: 'in-progress', completionPct: 15,  year: 'FY 2020-21' },
      { name: 'Feeder Separation Works',     status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 0,   year: '—' },
    ],
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'No Consumer Smart Meters Deployed', metric: '0',   metricSub: 'SM Installed', desc: 'Consumer smart metering yet to commence. COVID-19 disruption delayed procurement and rollout schedules significantly.' },
      { sev: 'warning',  badge: 'Warning',  title: 'DT Communication — Only 9% Active', metric: '9%',  metricSub: 'Comm Rate',    desc: '777 DTs actively communicating. Communication infrastructure expansion is constrained by field access limitations during COVID year.' },
      { sev: 'warning',  badge: 'Warning',  title: 'Consumer-DT Tagging at 35%',        metric: '35%', metricSub: 'Tag Coverage', desc: 'Tagging progressing but 65% of consumers remain unmapped. Feeder-level loss visibility is limited.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Metering at 25%',                metric: '25%', metricSub: 'DT Metered',   desc: '2,159 DTs metered. Target to reach 50% by FY 2022-23 requires sustained installation momentum.' },
    ],
    insights: [
      { title: 'Baseline Survey Complete', desc: 'The foundational network census is done. FY 2020-21 marks the shift from groundwork to active deployment of metering and tagging programmes.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'DT Metering at 25% — Steady Progress', desc: '2,159 DTs metered. Communication at 9% is the lagging constraint — every metered DT that cannot communicate is a data blindspot.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Tagging Work Commenced', desc: '35% consumer-DT mapping achieved. This work must accelerate in FY 2021-22 to support accurate feeder-level energy accounting.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    ],
  },

  'FY 2021-22': {
    rollout: {
      consumerMeters: { installed: 0,    target: 741160 },
      dtMeters:       { installed: 2763, target: 8369 },
      feederMeters:   { installed: 0,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 2763, activeDTs: 950, communicationRate: 11.0 },
    dataQuality: { consumerTagging: 48, dataAvailability: 54, dataFreshness: 52, meterReporting: 40, networkVisibility: 32 },
    divisions: scaleSmDivisions(11 / 13.5, 48 / 61),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'complete',    completionPct: 100, year: 'FY 2020-21' },
      { name: 'Consumer-DT Tagging',         status: 'in-progress', completionPct: 48,  year: 'FY 2021-22' },
      { name: 'DT Metering Phase 1',         status: 'in-progress', completionPct: 33,  year: 'FY 2021-22' },
      { name: 'Feeder Separation Works',     status: 'in-progress', completionPct: 10,  year: 'FY 2021-22' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 0,   year: '—' },
    ],
    alerts: [
      { sev: 'warning',  badge: 'Warning',  title: 'No Consumer Smart Meters — Pilot Not Yet Started', metric: '0',    metricSub: 'SM Installed', desc: 'Urban pilot for consumer smart meters is planned but procurement not complete. Target commencement in FY 2023-24.' },
      { sev: 'warning',  badge: 'Warning',  title: 'DT Communication — 11% Active',                   metric: '11%',  metricSub: 'Comm Rate',    desc: '950 DTs communicating. Communication rate improving but well below the 50% milestone needed for reliable network-wide analytics.' },
      { sev: 'warning',  badge: 'Warning',  title: 'Consumer-DT Tagging at 48%',                      metric: '48%',  metricSub: 'Tag Coverage', desc: 'Just under halfway. Completing tagging above 90% is the critical unlock for feeder-wise loss attribution.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Metering at 32%',                              metric: '32%',  metricSub: 'DT Metered',   desc: '2,763 DTs metered. Feeder separation works commenced at 10% — physical infrastructure upgrades alongside digital metering.' },
    ],
    insights: [
      { title: 'Tagging Coverage Approaching Halfway', desc: '48% consumer-DT mapping — the programme is gaining momentum. Reaching 80%+ in FY 2022-23 will significantly improve energy accounting accuracy.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { title: 'DT Communication Improving Steadily', desc: 'From 5% in FY 2018-19 to 11% in FY 2021-22. The trajectory is consistent but pace needs acceleration to meet the 90% RDSS target.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Feeder Separation Works Commenced', desc: 'Physical feeder works at 10% — a prerequisite for accurate feeder-level metering and loss attribution once digital overlay is complete.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    ],
  },

  'FY 2022-23': {
    rollout: {
      consumerMeters: { installed: 0,    target: 741160 },
      dtMeters:       { installed: 3473, target: 8369 },
      feederMeters:   { installed: 0,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 3473, activeDTs: 1164, communicationRate: 13.5 },
    dataQuality: { consumerTagging: 61, dataAvailability: 68, dataFreshness: 72, meterReporting: 58, networkVisibility: 44 },
    divisions: scaleSmDivisions(1, 1),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'complete',    completionPct: 100, year: 'FY 2020-21' },
      { name: 'Consumer-DT Tagging',         status: 'in-progress', completionPct: 61,  year: 'FY 2022-23' },
      { name: 'DT Metering Phase 1',         status: 'in-progress', completionPct: 41,  year: 'FY 2022-23' },
      { name: 'Feeder Separation Works',     status: 'in-progress', completionPct: 28,  year: 'FY 2022-23' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'pending',     completionPct: 0,   year: '—' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 0,   year: '—' },
    ],
    alerts: [
      { sev: 'critical', badge: 'Critical', title: 'Low DT Communication Rate — 13.5% vs 90% Target', metric: '13.5%', metricSub: 'Comm Rate',    desc: '3,473 DTs have meters but only 1,164 actively communicate. Network/SIM provisioning is the bottleneck preventing data collection at scale.' },
      { sev: 'critical', badge: 'Critical', title: 'Consumer-DT Tagging — 39% of Consumers Untagged', metric: '61%',   metricSub: 'Tag Coverage', desc: 'Until 95%+ consumers are mapped to their DT, feeder-level loss calculation will remain unreliable and energy accounting will have significant gaps.' },
      { sev: 'warning',  badge: 'Warning',  title: 'Feeder Visibility Gap — 56% Without Full Metering', metric: '44%', metricSub: 'Network Vis.', desc: 'More than half of feeders lack complete metering coverage. Feeder-wise loss ranking cannot be produced for unmeasured sections.' },
      { sev: 'warning',  badge: 'Warning',  title: 'Meter Reporting Rate Low — 42% Not Reporting',    metric: '58%',   metricSub: 'Meter Report', desc: 'Only 58% of installed meters reporting successfully. Firmware, connectivity, and tamper issues require field investigation.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Pilot Not Yet Started',               metric: '0',     metricSub: 'SM Installed', desc: '0 consumer smart meters deployed. RDSS procurement for the 741,160-meter urban pilot is the next critical milestone.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Data Freshness Below Target',                     metric: '72%',   metricSub: 'Fresh Data',   desc: '28% of meter readings are older than 24 hours. Communication and polling frequency improvements are required.' },
    ],
    insights: [
      { title: 'Communication Infrastructure Exists But Activation Lags', desc: '3,473 DTs have meters but only 1,164 actively communicate — a 33.5% activation rate. Network backhaul and SIM provisioning are the critical bottlenecks to resolve.', accentColor: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { title: 'Consumer Tagging Is the Critical Data Quality Dependency', desc: 'Until 95%+ consumers are mapped to their DT, feeder-level loss calculation will remain unreliable. Tagging must be the top data programme priority for FY 2023-24.', accentColor: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
      { title: 'RDSS Phase 1 Groundwork Is in Place', desc: 'Survey complete, 41% DT metered, 28% feeder works done. The foundation is built — consumer meter rollout is the next acceleration trigger to unlock full AMI value.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    ],
  },

  'FY 2023-24': {
    rollout: {
      consumerMeters: { installed: 18500,  target: 741160 },
      dtMeters:       { installed: 4491,   target: 8369 },
      feederMeters:   { installed: 124,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 4491, activeDTs: 2073, communicationRate: 24.0 },
    dataQuality: { consumerTagging: 74, dataAvailability: 80, dataFreshness: 82, meterReporting: 70, networkVisibility: 62 },
    divisions: scaleSmDivisions(24 / 13.5, 74 / 61),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'complete',    completionPct: 100, year: 'FY 2020-21' },
      { name: 'Consumer-DT Tagging',         status: 'complete',    completionPct: 100, year: 'FY 2023-24' },
      { name: 'DT Metering Phase 1',         status: 'complete',    completionPct: 100, year: 'FY 2023-24' },
      { name: 'Feeder Separation Works',     status: 'in-progress', completionPct: 68,  year: 'FY 2023-24' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'in-progress', completionPct: 30,  year: 'FY 2023-24' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 0,   year: '—' },
    ],
    alerts: [
      { sev: 'warning',  badge: 'Warning',  title: 'Consumer Smart Meter Deployment at 2.5% — Acceleration Needed', metric: '2.5%',  metricSub: 'SM Target',  desc: '18,500 of 741,160 consumer meters installed. At current pace, full deployment will take 15+ years. Procurement and field execution must be significantly scaled.' },
      { sev: 'warning',  badge: 'Warning',  title: 'DT Communication at 24% — Target Gap Remains',                 metric: '24%',   metricSub: 'Comm Rate',  desc: 'Major improvement from 13.5% but still well below the 90% RDSS target. Communication infrastructure investment must continue at scale.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Feeder Separation Works at 68% — Final Push Needed',           metric: '68%',   metricSub: 'Feeder Sep', desc: 'Physical feeder works over two-thirds complete. Completing the remaining 32% is critical for enabling feeder-wise loss measurement.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Urban Pilot Progressing at 30%',                   metric: '30%',   metricSub: 'Pilot Prog', desc: 'Urban pilot on track. Lessons from pilot should be incorporated into the full AMI rollout design before mass deployment.' },
    ],
    insights: [
      { title: 'DT Communication Doubled to 24%', desc: 'Major infrastructure push nearly doubled DT communication from 13.5% to 24% — enabling granular data for loss attribution in over 2,000 DTs.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'Consumer Smart Meters Commenced', desc: 'First 18,500 consumer meters deployed. The AMI programme is live — scaling execution machinery is now the critical success factor.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Data Quality Improved Across All Metrics', desc: 'Tagging at 74%, data availability at 80%, meter reporting at 70% — systematic programme execution is delivering measurable data quality gains.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
    ],
  },

  'FY 2024-25': {
    rollout: {
      consumerMeters: { installed: 74200,  target: 741160 },
      dtMeters:       { installed: 5613,   target: 8369 },
      feederMeters:   { installed: 412,    target: 827 },
    },
    communication: { totalDTs: 8636, communicableDTs: 5613, activeDTs: 3282, communicationRate: 38.0 },
    dataQuality: { consumerTagging: 84, dataAvailability: 88, dataFreshness: 87, meterReporting: 82, networkVisibility: 76 },
    divisions: scaleSmDivisions(38 / 13.5, 84 / 61),
    modernization: [
      { name: 'Baseline Survey & Indexing',  status: 'complete',    completionPct: 100, year: 'FY 2020-21' },
      { name: 'Consumer-DT Tagging',         status: 'complete',    completionPct: 100, year: 'FY 2023-24' },
      { name: 'DT Metering Phase 1',         status: 'complete',    completionPct: 100, year: 'FY 2023-24' },
      { name: 'Feeder Separation Works',     status: 'complete',    completionPct: 100, year: 'FY 2024-25' },
      { name: 'Smart Meter Pilot (Urban)',   status: 'in-progress', completionPct: 72,  year: 'FY 2024-25' },
      { name: 'AMI Full Rollout',            status: 'pending',     completionPct: 8,   year: 'FY 2025-26' },
    ],
    alerts: [
      { sev: 'monitor',  badge: 'Monitor',  title: 'Consumer Smart Meter at 10% — Scaling Phase Critical', metric: '10%',   metricSub: 'SM Target',  desc: '74,200 of 741,160 deployed. Execution machinery is in place — contractor capacity and material supply chain are the key scaling constraints for FY 2025-26.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'DT Communication at 38% — Continued Investment Needed', metric: '38%',  metricSub: 'Comm Rate',  desc: 'Strong progress from 1,164 to 3,282 active DTs over 3 years. Maintaining this trajectory to reach 90%+ requires sustained backhaul investment.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'Smart Meter Urban Pilot at 72% — AMI Design Lock-in',  metric: '72%',   metricSub: 'Pilot Prog', desc: 'Pilot findings should now inform the full AMI rollout specification. Locking in the technical design before mass procurement is the priority.' },
      { sev: 'monitor',  badge: 'Monitor',  title: 'AMI Full Rollout — Planning Phase Commenced',           metric: '8%',    metricSub: 'AMI Rollout',desc: 'Full rollout planning underway. FY 2025-26 will be the decisive year for mass consumer meter deployment at scale.' },
    ],
    insights: [
      { title: 'DT Communication Tripling Over 3 Years', desc: 'From 1,164 active DTs (FY 22-23) to 3,282 (FY 24-25) — a 182% increase. The data infrastructure for network-wide loss attribution is being built at scale.', accentColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { title: 'Smart Meter Consumer Pilot at 10%', desc: '74,200 consumers on smart meters — the AMI ecosystem is live. Lessons from early adopters should shape the full rollout specification to avoid large-scale rework.', accentColor: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { title: 'Data Quality Score Significantly Improved', desc: 'From a composite score of 61 (FY 22-23) to 83 (FY 24-25). The data foundation for accurate energy accounting and demand analytics is now largely in place.', accentColor: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TREND DATA (all 7 years — always shown in full in the chart)
// ─────────────────────────────────────────────────────────────────────────────

const TREND_DATA = FY_OPTIONS.map(fy => ({
  year: FY_SHORT[fy],
  tdLoss: YEAR_DATA[fy].kpis.tdLoss,
  atcLoss: YEAR_DATA[fy].kpis.atcLoss,
  collEff: YEAR_DATA[fy].kpis.collEff,
}));

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMER DATA (static across years)
// ─────────────────────────────────────────────────────────────────────────────

const CONSUMER_DATA = [
  { name: 'Residential',          shortName: 'Residential',     value: 79.97, count: 571341, color: '#2563EB' },
  { name: 'Commercial / Ind. LT', shortName: 'Comm./Ind. LT',   value: 17.07, count: 121953, color: '#60A5FA' },
  { name: 'Agricultural',         shortName: 'Agricultural',    value: 1.83,  count: 13074,  color: '#059669' },
  { name: 'HT Industrial',        shortName: 'HT Industrial',   value: 0.17,  count: 1215,   color: '#D97706' },
  { name: 'Others',               shortName: 'Others',          value: 0.96,  count: 6848,   color: '#94A3B8' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getDivisionColor(loss, benchmark = 7.83) {
  if (loss <= benchmark * 0.91) return '#6EE7B7';
  if (loss <= benchmark)        return '#93C5FD';
  if (loss <= benchmark * 1.09) return '#FCD34D';
  return '#FCA5A5';
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICON LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

const Ic = {
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
      <path d="M13 2L3.5 13.5h7L9 22l11.5-11.5H13V2z"/>
    </svg>
  ),
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  energy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  meters: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  trendDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  barChart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  creditCard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/>
      <line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/>
      <line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIPS
// ─────────────────────────────────────────────────────────────────────────────

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E7EB',
      borderRadius: '8px', padding: '11px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11.5px',
    }}>
      <p style={{ fontWeight: '700', color: '#0F172A', marginBottom: '7px', fontSize: '11px' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', marginBottom: '3px' }}>
          <span style={{ color: p.color, fontWeight: '500', fontSize: '11px' }}>{p.name}</span>
          <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '11px' }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const ConsumerTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E7EB',
      borderRadius: '8px', padding: '9px 13px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px',
    }}>
      <p style={{ fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{d.name}</p>
      <p style={{ color: '#64748B' }}>Share: <strong style={{ color: d.color }}>{d.value}%</strong></p>
      <p style={{ color: '#64748B' }}>Count: <strong>{d.count.toLocaleString('en-IN')}</strong></p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview', label: 'Executive Overview', icon: Ic.overview },
  { id: 'energy',   label: 'Energy & Loss',      icon: Ic.energy },
  { id: 'meters',   label: 'Smart Meters & Data', icon: Ic.meters },
];

function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  return (
    <aside style={{
      width: collapsed ? 60 : 216,
      minWidth: collapsed ? 60 : 216,
      transition: 'width 0.22s ease, min-width 0.22s ease',
      background: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      zIndex: 50,
    }}>

      {/* Branding */}
      <div style={{
        padding: collapsed ? '16px 0' : '16px 14px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        gap: collapsed ? '0' : '10px',
        minHeight: 72,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: '8px', flexShrink: 0,
          background: 'linear-gradient(145deg, #1E3A8A 0%, #1E40AF 55%, #2563EB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <div style={{ width: 15, height: 15 }}>{Ic.bolt}</div>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              Goa Electricity
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '500', whiteSpace: 'nowrap' }}>
              Department
            </div>
          </div>
        )}
      </div>

      {/* Sub-label + collapse toggle */}
      <div style={{ padding: collapsed ? '10px 8px 6px' : '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div style={{ fontSize: '9px', fontWeight: '700', color: '#CBD5E1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Navigation
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '5px',
            border: '1px solid #E5E7EB',
            background: '#FFFFFF',
            cursor: 'pointer',
            color: '#94A3B8',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          <span style={{ width: 11, height: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {collapsed ? Ic.chevronRight : Ic.chevronLeft}
          </span>
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 8px' : '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: collapsed ? '9px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#1E40AF' : '#64748B',
                background: isActive ? '#EFF6FF' : 'transparent',
                transition: 'all 0.15s ease',
                width: '100%',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, background: '#1E40AF', borderRadius: '0 2px 2px 0',
                }} />
              )}
              <span style={{
                width: 15, height: 15, display: 'block', flexShrink: 0,
                color: isActive ? '#1E40AF' : '#94A3B8',
              }}>
                {item.icon}
              </span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: collapsed ? '8px' : '8px', borderTop: '1px solid #F1F5F9' }}>
        {[
          { icon: Ic.settings, label: 'Settings' },
          { icon: Ic.logout,   label: 'Logout' },
        ].map(item => (
          <button
            key={item.label}
            title={collapsed ? item.label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: collapsed ? '8px 0' : '7px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: '500',
              color: '#64748B',
              background: 'transparent',
              width: '100%',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            <span style={{ width: 15, height: 15, display: 'block', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}

        {!collapsed && (
          <div style={{
            marginTop: '10px',
            padding: '9px 10px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: '500' }}>Live · Last Updated</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151' }}>June 2026</div>
          </div>
        )}
      </div>

    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({ activeTab, selectedFY, setSelectedFY }) {
  const titles = {
    overview: {
      title: 'Executive Overview',
      sub: `Annual performance summary · ${selectedFY} · 18 Divisions · 34 Subdivisions · 337 Feeders · 714,431 Consumers`,
    },
    energy: {
      title: 'Energy & Loss Analysis',
      sub: `Division-wise loss breakdown · ${selectedFY}`,
    },
    meters: {
      title: 'Smart Meters & Data Health',
      sub: `Modernisation progress & communication status · ${selectedFY} · 8,636 DTs · 337 Feeders · 18 Divisions`,
    },
  };
  const { title, sub } = titles[activeTab] || titles.overview;

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      padding: '0 24px',
      height: 54,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    }}>
      <div>
        <h1 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: '10.5px', color: '#94A3B8', margin: 0, marginTop: '1px', fontWeight: '400' }}>
          {sub}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Live badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          padding: '4px 10px', borderRadius: '6px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'block', flexShrink: 0 }} />
          <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#059669' }}>Live Dashboard</span>
        </div>

        {/* Financial Year selector */}
        <select
          value={selectedFY}
          onChange={e => setSelectedFY(e.target.value)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #BFDBFE',
            borderRadius: '6px',
            padding: '4px 28px 4px 10px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#1E40AF',
            cursor: 'pointer',
            fontFamily: 'inherit',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%231E40AF' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {FY_OPTIONS.map(fy => (
            <option key={fy} value={fy}>{fy}</option>
          ))}
        </select>

        {/* User info */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>Chief Electrical Engineer</div>
          <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Updated: June 2026</div>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '10.5px', fontWeight: '800', flexShrink: 0,
          letterSpacing: '0.03em',
        }}>
          CE
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, title, badge, titleRight, style = {}, noPad = false, bodyStyle = {} }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '13px 16px 10px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
              {title}
            </h3>
            {badge && (
              <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px', display: 'block', fontWeight: '400' }}>
                {badge}
              </span>
            )}
          </div>
          {titleRight}
        </div>
      )}
      <div style={noPad ? bodyStyle : { padding: '13px 16px', ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

function KPICard({ title, value, unit, trend, trendDir, trendVs, status, sub, icon }) {
  const palette = {
    good:     { accent: '#059669', iconBg: '#ECFDF5', iconColor: '#059669' },
    warning:  { accent: '#D97706', iconBg: '#FFFBEB', iconColor: '#D97706' },
    critical: { accent: '#DC2626', iconBg: '#FFF1F2', iconColor: '#DC2626' },
    info:     { accent: '#2563EB', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    neutral:  { accent: '#94A3B8', iconBg: '#F8FAFC', iconColor: '#94A3B8' },
  }[status] || { accent: '#94A3B8', iconBg: '#F8FAFC', iconColor: '#94A3B8' };

  const trendColor = (trendDir === 'down-good' || trendDir === 'up-good') ? '#059669'
    : (trendDir === 'down-bad' || trendDir === 'up-bad') ? '#DC2626' : '#94A3B8';
  const arrow = trendDir?.startsWith('down') ? '↓' : trendDir?.startsWith('up') ? '↑' : '';

  return (
    <div className="kpi-card" style={{
      background: '#FFFFFF',
      borderRadius: '10px',
      padding: '14px 15px',
      border: '1px solid #E5E7EB',
      borderTop: `3px solid ${palette.accent}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: '6px',
      transition: 'box-shadow 0.2s ease, transform 0.15s ease',
      cursor: 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '9.5px', fontWeight: '700', color: '#64748B',
          letterSpacing: '0.055em', textTransform: 'uppercase',
        }}>
          {title}
        </span>
        {icon && (
          <div style={{
            width: 24, height: 24,
            borderRadius: '6px',
            background: palette.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: palette.iconColor, flexShrink: 0,
          }}>
            <span style={{ width: 12, height: 12, display: 'block' }}>{icon}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#64748B' }}>{unit}</span>}
      </div>

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '10.5px', color: trendColor, fontWeight: '700' }}>{arrow} {trend}</span>
          {trendVs && <span style={{ fontSize: '9.5px', color: '#CBD5E1' }}>{trendVs}</span>}
        </div>
      )}

      {sub && <span style={{ fontSize: '9.5px', color: '#94A3B8', lineHeight: 1.5 }}>{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENTION PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AttentionPanel({ alerts }) {
  const criticalCount = alerts.filter(a => a.sev === 'critical').length;
  const warningCount  = alerts.filter(a => a.sev === 'warning').length;

  const sty = {
    critical: { accent: '#DC2626', badgeBg: '#FFF1F2', badgeColor: '#DC2626', badgeBorder: '#FECDD3', metricColor: '#DC2626' },
    warning:  { accent: '#D97706', badgeBg: '#FFFBEB', badgeColor: '#D97706', badgeBorder: '#FDE68A', metricColor: '#D97706' },
    monitor:  { accent: '#2563EB', badgeBg: '#EFF6FF', badgeColor: '#2563EB', badgeBorder: '#BFDBFE', metricColor: '#2563EB' },
  };

  return (
    <Card
      title="Attention Required"
      badge=""
      titleRight={
        <div style={{ display: 'flex', gap: '5px' }}>
          {criticalCount > 0 && (
            <span style={{
              background: '#FFF1F2', color: '#DC2626',
              fontSize: '9px', fontWeight: '700', letterSpacing: '0.04em',
              padding: '2px 7px', borderRadius: '4px', border: '1px solid #FECDD3',
            }}>{criticalCount} Critical</span>
          )}
          {warningCount > 0 && (
            <span style={{
              background: '#FFFBEB', color: '#D97706',
              fontSize: '9px', fontWeight: '700', letterSpacing: '0.04em',
              padding: '2px 7px', borderRadius: '4px', border: '1px solid #FDE68A',
            }}>{warningCount} Warning</span>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {alerts.map((a, i) => {
          const s = sty[a.sev];
          return (
            <div key={i} style={{
              background: '#FFFFFF',
              border: '1px solid #F1F5F9',
              borderLeft: `3px solid ${s.accent}`,
              borderRadius: '7px',
              padding: '10px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: '10px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{
                    display: 'inline-block',
                    background: s.badgeBg, color: s.badgeColor,
                    fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.04em',
                    padding: '1px 6px', borderRadius: '3px',
                    border: `1px solid ${s.badgeBorder}`,
                  }}>
                    {a.badge}
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A', margin: '0 0 3px', lineHeight: 1.35 }}>
                  {a.title}
                </p>
                <p style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  {a.desc}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: s.metricColor, lineHeight: 1 }}>
                  {a.metric}
                </div>
                <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '600', marginTop: '2px' }}>
                  {a.metricSub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVISION PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────

function DivisionPerformance({ divisionData, tdLoss, selectedFY }) {
  const bands = {
    critical: divisionData.filter(d => d.loss > tdLoss * 1.09).length,
    below:    divisionData.filter(d => d.loss > tdLoss && d.loss <= tdLoss * 1.09).length,
    onTrack:  divisionData.filter(d => d.loss > tdLoss * 0.91 && d.loss <= tdLoss).length,
    best:     divisionData.filter(d => d.loss <= tdLoss * 0.91).length,
  };

  const hasConfirmed = divisionData.some(d => d.confirmed);
  const badge = `18 Divisions · Benchmark: ${tdLoss}%${hasConfirmed ? '  ·  * Confirmed audit values: Ponda X, Margao XVI, Mapusa XVII' : ''}`;

  const maxLoss = Math.max(...divisionData.map(d => d.loss));
  const domainMax = Math.max(11, Math.ceil(maxLoss * 1.15));

  const DivTooltipContent = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const loss = payload[0]?.value;
    const band = loss > tdLoss * 1.09 ? { label: 'Critical',      color: '#DC2626' }
      : loss > tdLoss               ? { label: 'Below Target',   color: '#D97706' }
      : loss > tdLoss * 0.91        ? { label: 'On Track',       color: '#3B82F6' }
      :                               { label: 'Best in Class',  color: '#059669' };
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E7EB',
        borderRadius: '8px', padding: '9px 13px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px',
      }}>
        <p style={{ fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#64748B' }}>T&D Loss: <strong style={{ color: getDivisionColor(loss, tdLoss) }}>{loss}%</strong></p>
        <p style={{ color: band.color, fontWeight: '600', marginTop: '2px', fontSize: '10.5px' }}>{band.label}</p>
      </div>
    );
  };

  return (
    <Card
      title={`Division-wise T&D Loss · ${selectedFY}`}
      badge={badge}
      titleRight={
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          {[
            { label: `${bands.best} Best`,        color: '#6EE7B7' },
            { label: `${bands.onTrack} On Track`,  color: '#93C5FD' },
            { label: `${bands.below} Below`,       color: '#FCD34D' },
            { label: `${bands.critical} Critical`, color: '#FCA5A5' },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: b.color, display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500', whiteSpace: 'nowrap' }}>{b.label}</span>
            </div>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={540}>
        <BarChart
          data={divisionData}
          layout="vertical"
          barCategoryGap="42%"
          margin={{ top: 24, right: 58, left: 6, bottom: 20 }}
        >
          <CartesianGrid horizontal={false} stroke="#F1F5F9" strokeDasharray="4 4" />
          <XAxis
            type="number"
            domain={[0, domainMax]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={108}
            tick={{ fontSize: 10, fill: '#374151', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<DivTooltipContent />} cursor={{ fill: 'rgba(248,250,252,0.6)' }} />
          <ReferenceLine
            x={tdLoss}
            yAxisId={0}
            stroke="#1E40AF"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: `${tdLoss}%`,
              position: 'top',
              fontSize: 9.5,
              fill: '#1E40AF',
              fontWeight: '700',
              fontFamily: 'Plus Jakarta Sans',
            }}
          />
          <Bar dataKey="loss" barSize={11} radius={[0, 3, 3, 0]}>
            {divisionData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={getDivisionColor(entry.loss, tdLoss)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE TRENDS
// ─────────────────────────────────────────────────────────────────────────────

function PerformanceTrends({ selectedFY }) {
  const shortFY = FY_SHORT[selectedFY];

  return (
    <Card
      title="Performance Trends — Seven-Year View"
      badge="FY 2018-19 to FY 2024-25 · Source: Annual Energy Audit Reports, Goa Electricity Department"
    >
      <ResponsiveContainer width="100%" height={310}>
        <ComposedChart data={TREND_DATA} margin={{ top: 8, right: 44, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            yAxisId="loss"
            domain={[0, 20]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <YAxis
            yAxisId="eff"
            orientation="right"
            domain={[88, 106]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <Tooltip content={<TrendTooltip />} />
          <ReferenceLine
            yAxisId="loss"
            x={shortFY}
            stroke="#1E40AF"
            strokeDasharray="3 3"
            strokeWidth={1.5}
            label={{
              value: selectedFY,
              position: 'insideTopRight',
              fontSize: 8.5,
              fill: '#1E40AF',
              fontWeight: '700',
              fontFamily: 'Plus Jakarta Sans',
              offset: 4,
            }}
          />
          <Area
            yAxisId="loss"
            type="monotone"
            dataKey="atcLoss"
            name="AT&C Loss"
            stroke="#DC2626"
            fill="#FEF2F2"
            fillOpacity={0.5}
            strokeWidth={1.75}
            dot={{ r: 3.5, fill: '#DC2626', stroke: '#FFFFFF', strokeWidth: 2 }}
            activeDot={{ r: 4.5 }}
          />
          <Line
            yAxisId="loss"
            type="monotone"
            dataKey="tdLoss"
            name="T&D Loss"
            stroke="#2563EB"
            strokeWidth={1.75}
            strokeDasharray="5 3"
            dot={{ r: 3.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
            activeDot={{ r: 4.5 }}
          />
          <Line
            yAxisId="eff"
            type="monotone"
            dataKey="collEff"
            name="Collection Efficiency"
            stroke="#059669"
            strokeWidth={1.75}
            dot={{ r: 3.5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
            activeDot={{ r: 4.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '28px', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '2px' }}>
        {[
          { color: '#DC2626', label: 'AT&C Loss',               dash: false },
          { color: '#2563EB', label: 'T&D Loss',                dash: true  },
          { color: '#059669', label: 'Collection Efficiency →', dash: false },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={item.color} strokeWidth="1.75" strokeDasharray={item.dash ? '4 2' : 'none'} />
              <circle cx="10" cy="4" r="2.5" fill={item.color} />
            </svg>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMER MIX
// ─────────────────────────────────────────────────────────────────────────────

function ConsumerMix() {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <Card title="Consumer Mix" badge="714,431 total consumers">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <PieChart width={200} height={155}>
            <Pie
              data={CONSUMER_DATA}
              cx={100} cy={77}
              innerRadius={48} outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              stroke="none"
            >
              {CONSUMER_DATA.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.color}
                  opacity={activeIdx === null || activeIdx === i ? 0.9 : 0.3}
                  style={{ transition: 'opacity 0.2s ease', cursor: 'default' }}
                />
              ))}
            </Pie>
            <Tooltip content={<ConsumerTooltip />} />
          </PieChart>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', lineHeight: 1 }}>7.14 L</div>
            <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '500', marginTop: '2px' }}>Consumers</div>
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '22px', marginBottom: '6px' }}>
          {CONSUMER_DATA.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '4px 6px', borderRadius: '6px',
                background: activeIdx === i ? '#F8FAFC' : 'transparent',
                transition: 'background 0.15s ease', cursor: 'default',
              }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: d.color, display: 'block', flexShrink: 0, marginRight: '8px', opacity: 0.9 }} />
              <span style={{ fontSize: '10px', color: '#374151', flex: 1, fontWeight: '500' }}>{d.shortName}</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK & INFRASTRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

function NetworkAndDataHealth({ networkStats, selectedFY }) {
  const { dtMeteredPct, dtCommPct, dtMeteredCount, dtCommCount } = networkStats;

  const stats = [
    { label: 'Divisions',    value: '18',    color: '#1E40AF', bg: '#EFF6FF' },
    { label: 'Subdivisions', value: '34',    color: '#1E40AF', bg: '#EFF6FF' },
    { label: 'Feeders',      value: '337',   color: '#0369A1', bg: '#F0F9FF' },
    { label: 'DTs',          value: '8,636', color: '#0369A1', bg: '#F0F9FF' },
  ];

  const dtRows = [
    { label: 'Total DTs',           value: '8,636',                                   pct: 100,        pctLabel: '100%',                          barColor: '#CBD5E1' },
    { label: 'DT Meters Installed', value: dtMeteredCount.toLocaleString('en-IN'),     pct: dtMeteredPct, pctLabel: `${dtMeteredPct.toFixed(1)}%`, barColor: '#3B82F6' },
    { label: 'DTs Communicating',   value: dtCommCount.toLocaleString('en-IN'),        pct: dtCommPct,   pctLabel: `${dtCommPct.toFixed(1)}%`,     barColor: '#059669' },
  ];

  const commSeverity = dtCommPct < 15 ? 'CRITICAL' : dtCommPct < 35 ? 'WARNING' : 'IMPROVING';
  const commSevStyle = {
    CRITICAL:  { bg: '#FFF1F2', color: '#DC2626', border: '#FECDD3' },
    WARNING:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    IMPROVING: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  }[commSeverity];

  const ratio = Math.round(100 / dtCommPct);

  return (
    <Card title="Network & Infrastructure" badge={selectedFY}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            borderRadius: '8px', padding: '10px 11px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: '500', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: '#F1F5F9', marginBottom: '12px' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>DT Communication Health</span>
        <span style={{
          fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.04em',
          background: commSevStyle.bg, color: commSevStyle.color,
          border: `1px solid ${commSevStyle.border}`,
          padding: '2px 7px', borderRadius: '4px',
        }}>{commSeverity}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '12px' }}>
        {dtRows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500' }}>{row.label}</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>
                {row.value}
                <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '500', marginLeft: '3px' }}>({row.pctLabel})</span>
              </span>
            </div>
            <div style={{ height: 5, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${row.pct}%`,
                background: row.barColor,
                borderRadius: '999px',
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: commSeverity === 'IMPROVING' ? '#EFF6FF' : '#FFFBEB',
        border: `1px solid ${commSeverity === 'IMPROVING' ? '#BFDBFE' : '#FDE68A'}`,
        borderRadius: '7px', padding: '9px 11px',
      }}>
        <p style={{ fontSize: '10px', color: commSeverity === 'IMPROVING' ? '#1E3A8A' : '#78350F', lineHeight: 1.6, margin: 0 }}>
          {ratio <= 4
            ? <><strong>1 in {ratio} DTs</strong> is actively transmitting data — significant progress toward full AMI coverage.</>
            : <>Only <strong>1 in {ratio} DTs</strong> is actively transmitting data. Expanding meter coverage is a prerequisite for accurate loss attribution.</>
          }
        </p>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────

function KeyInsights({ insights }) {
  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>Key Insights</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {insights.map((item, i) => (
          <div key={i} style={{
            background: item.bg,
            borderRadius: '9px', padding: '13px 14px',
            border: `1px solid ${item.border}`,
            borderTop: `3px solid ${item.accentColor}`,
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: item.accentColor, marginBottom: '5px', lineHeight: 1.35 }}>
              {item.title}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.6 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY FLOW DIAGRAM
// ─────────────────────────────────────────────────────────────────────────────

function EnergyFlowDiagram({ kpi }) {
  const { inputEnergy, energySales, tdLoss } = kpi;
  const ratio = tdLoss / 7.83;

  const lossEHV = Math.round(inputEnergy * 0.013 * ratio * 10) / 10;
  const lossHV  = Math.round(inputEnergy * 0.030 * ratio * 10) / 10;
  const lossLT  = Math.round((inputEnergy - energySales - lossEHV - lossHV) * 10) / 10;
  const totalLoss = Math.round((lossEHV + lossHV + lossLT) * 10) / 10;

  const stages = [
    { label: 'Power Procurement',     value: inputEnergy.toLocaleString('en-IN'), pct: '100%',                                                           color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: Ic.zap },
    { label: 'After EHV (> 33 kV)',   value: (inputEnergy - lossEHV).toFixed(1),  pct: `${(100 - lossEHV / inputEnergy * 100).toFixed(1)}% remains`,     color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD', icon: Ic.activity },
    { label: 'After HV (33 kV)',       value: (inputEnergy - lossEHV - lossHV).toFixed(1), pct: `${((inputEnergy - lossEHV - lossHV) / inputEnergy * 100).toFixed(1)}% remains`, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: Ic.activity },
    { label: 'Energy Sold',           value: energySales.toLocaleString('en-IN'), pct: `${(100 - tdLoss).toFixed(2)}% of input`,                          color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: Ic.checkCircle },
  ];

  const losses = [
    { label: '> 33 kV Loss', mu: lossEHV, pct: (lossEHV / inputEnergy * 100).toFixed(2), color: '#1E40AF' },
    { label: '33 kV Loss',   mu: lossHV,  pct: (lossHV  / inputEnergy * 100).toFixed(2), color: '#0EA5E9' },
    { label: '11 kV & LT',  mu: lossLT,  pct: (lossLT  / inputEnergy * 100).toFixed(2), color: '#DC2626' },
  ];

  return (
    <Card
      title="Energy Flow — Power Procurement to Sales"
      badge={`T&D Loss: ${tdLoss}% · Total unaccounted: ${totalLoss.toLocaleString('en-IN')} MU`}
    >
      <div style={{ paddingTop: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginBottom: '28px' }}>
        {stages.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              flex: '1 1 0', minWidth: 0,
              background: s.bg, border: `1px solid ${s.border}`, borderTop: `3px solid ${s.color}`,
              borderRadius: '9px', padding: '12px 10px', textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                <span style={{ width: 16, height: 16, color: s.color, display: 'block' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: s.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '5px', lineHeight: 1.35 }}>
                {s.label}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '3px', fontWeight: '500' }}>MU</div>
              <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px' }}>{s.pct}</div>
            </div>

            {i < stages.length - 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '26px', flexShrink: 0, width: 90 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '7px' }}>
                  <div style={{ flex: 1, height: 2, background: '#CBD5E1' }} />
                  <div style={{ width: 0, height: 0, borderLeft: '7px solid #94A3B8', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
                </div>
                <div style={{ textAlign: 'center', width: '100%', padding: '5px 8px' }}>
                  <div style={{ fontSize: '8px', fontWeight: '700', color: '#DC2626', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1px' }}>
                    {losses[i].label}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#DC2626', lineHeight: 1.2 }}>−{losses[i].mu}</div>
                  <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>{losses[i].pct}% of input</div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{
        background: '#F8FAFC', border: '1px solid #E5E7EB',
        borderRadius: '8px', padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          {losses.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: item.color, flexShrink: 0, display: 'block' }} />
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500' }}>{item.label}</span>
              <span style={{ fontSize: '10.5px', color: '#0F172A', fontWeight: '700' }}>{item.mu} MU ({item.pct}%)</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Total T&D Loss:</span>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#DC2626' }}>{totalLoss.toLocaleString('en-IN')} MU ({tdLoss}%)</span>
        </div>
      </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOLTAGE-WISE LOSS ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

function VoltageLossChart({ kpi }) {
  const { tdLoss, inputEnergy } = kpi;
  const ratio = tdLoss / 7.83;

  const voltageData = [
    { level: '> 33 kV', subLabel: 'EHV Transmission',    lossPct: Math.round(1.3 * ratio * 10) / 10,  color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
    { level: '33 kV',   subLabel: 'HV Sub-Transmission', lossPct: Math.round(3.0 * ratio * 10) / 10,  color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
    { level: '11 kV',   subLabel: 'MV Distribution',     lossPct: Math.round(11.0 * ratio * 10) / 10, color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
  ].map(d => ({ ...d, lossMU: Math.round(inputEnergy * d.lossPct / 100 * 10) / 10 }));

  const chartData = voltageData.map(d => ({ name: d.level, loss: d.lossPct, fill: d.color }));

  const VoltTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = voltageData.find(v => v.level === label);
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '9px 12px', fontSize: '11px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <p style={{ fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{label} — {d?.subLabel}</p>
        <p style={{ color: '#64748B' }}>Loss rate: <strong style={{ color: d?.color }}>{payload[0].value}%</strong></p>
        <p style={{ color: '#64748B' }}>Estimated: <strong>{d?.lossMU} MU</strong></p>
      </div>
    );
  };

  return (
    <Card title="Voltage-wise Loss Analysis" badge="Loss % at each network voltage level · Scaled to selected FY">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} barCategoryGap="38%">
          <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#374151', fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<VoltTooltip />} cursor={{ fill: 'rgba(248,250,252,0.6)' }} />
          <Bar dataKey="loss" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '8px' }}>
        {voltageData.map((d, i) => (
          <div key={i} style={{
            background: d.bg, border: `1px solid ${d.border}`,
            borderRadius: '7px', padding: '9px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: d.color }}>
                {d.level} <span style={{ fontWeight: '500', color: '#64748B', fontSize: '10px' }}>({d.subLabel})</span>
              </div>
              <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '1px' }}>≈ {d.lossMU} MU unaccounted</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: d.color, lineHeight: 1 }}>{d.lossPct}%</div>
              <div style={{ fontSize: '9px', color: '#94A3B8' }}>loss at level</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOSS HISTORY CHART
// ─────────────────────────────────────────────────────────────────────────────

function LossHistoryChart({ selectedFY }) {
  const shortFY = FY_SHORT[selectedFY];

  const LossTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 13px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px' }}>
        <p style={{ fontWeight: '700', color: '#0F172A', marginBottom: '6px' }}>{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '3px' }}>
            <span style={{ color: p.color, fontWeight: '500' }}>{p.name}</span>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>{p.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card
      title="Historical Loss Trends — Seven-Year View"
      badge="AT&C Loss & T&D Loss · FY 2018-19 to FY 2024-25 · Source: GED Annual Energy Audit Reports"
    >
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={TREND_DATA} margin={{ top: 10, right: 40, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            domain={[0, 20]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<LossTooltip />} />
          <ReferenceLine
            x={shortFY}
            stroke="#1E40AF" strokeDasharray="3 3" strokeWidth={1.5}
            label={{ value: selectedFY, position: 'insideTopRight', fontSize: 8.5, fill: '#1E40AF', fontWeight: '700', fontFamily: 'Plus Jakarta Sans', offset: 4 }}
          />
          <Area
            type="monotone" dataKey="atcLoss" name="AT&C Loss"
            stroke="#DC2626" fill="#FEF2F2" fillOpacity={0.45} strokeWidth={2}
            dot={{ r: 3.5, fill: '#DC2626', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 5 }}
          />
          <Line
            type="monotone" dataKey="tdLoss" name="T&D Loss"
            stroke="#2563EB" strokeWidth={2} strokeDasharray="5 3"
            dot={{ r: 3.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '24px', paddingTop: '6px', paddingBottom: '4px' }}>
        {[
          { color: '#DC2626', label: 'AT&C Loss', dash: false },
          { color: '#2563EB', label: 'T&D Loss',  dash: true },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash ? '4 2' : 'none'} />
              <circle cx="10" cy="4" r="2.5" fill={item.color} />
            </svg>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Year-on-Year Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, 1fr)', gap: '3px', fontSize: '9.5px' }}>
          <div style={{ color: '#94A3B8', fontWeight: '600' }} />
          {['FY 2018-19','FY 2019-20','FY 2020-21','FY 2021-22','FY 2022-23'].map(fy => (
            <div key={fy} style={{ textAlign: 'center', color: fy === selectedFY ? '#1E40AF' : '#94A3B8', fontWeight: fy === selectedFY ? '700' : '500' }}>
              {FY_SHORT[fy]}
            </div>
          ))}
          <div style={{ color: '#64748B', fontWeight: '600', paddingTop: '4px' }}>T&D Loss</div>
          {['FY 2018-19','FY 2019-20','FY 2020-21','FY 2021-22','FY 2022-23'].map(fy => (
            <div key={fy} style={{ textAlign: 'center', fontWeight: '700', color: fy === selectedFY ? '#1E40AF' : '#374151', background: fy === selectedFY ? '#EFF6FF' : 'transparent', borderRadius: '4px', padding: '2px 0', paddingTop: '4px' }}>
              {YEAR_DATA[fy].kpis.tdLoss}%
            </div>
          ))}
          <div style={{ color: '#64748B', fontWeight: '600', paddingTop: '4px' }}>AT&C Loss</div>
          {['FY 2018-19','FY 2019-20','FY 2020-21','FY 2021-22','FY 2022-23'].map(fy => (
            <div key={fy} style={{ textAlign: 'center', fontWeight: '700', color: fy === selectedFY ? '#DC2626' : '#374151', background: fy === selectedFY ? '#FFF1F2' : 'transparent', borderRadius: '4px', padding: '2px 0', paddingTop: '4px' }}>
              {YEAR_DATA[fy].kpis.atcLoss}%
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVISION LOSS RANKING (Energy page variant — grid layout with MU estimates)
// ─────────────────────────────────────────────────────────────────────────────

function DivisionLossRanking({ divisionData, tdLoss, inputEnergy, selectedFY }) {
  const maxLoss = Math.max(...divisionData.map(d => d.loss));

  return (
    <Card
      title={`Division-wise Loss Ranking · ${selectedFY}`}
      badge={`18 Divisions · State Benchmark: ${tdLoss}% · Estimated MU loss per division`}
      titleRight={
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Above Benchmark', bg: '#FFF1F2', dot: '#DC2626', border: '#FECDD3' },
            { label: 'Near Benchmark',  bg: '#FFFBEB', dot: '#D97706', border: '#FDE68A' },
            { label: 'Below Benchmark', bg: '#ECFDF5', dot: '#059669', border: '#A7F3D0' },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: b.bg, border: `1px solid ${b.border}`, display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: '500' }}>{b.label}</span>
            </div>
          ))}
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {divisionData.map((div, i) => {
          const vsB = Math.round((div.loss - tdLoss) * 10) / 10;
          const isAbove = div.loss > tdLoss * 1.05;
          const isBelow = div.loss < tdLoss * 0.95;
          const statusColor  = isAbove ? '#DC2626' : isBelow ? '#059669' : '#D97706';
          const statusBg     = isAbove ? '#FFF1F2' : isBelow ? '#ECFDF5' : '#FFFBEB';
          const statusBorder = isAbove ? '#FECDD3' : isBelow ? '#A7F3D0' : '#FDE68A';
          const barColor     = isAbove ? '#FCA5A5' : isBelow ? '#6EE7B7' : '#FCD34D';
          const estimatedMU  = Math.round(inputEnergy * div.loss / 100 * 10) / 10;

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 11px',
              background: isAbove ? '#FFFAFA' : isBelow ? '#F0FFF4' : '#FFFEF7',
              borderRadius: '8px',
              border: `1px solid ${statusBorder}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '5px',
                background: statusBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '800', color: statusColor, flexShrink: 0,
              }}>
                {i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {div.name}
                  </span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'baseline', flexShrink: 0, marginLeft: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: statusColor, lineHeight: 1 }}>{div.loss}%</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>≈{estimatedMU} MU</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(div.loss / maxLoss) * 100}%`, background: barColor, borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '8.5px', fontWeight: '700', color: statusColor, flexShrink: 0, minWidth: 38, textAlign: 'right' }}>
                    {vsB > 0 ? '+' : ''}{vsB.toFixed(1)} pp
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY NETWORK OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function EnergyNetworkOverview({ selectedFY }) {
  const items = [
    { label: 'Circles',                   value: '2',     color: '#1E40AF', bg: '#EFF6FF' },
    { label: 'Divisions',                 value: '18',    color: '#1E40AF', bg: '#EFF6FF' },
    { label: 'Subdivisions',              value: '34',    color: '#0369A1', bg: '#F0F9FF' },
    { label: 'Feeders',                   value: '337',   color: '#0369A1', bg: '#F0F9FF' },
    { label: 'Distribution Transformers', value: '8,636', color: '#0284C7', bg: '#F0F9FF' },
  ];

  const ratios = [
    { label: 'DTs per Feeder',   value: '25.6' },
    { label: 'Feeders per Div.', value: '18.7' },
    { label: 'DTs per Division', value: '479.8' },
    { label: 'Consumers per DT', value: '82.7' },
  ];

  return (
    <Card
      title="Network Structure"
      badge={`Goa Electricity Department · ${selectedFY}`}
      bodyStyle={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: item.bg, borderRadius: '7px', padding: '8px 12px',
          }}>
            <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#374151' }}>{item.label}</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: item.color, lineHeight: 1 }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '140px', flexShrink: 0, background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Network Ratios</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-evenly' }}>
          {ratios.map((r, i) => (
            <div key={i}>
              <div style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: '500' }}>{r.label}</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY & LOSS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function EnergyLossPage({ yearData, kpi, selectedFY, prevKpi, trendVs }) {
  const atcT  = pctTrend(kpi.atcLoss,     prevKpi?.atcLoss,     true);
  const tdT   = pctTrend(kpi.tdLoss,      prevKpi?.tdLoss,      true);
  const lossT = muTrend(kpi.energyLoss,   prevKpi?.energyLoss,  true);
  const inpT  = muTrend(kpi.inputEnergy,  prevKpi?.inputEnergy, false);
  const saleT = muTrend(kpi.energySales,  prevKpi?.energySales, false);

  const atcStatus  = kpi.atcLoss <= 12 ? 'good'    : kpi.atcLoss <= 15 ? 'warning' : 'critical';
  const tdStatus   = kpi.tdLoss  <= 8  ? 'good'    : kpi.tdLoss  <= 10 ? 'warning' : 'critical';
  const lossStatus = kpi.tdLoss  <= 8  ? 'warning' : 'critical';

  return (
    <>
      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '14px' }}>
        <KPICard
          title="Input Energy" value={kpi.inputEnergy.toLocaleString('en-IN')} unit="MU"
          trend={inpT.trend} trendDir={inpT.trendDir} trendVs={trendVs}
          status="info" icon={Ic.zap}
          sub="Total power procured from grid"
        />
        <KPICard
          title="Energy Sales" value={kpi.energySales.toLocaleString('en-IN')} unit="MU"
          trend={saleT.trend} trendDir={saleT.trendDir} trendVs={trendVs}
          status="good" icon={Ic.checkCircle}
          sub="Units billed to consumers"
        />
        <KPICard
          title="Energy Loss" value={kpi.energyLoss.toLocaleString('en-IN')} unit="MU"
          trend={lossT.trend} trendDir={lossT.trendDir} trendVs={trendVs}
          status={lossStatus} icon={Ic.alertTriangle}
          sub="Unaccounted T&D losses"
        />
        <KPICard
          title="T&D Loss" value={kpi.tdLoss.toFixed(2)} unit="%"
          trend={tdT.trend} trendDir={tdT.trendDir} trendVs={trendVs}
          status={tdStatus} icon={Ic.activity}
          sub="Benchmark < 10% · National avg"
        />
        <KPICard
          title="AT&C Loss" value={kpi.atcLoss.toFixed(2)} unit="%"
          trend={atcT.trend} trendDir={atcT.trendDir} trendVs={trendVs}
          status={atcStatus} icon={Ic.trendDown}
          sub="Target < 12% · Includes commercial"
        />
      </div>

      {/* ── Row 2: Energy Flow + Network ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '12px', marginBottom: '12px' }}>
        <EnergyFlowDiagram kpi={kpi} />
        <EnergyNetworkOverview selectedFY={selectedFY} />
      </div>

      {/* ── Row 3: Loss History + Voltage Analysis ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <LossHistoryChart selectedFY={selectedFY} />
        <VoltageLossChart kpi={kpi} />
      </div>

      {/* ── Row 4: Division Ranking ── */}
      <div style={{ marginBottom: '14px' }}>
        <DivisionLossRanking
          divisionData={yearData.divisions}
          tdLoss={kpi.tdLoss}
          inputEnergy={kpi.inputEnergy}
          selectedFY={selectedFY}
        />
      </div>

      {/* ── Row 5: Key Insights ── */}
      <KeyInsights insights={yearData.insights} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DT COMMUNICATION HEALTH CARD
// ─────────────────────────────────────────────────────────────────────────────

function DTCommunicationCard({ sm }) {
  const { totalDTs, communicableDTs, activeDTs, communicationRate } = sm.communication;

  const commSev = communicationRate < 20 ? 'critical' : communicationRate < 50 ? 'warning' : 'good';
  const sevStyle = {
    critical: { bg: '#FFF1F2', color: '#DC2626', border: '#FECDD3', label: 'Critical' },
    warning:  { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Below Target' },
    good:     { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'On Track' },
  }[commSev];

  const funnel = [
    { name: 'Total DTs',             value: totalDTs,        fill: '#CBD5E1' },
    { name: 'Communicable DTs',       value: communicableDTs, fill: '#3B82F6' },
    { name: 'Active Communicating',   value: activeDTs,       fill: '#059669' },
  ];

  const ratio = Math.round(totalDTs / (activeDTs || 1));

  return (
    <Card
      title="DT Communication Health"
      badge={`${activeDTs.toLocaleString('en-IN')} of ${totalDTs.toLocaleString('en-IN')} DTs actively reporting`}
      titleRight={
        <span style={{
          fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.04em',
          background: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}`,
          padding: '2px 7px', borderRadius: '4px',
        }}>{sevStyle.label}</span>
      }
    >
      {/* Funnel bars */}
      <div style={{ marginBottom: '14px' }}>
        {funnel.map((item, i) => (
          <div key={i} style={{ marginBottom: i < funnel.length - 1 ? '10px' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#374151' }}>{item.name}</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', lineHeight: 1 }}>
                {item.value.toLocaleString('en-IN')}
                <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '400', marginLeft: '4px' }}>
                  ({((item.value / totalDTs) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
            <div style={{ height: 10, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(item.value / totalDTs) * 100}%`,
                background: item.fill,
                borderRadius: '999px',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        {[
          { label: 'Total DTs',    value: totalDTs.toLocaleString('en-IN'),        pct: '100%',                                        color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
          { label: 'Communicable', value: communicableDTs.toLocaleString('en-IN'), pct: `${((communicableDTs/totalDTs)*100).toFixed(1)}%`, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
          { label: 'Active',       value: activeDTs.toLocaleString('en-IN'),       pct: `${communicationRate.toFixed(1)}%`,             color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
        ].map((tile, i) => (
          <div key={i} style={{
            background: tile.bg, border: `1px solid ${tile.border}`,
            borderRadius: '8px', padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: tile.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{tile.value}</div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: tile.color, marginTop: '2px', opacity: 0.8 }}>{tile.pct}</div>
            <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '500', marginTop: '1px' }}>{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Callout */}
      <div style={{
        background: commSev === 'good' ? '#ECFDF5' : commSev === 'warning' ? '#FFFBEB' : '#FFF1F2',
        border: `1px solid ${commSev === 'good' ? '#A7F3D0' : commSev === 'warning' ? '#FDE68A' : '#FECDD3'}`,
        borderRadius: '7px', padding: '9px 11px',
      }}>
        <p style={{ fontSize: '10px', color: '#374151', lineHeight: 1.6, margin: 0 }}>
          {ratio <= 3
            ? <><strong>1 in {ratio} DTs</strong> is actively transmitting data — strong AMI coverage in progress.</>
            : <>Only <strong>1 in {ratio} DTs</strong> actively transmitting. Communication infrastructure expansion is the critical bottleneck.</>
          }
        </p>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLLOUT PROGRESS CARD
// ─────────────────────────────────────────────────────────────────────────────

function RolloutProgressCard({ sm }) {
  const { consumerMeters, dtMeters, feederMeters } = sm.rollout;

  const items = [
    { label: 'Consumer Smart Meters', installed: consumerMeters.installed, target: consumerMeters.target, color: '#1E40AF', iconBg: '#EFF6FF', icon: Ic.users },
    { label: 'DT Meters',             installed: dtMeters.installed,       target: dtMeters.target,       color: '#0369A1', iconBg: '#F0F9FF', icon: Ic.cpu },
    { label: 'Feeder Meters',         installed: feederMeters.installed,   target: feederMeters.target,   color: '#0EA5E9', iconBg: '#F0F9FF', icon: Ic.activity },
  ];

  const totalInstalled = consumerMeters.installed + dtMeters.installed + feederMeters.installed;
  const totalTarget    = consumerMeters.target    + dtMeters.target    + feederMeters.target;
  const overallPct     = totalTarget > 0 ? (totalInstalled / totalTarget * 100) : 0;

  return (
    <Card
      title="Smart Meter Rollout Progress"
      badge="RDSS Programme Targets"
      titleRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#1E40AF', lineHeight: 1 }}>{overallPct.toFixed(1)}%</div>
          <div style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: '500' }}>Overall</div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.map((item, i) => {
          const pct = item.target > 0 ? (item.installed / item.target * 100) : 0;
          const status = pct === 0 ? 'critical' : pct < 30 ? 'warning' : pct < 70 ? 'info' : 'good';
          const statusStyle = {
            critical: { color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3', label: 'Not Started', barColor: '#FCA5A5' },
            warning:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'In Progress',  barColor: '#FCD34D' },
            info:     { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'On Track',     barColor: '#3B82F6' },
            good:     { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Advanced',     barColor: '#10B981' },
          }[status];

          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '5px',
                    background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.color, flexShrink: 0,
                  }}>
                    <span style={{ width: 11, height: 11, display: 'block' }}>{item.icon}</span>
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#0F172A' }}>{item.label}</span>
                </div>
                <span style={{
                  fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.03em',
                  background: statusStyle.bg, color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  padding: '2px 7px', borderRadius: '4px',
                }}>{statusStyle.label}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '9.5px', color: '#64748B' }}>
                  {item.installed.toLocaleString('en-IN')} of {item.target.toLocaleString('en-IN')} installed
                </span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: item.color, lineHeight: 1 }}>{pct.toFixed(1)}%</span>
              </div>

              <div style={{ height: 8, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(pct > 0 ? pct : 0, pct > 0 ? 0.8 : 0)}%`,
                  background: statusStyle.barColor,
                  borderRadius: '999px',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '14px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '7px', padding: '10px 12px' }}>
        <div style={{ fontSize: '9.5px', color: '#64748B', lineHeight: 1.6 }}>
          Total RDSS target: <strong style={{ color: '#0F172A' }}>{totalTarget.toLocaleString('en-IN')}</strong> meters across consumer, DT, and feeder categories.
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA QUALITY CARD
// ─────────────────────────────────────────────────────────────────────────────

function DataQualityCard({ sm }) {
  const dq = sm.dataQuality;
  const metrics = [
    { label: 'Consumer Tagging Coverage', value: dq.consumerTagging,   icon: Ic.tag,          target: 95 },
    { label: 'Data Availability',         value: dq.dataAvailability,  icon: Ic.database,     target: 90 },
    { label: 'Data Freshness (< 24h)',    value: dq.dataFreshness,     icon: Ic.activity,     target: 90 },
    { label: 'Meter Reporting Success',   value: dq.meterReporting,    icon: Ic.wifi,         target: 95 },
    { label: 'Network Visibility Score',  value: dq.networkVisibility, icon: Ic.barChart,     target: 90 },
  ];

  const compositeScore = Math.round(
    (dq.consumerTagging + dq.dataAvailability + dq.dataFreshness + dq.meterReporting + dq.networkVisibility) / 5
  );

  const scoreSev = compositeScore >= 80 ? 'good' : compositeScore >= 55 ? 'warning' : 'critical';
  const scoreStyle = {
    good:     { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Good' },
    warning:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Needs Attention' },
    critical: { color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3', label: 'Poor' },
  }[scoreSev];

  return (
    <Card
      title="Data Quality Dashboard"
      badge="Accuracy & completeness of metering data"
      titleRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: scoreStyle.color, lineHeight: 1 }}>{compositeScore}</div>
            <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>/ 100</div>
          </div>
          <span style={{
            fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.03em',
            background: scoreStyle.bg, color: scoreStyle.color,
            border: `1px solid ${scoreStyle.border}`,
            padding: '2px 7px', borderRadius: '4px',
          }}>{scoreStyle.label}</span>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {metrics.map((m, i) => {
          const status = m.value >= 80 ? 'good' : m.value >= 55 ? 'warning' : 'critical';
          const barColor      = { good: '#10B981', warning: '#FBBF24', critical: '#F87171' }[status];
          const metricStyle = {
            good:     { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Good' },
            warning:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Needs Attention' },
            critical: { color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3', label: 'Poor' },
          }[status];

          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 11, height: 11, display: 'block', color: '#94A3B8', flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#374151' }}>{m.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: metricStyle.color, lineHeight: 1 }}>{m.value}%</span>
                  <span style={{
                    fontSize: '8px', fontWeight: '700', letterSpacing: '0.03em',
                    background: metricStyle.bg, color: metricStyle.color,
                    border: `1px solid ${metricStyle.border}`,
                    padding: '1px 5px', borderRadius: '3px',
                  }}>{metricStyle.label}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.value}%`, background: barColor, borderRadius: '999px' }} />
                </div>
                <span style={{ fontSize: '8.5px', color: '#CBD5E1', fontWeight: '500', flexShrink: 0 }}>Target {m.target}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVISION DATA HEALTH CARD
// ─────────────────────────────────────────────────────────────────────────────

function DivisionDataHealthCard({ sm }) {
  const sorted = [...sm.divisions].sort((a, b) => b.dataScore - a.dataScore);

  return (
    <Card title="Division-wise Data Health" badge={`${sorted.length} Divisions · ranked by data score`}>
      <div style={{ maxHeight: 362, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sorted.map((div, i) => {
          const status     = div.dataScore >= 70 ? 'good' : div.dataScore >= 45 ? 'warning' : 'critical';
          const dotColor   = { good: '#059669', warning: '#D97706', critical: '#DC2626' }[status];
          const isFirst    = i === 0;
          const isLast     = i === sorted.length - 1;

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '6px 9px',
              background: isFirst ? '#F0FFF4' : isLast ? '#FFF5F5' : '#FAFAFA',
              borderRadius: '7px',
              border: `1px solid ${isFirst ? '#BBF7D0' : isLast ? '#FCA5A5' : '#F1F5F9'}`,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: isFirst ? '#ECFDF5' : isLast ? '#FFF1F2' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8.5px', fontWeight: '800',
                color: isFirst ? '#059669' : isLast ? '#DC2626' : '#94A3B8',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              <span style={{
                fontSize: '10px', fontWeight: '700', color: '#0F172A',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {div.name}
              </span>

              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '8px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                  {div.commRate.toFixed(1)}%
                </span>
                <span style={{ fontSize: '8px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                  {div.taggingCoverage}%
                </span>
                <span style={{
                  fontSize: '8px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px',
                  background: dotColor === '#059669' ? '#ECFDF5' : dotColor === '#D97706' ? '#FFFBEB' : '#FFF1F2',
                  color: dotColor,
                  border: `1px solid ${dotColor === '#059669' ? '#A7F3D0' : dotColor === '#D97706' ? '#FDE68A' : '#FECDD3'}`,
                }}>
                  {div.dataScore}
                </span>
              </div>

              {isFirst && (
                <span style={{ fontSize: '7.5px', fontWeight: '700', letterSpacing: '0.04em', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 5px', borderRadius: '3px', flexShrink: 0 }}>Best</span>
              )}
              {isLast && (
                <span style={{ fontSize: '7.5px', fontWeight: '700', letterSpacing: '0.04em', background: '#FFF1F2', color: '#DC2626', border: '1px solid #FECDD3', padding: '1px 5px', borderRadius: '3px', flexShrink: 0 }}>Action</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {[
          { label: 'Comm Rate', desc: 'DT communication %' },
          { label: 'Tagging',   desc: 'Consumer tag %' },
          { label: 'Score',     desc: 'Data health 0–100' },
        ].map((l, i) => (
          <span key={i} style={{ fontSize: '8.5px', color: '#94A3B8' }}>
            <strong style={{ color: '#64748B' }}>{l.label}</strong> — {l.desc}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERNIZATION PROGRESS CARD
// ─────────────────────────────────────────────────────────────────────────────

function ModernizationCard({ sm }) {
  const milestones = sm.modernization;
  const completed  = milestones.filter(m => m.status === 'complete').length;
  const inProgress = milestones.filter(m => m.status === 'in-progress').length;

  const cfg = {
    'complete':    { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '✓', barColor: '#10B981' },
    'in-progress': { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '↻', barColor: '#3B82F6' },
    'pending':     { color: '#CBD5E1', bg: '#F8FAFC', border: '#E5E7EB', icon: '○', barColor: '#E5E7EB' },
  };

  return (
    <Card title="RDSS Modernization Progress" badge={`${completed} complete · ${inProgress} in progress`}>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {milestones.map((m, i) => {
          const c      = cfg[m.status];
          const isLast = i === milestones.length - 1;

          return (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: isLast ? 0 : '13px', position: 'relative' }}>
              {!isLast && (
                <div style={{
                  position: 'absolute', left: 11, top: 22, bottom: -13,
                  width: 1, background: '#E5E7EB', zIndex: 0,
                }} />
              )}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: c.bg, border: `1.5px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '800', color: c.color,
                zIndex: 1, position: 'relative',
              }}>
                {c.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: m.status === 'pending' ? '#CBD5E1' : '#0F172A' }}>
                    {m.name}
                  </span>
                  <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: '500', flexShrink: 0, marginLeft: '6px' }}>
                    {m.year}
                  </span>
                </div>
                {m.status !== 'pending' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.completionPct}%`, background: c.barColor, borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '8.5px', fontWeight: '700', color: c.color, flexShrink: 0 }}>{m.completionPct}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART METERS EXECUTIVE INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────

function SmartMetersInsights({ insights }) {
  return (
    <Card title="Executive Insights" badge="Modernisation & data readiness">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {insights.map((item, i) => (
          <div key={i} style={{
            background: item.bg || '#F8FAFC',
            borderRadius: '8px', padding: '11px 13px',
            border: `1px solid ${item.border || '#E5E7EB'}`,
            borderTop: `3px solid ${item.accentColor || '#94A3B8'}`,
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: item.accentColor || '#64748B', marginBottom: '4px', lineHeight: 1.35 }}>
              {item.title}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.6 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART METERS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function SmartMetersPage({ selectedFY, trendVs }) {
  const sm      = SMART_METER_YEAR_DATA[selectedFY];
  const prevIdx = FY_OPTIONS.indexOf(selectedFY) - 1;
  const prevSm  = prevIdx >= 0 ? SMART_METER_YEAR_DATA[FY_OPTIONS[prevIdx]] : null;

  const commRate    = sm.communication.communicationRate;
  const consumerPct = sm.rollout.consumerMeters.installed / sm.rollout.consumerMeters.target * 100;
  const dtPct       = sm.rollout.dtMeters.installed       / sm.rollout.dtMeters.target       * 100;
  const feederPct   = sm.rollout.feederMeters.installed   / sm.rollout.feederMeters.target   * 100;
  const daPct       = sm.dataQuality.dataAvailability;

  const prevCommRate    = prevSm?.communication.communicationRate ?? null;
  const prevConsumerPct = prevSm ? (prevSm.rollout.consumerMeters.installed / prevSm.rollout.consumerMeters.target * 100) : null;
  const prevDtPct       = prevSm ? (prevSm.rollout.dtMeters.installed       / prevSm.rollout.dtMeters.target       * 100) : null;
  const prevFeederPct   = prevSm ? (prevSm.rollout.feederMeters.installed   / prevSm.rollout.feederMeters.target   * 100) : null;
  const prevDaPct       = prevSm?.dataQuality.dataAvailability ?? null;

  const commT    = pctTrend(commRate,    prevCommRate,    false);
  const consumerT = pctTrend(consumerPct, prevConsumerPct, false);
  const dtT       = pctTrend(dtPct,       prevDtPct,       false);
  const feederT   = pctTrend(feederPct,   prevFeederPct,   false);
  const daT       = pctTrend(daPct,       prevDaPct,       false);

  const commStatus    = commRate    < 20 ? 'critical' : commRate    < 50 ? 'warning' : 'good';
  const consumerStatus = consumerPct === 0 ? 'critical' : consumerPct < 30 ? 'warning' : 'good';
  const dtStatus       = dtPct       < 30 ? 'critical' : dtPct       < 60 ? 'warning' : 'good';
  const feederStatus   = feederPct   === 0 ? 'critical' : feederPct   < 30 ? 'warning' : 'good';
  const daStatus       = daPct       < 70 ? 'critical' : daPct       < 85 ? 'warning' : 'good';

  return (
    <>
      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '14px' }}>
        <KPICard
          title="DT Communication Rate" value={commRate.toFixed(1)} unit="%"
          trend={commT.trend} trendDir={commT.trendDir} trendVs={trendVs}
          status={commStatus} icon={Ic.wifi}
          sub={`${sm.communication.activeDTs.toLocaleString('en-IN')} of ${sm.communication.totalDTs.toLocaleString('en-IN')} DTs active`}
        />
        <KPICard
          title="Consumer SM Target" value={consumerPct.toFixed(1)} unit="%"
          trend={consumerT.trend} trendDir={consumerT.trendDir} trendVs={trendVs}
          status={consumerStatus} icon={Ic.users}
          sub={`${sm.rollout.consumerMeters.installed.toLocaleString('en-IN')} of ${(sm.rollout.consumerMeters.target/1000).toFixed(0)}K target`}
        />
        <KPICard
          title="DT Meter Rollout" value={dtPct.toFixed(1)} unit="%"
          trend={dtT.trend} trendDir={dtT.trendDir} trendVs={trendVs}
          status={dtStatus} icon={Ic.cpu}
          sub={`${sm.rollout.dtMeters.installed.toLocaleString('en-IN')} of ${sm.rollout.dtMeters.target.toLocaleString('en-IN')} target`}
        />
        <KPICard
          title="Feeder Coverage" value={feederPct.toFixed(1)} unit="%"
          trend={feederT.trend} trendDir={feederT.trendDir} trendVs={trendVs}
          status={feederStatus} icon={Ic.activity}
          sub={`${sm.rollout.feederMeters.installed} of ${sm.rollout.feederMeters.target} feeders metered`}
        />
        <KPICard
          title="Data Availability" value={daPct} unit="%"
          trend={daT.trend} trendDir={daT.trendDir} trendVs={trendVs}
          status={daStatus} icon={Ic.database}
          sub="Expected data points received"
        />
      </div>

      {/* ── Row 1: Communication + Rollout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px', marginBottom: '12px' }}>
        <DTCommunicationCard sm={sm} />
        <RolloutProgressCard sm={sm} />
      </div>

      {/* ── Row 2: Data Quality + Division Health ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: '12px', marginBottom: '12px' }}>
        <DataQualityCard sm={sm} />
        <DivisionDataHealthCard sm={sm} />
      </div>

    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER FOR OTHER SCREENS
// ─────────────────────────────────────────────────────────────────────────────

function ComingSoon({ title }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: '12px', color: '#94A3B8',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '12px',
        background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94A3B8',
      }}>
        <span style={{ width: 22, height: 22, display: 'block' }}>{Ic.barChart}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#94A3B8' }}>This screen is in development</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────

function pctTrend(curr, prev, lowerIsBetter = true) {
  if (prev == null) return { trend: null, trendDir: 'neutral' };
  const delta = curr - prev;
  if (Math.abs(delta) < 0.005) return { trend: null, trendDir: 'neutral' };
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return {
    trend: `${Math.abs(delta).toFixed(2)} pp`,
    trendDir: `${delta < 0 ? 'down' : 'up'}-${isGood ? 'good' : 'bad'}`,
  };
}

function muTrend(curr, prev, lowerIsBetter = true) {
  if (prev == null) return { trend: null, trendDir: 'neutral' };
  const delta = curr - prev;
  if (Math.abs(delta) < 1) return { trend: null, trendDir: 'neutral' };
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return {
    trend: `${Math.abs(Math.round(delta))} MU`,
    trendDir: `${delta < 0 ? 'down' : 'up'}-${isGood ? 'good' : 'bad'}`,
  };
}

function crTrend(curr, prev, lowerIsBetter = true) {
  if (prev == null) return { trend: null, trendDir: 'neutral' };
  const delta = curr - prev;
  if (Math.abs(delta) < 1) return { trend: null, trendDir: 'neutral' };
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return {
    trend: `₹${Math.abs(Math.round(delta))} Cr`,
    trendDir: `${delta < 0 ? 'down' : 'up'}-${isGood ? 'good' : 'bad'}`,
  };
}

export default function App() {
  const [activeTab, setActiveTab]         = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFY, setSelectedFY]       = useState('FY 2024-25');

  const yearData     = YEAR_DATA[selectedFY];
  const prevFYIndex  = FY_OPTIONS.indexOf(selectedFY) - 1;
  const prevFY       = prevFYIndex >= 0 ? FY_OPTIONS[prevFYIndex] : null;
  const prevYearData = prevFY ? YEAR_DATA[prevFY] : null;
  const trendVs      = prevFY ? `vs ${FY_SHORT[prevFY]}` : null;

  const kpi     = yearData.kpis;
  const prevKpi = prevYearData?.kpis ?? null;

  const atcT  = pctTrend(kpi.atcLoss,        prevKpi?.atcLoss,        true);
  const tdT   = pctTrend(kpi.tdLoss,         prevKpi?.tdLoss,         true);
  const collT = pctTrend(kpi.collEff,        prevKpi?.collEff,        false);
  const lossT = muTrend (kpi.energyLoss,     prevKpi?.energyLoss,     true);
  const dueT  = crTrend (kpi.outstandingDues, prevKpi?.outstandingDues, true);

  const atcStatus  = kpi.atcLoss  <= 12 ? 'good'    : kpi.atcLoss  <= 15 ? 'warning' : 'critical';
  const tdStatus   = kpi.tdLoss   <= 8  ? 'good'    : kpi.tdLoss   <= 10 ? 'warning' : 'critical';
  const collStatus = kpi.collEff  >= 95 ? 'good'    : kpi.collEff  >= 92 ? 'warning' : 'critical';
  const lossStatus = kpi.tdLoss   <= 8  ? 'warning' : 'critical';
  const dueStatus  = kpi.outstandingDues <= 400 ? 'warning' : 'critical';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#F8FAFC',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* ── CONTENT AREA ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        <TopBar
          activeTab={activeTab}
          selectedFY={selectedFY}
          setSelectedFY={setSelectedFY}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 32px' }}>

          {activeTab === 'overview' && (
            <>
              {/* ── KPI STRIP ──────────────────────────────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '10px',
                marginBottom: '14px',
              }}>
                <KPICard
                  title="AT&C Loss" value={kpi.atcLoss.toFixed(2)} unit="%"
                  trend={atcT.trend} trendDir={atcT.trendDir} trendVs={trendVs}
                  status={atcStatus} icon={Ic.trendDown}
                  sub="Target < 12% · National avg ~16%"
                />
                <KPICard
                  title="T&D Loss" value={kpi.tdLoss.toFixed(2)} unit="%"
                  trend={tdT.trend} trendDir={tdT.trendDir} trendVs={trendVs}
                  status={tdStatus} icon={Ic.activity}
                  sub="Best-in-class · Benchmark < 10%"
                />
                <KPICard
                  title="Collection Efficiency" value={kpi.collEff.toFixed(2)} unit="%"
                  trend={collT.trend} trendDir={collT.trendDir} trendVs={trendVs}
                  status={collStatus} icon={Ic.checkCircle}
                  sub={kpi.collEff >= 95 ? 'Target > 95% · Achieved' : 'Target > 95% · Below target'}
                />
                <KPICard
                  title="Input Energy" value={kpi.inputEnergy.toLocaleString('en-IN')} unit="MU"
                  trendDir="neutral"
                  status="info" icon={Ic.zap}
                  sub={`${kpi.inputEnergy.toLocaleString('en-IN')} MU · ${selectedFY}`}
                />
                <KPICard
                  title="Energy Sales" value={kpi.energySales.toLocaleString('en-IN')} unit="MU"
                  trendDir="neutral"
                  status="info" icon={Ic.barChart}
                  sub={`${kpi.energySales.toLocaleString('en-IN')} MU billed`}
                />
                <KPICard
                  title="Energy Loss" value={kpi.energyLoss.toLocaleString('en-IN')} unit="MU"
                  trend={lossT.trend} trendDir={lossT.trendDir} trendVs={trendVs}
                  status={lossStatus} icon={Ic.alertTriangle}
                  sub={`${kpi.energyLoss} MU · ${kpi.tdLoss}% of input`}
                />
                <KPICard
                  title="Total Consumers" value="7.14 L"
                  trendDir="neutral"
                  status="neutral" icon={Ic.users}
                  sub="714,431 · 18 Divisions"
                />
                <KPICard
                  title="Outstanding Dues" value={`₹${kpi.outstandingDues}`} unit="Cr"
                  trend={dueT.trend} trendDir={dueT.trendDir} trendVs={trendVs}
                  status={dueStatus} icon={Ic.creditCard}
                  sub="Immediate collection focus"
                />
              </div>

              {/* ── ROW 2: Attention + Division Chart ─────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <AttentionPanel alerts={yearData.alerts} />
                <DivisionPerformance
                  divisionData={yearData.divisions}
                  tdLoss={kpi.tdLoss}
                  selectedFY={selectedFY}
                />
              </div>

              {/* ── ROW 3: Trends + Consumer + Network ────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 230px 250px',
                gap: '12px',
                marginBottom: '14px',
              }}>
                <PerformanceTrends selectedFY={selectedFY} />
                <ConsumerMix />
                <NetworkAndDataHealth networkStats={yearData.network} selectedFY={selectedFY} />
              </div>

              {/* ── ROW 4: Key Insights ───────────────────────────────── */}
              <KeyInsights insights={yearData.insights} />
            </>
          )}

          {activeTab === 'energy' && (
            <EnergyLossPage
              yearData={yearData}
              kpi={kpi}
              selectedFY={selectedFY}
              prevKpi={prevKpi}
              trendVs={trendVs}
            />
          )}
          {activeTab === 'meters' && (
            <SmartMetersPage selectedFY={selectedFY} trendVs={trendVs} />
          )}
        </main>

        <footer style={{
          borderTop: '1px solid #E5E7EB',
          padding: '8px 22px',
          background: '#FFFFFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>
            Goa Electricity Department · Executive Intelligence Dashboard · Data: Annual Energy Audit Report · {selectedFY}
          </span>
          <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
            For official use only · Confidential
          </span>
        </footer>
      </div>
    </div>
  );
}
