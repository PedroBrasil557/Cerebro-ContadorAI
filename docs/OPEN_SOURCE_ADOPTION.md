# Open Source Adoption — Visual & Motion

## Status

**Round 1 concluded on 2026-09-21.**

The round started after PR #14 (Dashboard + Transactions Calm Intelligence) reached `main` and Production turned green. It ended after PR #18 also reached `main` and its Production deployment turned green.

The objective was not to install as many UI libraries as possible. The objective was to extract useful patterns, adapt them to the Cérebro Design System, prove them through CI/E2E/Preview, and stop when additional dependencies no longer produced a clear user benefit.

## Principles

1. Cérebro Design System remains the product source of truth.
2. Open-source projects are inputs, not owners of the visual language.
3. Add one capability at a time and validate it in isolation.
4. Preserve accessibility, especially `prefers-reduced-motion`.
5. Do not add a second animation engine without a concrete need.
6. Copy-first projects must be adapted to Cérebro tokens and primitives before production use.
7. No visual dependency can change financial rules, Auth, RLS, billing, Founder authority or API contracts.
8. A library is not adopted just because it is visually attractive; it must improve a real product interaction.

## What shipped

### PR #15 — Motion System Foundation

- centralized motion durations and variants in `core/motion/presets.ts`
- global `CerebroMotionProvider`
- `reducedMotion="user"`
- controlled page transitions in `ViewContainer`
- tests for the motion scale

### PR #16 — Animated shared Radix modal

- restrained overlay fade
- animated dialog surface using Cérebro motion presets
- Radix kept ownership of focus trap, Escape handling, accessible naming and focus restoration
- additional E2E coverage for dialog interaction
- no new runtime dependency

### PR #17 — Finance list and metric motion

- `FinancialMetricCard` uses the shared motion language
- `TransactionRow` uses short entry/layout motion
- no persistent decorative animation around financial information
- no new runtime dependency

### PR #18 — Cash-flow chart data UX

- Recharts remains the chart engine
- explicit Receitas / Despesas legend
- semantic series names in tooltips
- `aria-pressed` state on line/bar controls
- Recharts accessibility layer enabled
- chart animation aligned to 240 ms
- chart animation disabled when the user requests reduced motion
- E2E validates the chart-mode switch

## Motion System v1

### Approved motion language

- instant: 100 ms
- fast: 160 ms
- normal: 240 ms
- slow: 360 ms
- short travel distances, generally 4–8 px
- restrained scale only for dialog/surface entrance
- no persistent decorative movement around financial data
- layout motion is allowed when it clarifies insertion/repositioning
- the user's reduced-motion preference is authoritative

The JavaScript presets live in `core/motion/presets.ts` and mirror the CSS durations in `app/globals.css`.

## Final source decisions

### Motion / `motion/react`

Decision: **engine migration deferred, not rejected**.

The official Motion upgrade path from `framer-motion` is primarily a package/import migration. The current Cérebro implementation already has a stable shared motion policy on the installed engine and all adoption PRs passed Typecheck, Lint, Unit, Build, Release E2E and Vercel.

Migrating every import now would create broad dependency/lockfile churn without a new user-facing capability. Re-open this decision only when at least one trigger exists:

- a required Motion feature is unavailable through the current package;
- a security or maintenance reason requires the migration;
- measured bundle/runtime improvement justifies the change;
- another planned upgrade already requires touching the same dependency surface.

When that happens, migration must be an isolated PR with package-lock review, bundle comparison and full E2E.

### Motion Primitives

Decision: **reference/copy source only**.

The project is beta and its useful interaction patterns can be adapted into Cérebro-owned components. It is not a central runtime dependency in Round 1.

### Animate UI

Decision: **reference/copy source only**.

The useful pattern in this round was the animated-Radix approach. It was adapted into `core/ui/Modal.tsx` while preserving Cérebro tokens and Radix accessibility semantics. No Animate UI runtime dependency was added.

### Tremor Raw

Decision: **data-UX reference only**.

The dashboard chart keeps Recharts directly. Round 1 adopted clearer legend/tooltip/control/accessibility patterns without importing Tremor as a dependency.

### Magic UI / Kokonut UI

Decision: **deferred to special moments only**.

Potential future uses are onboarding, meaningful empty states, milestone completion or a bounded AI-processing moment. They are intentionally excluded from routine financial screens because decorative effects would compete with financial information.

### React Bits

Decision: **not adopted in Round 1**.

Any future component requires a new per-component license, accessibility and visual-fit review. There is no blanket approval.

## Dependency outcome

Round 1 added **no new visual or animation runtime dependency**.

That is intentional. The round improved behavior and polish by strengthening the existing stack:

- React 19
- Next.js 16
- Radix UI
- Recharts
- Tailwind CSS
- existing Framer Motion dependency
- Cérebro-owned tokens and primitives

## Acceptance gates used

Every production adoption PR was required to pass:

- Typecheck
- Lint
- Unit tests
- Production build
- Release E2E
- Vercel Preview
- responsive shell regression coverage
- reduced-motion review where applicable
- no regression in ProductSwitcher, Admin or PRO locks
- dependency/license impact review

The final chart PR also reached a green Production deployment before this round was closed.

## Round 1 result

The adoption round is considered complete because the product now has:

- one motion language instead of scattered timings;
- a global reduced-motion policy;
- polished page, modal, metric and transaction movement;
- clearer and more accessible cash-flow chart behavior;
- no second animation engine;
- no extra UI runtime dependency;
- CI/E2E coverage protecting the adopted behavior.

Further open-source UI work should be driven by a concrete product feature, not by a standing goal to add more libraries.
