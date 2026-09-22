# Personal North Star 2.1 — Functional Contract

Status: **GO**

Authoritative decision source: Central resolution of GitHub issue #32 on 2026-09-22.

## Delivery order

1. Personal Shell + Overview 2.1
2. Transactions 2.1
3. Budget 2.1 + persistence/RLS
4. Goals 2.1 + movement ledger/RLS

Each block is isolated in its own pull request and starts from the latest validated `main`.

## Shell / Overview 2.1

### One Cérebro surface

The product has one financial assistant surface. The top search entry, `Ctrl/⌘ K`, the mobile `Perguntar` action, and the desktop Sidebar `Cérebro` action all open the same existing assistant backed by `/api/ai/chat`.

No entrypoint creates a second conversation engine or silently performs a financial mutation.

### Overview truth rules

Overview only renders metrics and actions supported by persisted product data.

- Do not render fake subscription-review counts.
- Do not render fake pending-receipt counts.
- Do not present generated numbers as persisted truth.
- Insights may explain deterministic data but proposed financial actions follow `RESPOSTA → EVIDÊNCIA → PROPOSTA → CONFIRMAÇÃO`.

## Transactions 2.1

- Existing PDF export remains canonical for this release.
- CSV is deferred; it does not replace PDF.
- Transaction receipt/attachment/notes are deferred until a dedicated transaction attachment domain exists.
- Desktop follows the approved 2.1 frame; current functional responsive behavior is preserved elsewhere rather than redesigned by inference.

## Budget 2.1

### Persistence

`personal_budgets`
- `id`
- `user_id`
- `month_start`
- `planned_total`
- timestamps
- unique `(user_id, month_start)`

`personal_budget_category_limits`
- `id`
- `budget_id`
- `category`
- `limit_amount`
- timestamps
- unique `(budget_id, category)`

### Rules

- Calendar-month scope, no rollover in 2.1.
- Used amount comes from canonical realized expenses in the month.
- Remaining = planned total - used; negative is valid.
- Categories without a limit may show actual spend but not a fabricated utilization percentage.
- Category utilization = realized category spend / category limit.
- Sum of category limits cannot exceed planned total.
- Monetary inputs are non-negative and DB-protected.

### Forecast

Deterministic: `realized spend / elapsed calendar days × total days in month`.

Only show after at least three elapsed days and non-zero realized spend. Otherwise show an insufficient-basis state. A forecast is a projection, not a promise.

### Adjust flow and states

`Ajustar orçamento` explicitly edits the current month planned total and category limits. No silent mutation.

Required states: loading, query error/retry, no-budget CTA, zero-spend, populated.

## Goals 2.1

### Ledger

Add `goal_movements` with:
- `id`
- `goal_id`
- `user_id`
- `kind`: `opening_balance | contribution | withdrawal`
- positive `amount`
- `occurred_at`
- `created_at`

Existing positive balances receive one `opening_balance` entry. Opening balance preserves truth but is excluded from pace, streak and current-month contribution metrics.

Future contributions and withdrawals atomically append a movement and update `current_amount`. Withdrawal may never reduce the goal below zero.

### Deterministic metrics

- Added this month = current-calendar-month contributions.
- Net this month = contributions - withdrawals.
- Monthly pace = average monthly net movement over the last three months when history is sufficient.
- Weekly consistency = count of the last four calendar weeks with positive net contribution (`X de 4`).
- Completion forecast requires sufficient history and positive pace.
- Recommended next contribution = remaining amount / months until a future deadline, when applicable.

### Emergency fund

Do not infer emergency-fund semantics from the title. Add explicit goal classification: `standard | emergency_fund`.

Emergency coverage = goal current amount / average realized expenses over the previous three complete calendar months. If three valid expense months do not exist, show insufficient data instead of a coverage claim.

### AI boundary

Progress, pace, forecast, consistency and coverage are deterministic calculations. AI may explain them but may not mutate a goal without explicit confirmation.
