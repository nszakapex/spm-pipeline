# Scoring

Version: `v1` · Implementation: `src/lib/scoring/score-lead.ts`

## Principles

- Deterministic, rule-based, unit-tested
- Every point has a stored factor/reason
- Commercial intent + engagement only
- Never uses sensitive mentee characteristics

## Category caps

| Category | Max |
| --- | --- |
| Intent | 40 |
| Engagement | 30 |
| Readiness | 20 |
| Source quality | 10 |
| Negative | subtractive |

## Bands

| Score | Band |
| --- | --- |
| 80–100 | P1 / Hot |
| 60–79 | P2 / High |
| 40–59 | P3 / Nurture |
| 0–39 | P4 / Low |

Factors persist on `lead_score_factors`; snapshots on `lead_score_snapshots`.
