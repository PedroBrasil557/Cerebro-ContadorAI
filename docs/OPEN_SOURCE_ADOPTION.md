# Open Source Adoption — Visual & Motion

## Status

Phase unlocked after PR #14 (Dashboard + Transactions Calm Intelligence) reached `main` and Production turned green.

This document records what is being adopted, what is only a reference source, and why.

## Principles

1. Cérebro Design System remains the product source of truth.
2. Open-source projects are inputs, not owners of the visual language.
3. Add one capability at a time and validate it in isolation.
4. Preserve accessibility, especially `prefers-reduced-motion`.
5. Do not add a second animation engine without a concrete need.
6. Copy-first projects must be adapted to Cérebro tokens and primitives before production use.
7. No visual dependency can change financial rules, Auth, RLS, billing, Founder authority or API contracts.

## Motion System v1

### Engine strategy

The application currently depends on `framer-motion` 12.x. Motion is the successor project and now recommends imports from `motion/react`, but the current Motion package is on a newer major line.

For the first foundation PR we therefore standardize behavior on the already installed engine before changing packages. This separates UX policy from dependency migration and gives CI/E2E a smaller blast radius.

A later isolated PR may migrate imports from `framer-motion` to `motion/react` after compatibility, lockfile, bundle and E2E validation.

### Approved motion language

- instant: 100 ms
- fast: 160 ms
- normal: 240 ms
- slow: 360 ms
- short travel distances (generally 4–8 px)
- restrained scale only for dialog/surface entrance
- no persistent decorative movement around financial data
- list insertion/removal may use layout motion
- user reduced-motion preference is authoritative

The JavaScript presets live in `core/motion/presets.ts` and mirror the CSS durations in `app/globals.css`.

## Evaluated sources

### Motion

Decision: **foundation candidate / engine migration later**.

Use for springs, gestures, layout transitions and consistent React animation. Do not use `AnimateView` until the application React version meets its requirements and the feature is independently validated.

### Motion Primitives

Decision: **approved as a selective copy/reference source**.

It is beta. Do not add it as a central runtime dependency. Adapt only approved patterns into Cérebro-owned components.

### Animate UI

Decision: **approved as a selective copy/reference source**.

Prefer patterns that improve existing Radix primitives (dialogs, disclosures, menus, tabs) without replacing the Cérebro Design System.

### Magic UI / Kokonut UI

Decision: **future, special moments only**.

Potential uses: AI processing state, onboarding, meaningful empty states and milestone completion. Avoid landing-page effects across routine financial surfaces.

### Tremor Raw

Decision: **reference source for dashboard/data UX**.

Recharts remains the chart engine. Cérebro remains responsible for appearance and semantics.

### React Bits

Decision: **conditional**.

Use only after per-component license and aesthetic review.

## Acceptance gates for every adoption PR

- Typecheck
- Lint
- Unit tests
- Production build
- Release E2E
- Vercel Preview
- Responsive desktop/tablet/mobile review
- reduced-motion review
- no regression in ProductSwitcher, Admin or PRO locks
- explicit review of dependency/license impact

If an integration adds weight or complexity without a visible user benefit, it is rejected.
