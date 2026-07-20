# PHASE_2_CONTEXT.md — Complete Product Redesign
## Handloom Hackathon 2026 · PS 4.2 · AI Weaver Companion

> Read `MASTER_CONTEXT.md` before making any change in this phase.
> Scope: UI/UX, information architecture, component system, design tokens, screen specifications, content/copy rules, accessibility, voice UX, print output.
> Out of scope: forecasting logic, model training, API contracts beyond what's needed to bind data to these screens (that's PHASE_3). If a screen needs a field the API doesn't return yet, note it under "Open API Needs" rather than inventing backend logic here.
> This phase supersedes any earlier dashboard-style UI (MAPE/WAPE cards, raw bar charts, unlabeled cluster totals on a weaver-facing screen). Nothing from the old admin-style layout carries over to weaver-facing screens.

---

## 0. What broke last time, and why this phase exists

The previous build shipped a technically correct backend behind a UI that failed real users in three specific, diagnosable ways. Do not repeat these:

1. **A ₹16,21,750 four-week cashflow figure was shown on an individual weaver's action card next to "Produce 6 sarees this week."** Root cause: the cashflow projection summed forecasted revenue across *all six product categories* for the *entire cluster* (hundreds of weavers), then displayed that cluster-wide, all-products total on a card framed as if addressed to one weaver making one product. No division by `active_weavers_est`, no scoping to the single product line being shown. This is a data-binding bug, not a rounding error, and it makes the product look untrustworthy in one glance. Section 7 defines the rule that prevents this permanently.
2. **No language switch existed**, despite the target user being explicitly Gujarati-first. Sections 3 and 6 make language selection a first-run, persistent, whole-app setting — not a feature bolted onto one screen.
3. **A raw, unstyled cluster-selector `<input>` leaked into the weaver-facing card**, and a navy "Print Single-Page Card" button broke the palette. These are component-discipline failures — Section 5 exists so nothing ships without a defined component.

Everything below is written so it can be implemented without re-deriving product judgment mid-build.

---

## 1. Design Philosophy

This is a **companion**, not a **console**.

- The home screen answers exactly one question: **"What should I do this week?"** Nothing else competes for space on first load.
- Every number shown to a weaver is **already interpreted**. Interpretation is the AI-explanation layer's job; raw statistics live only in Admin Mode.
- **One primary action per screen.** If a screen has two things that both feel primary, that's a design failure, not a preference to A/B test.
- **Voice is a first-class input**, on equal footing with typing — not an accessibility add-on — because the primary persona may be more comfortable speaking than reading/typing in any script.
- **Trust is earned by restraint.** A smaller number the weaver believes beats a bigger number that breaks their trust the moment they do the mental math themselves. When in doubt, show less, and show it scoped correctly.

---

## 2. Personas (design against these three, in this priority order)

### Primary — Rameshbhai, 54, Patan Patola weaver
Android phone, modest data budget, comfortable with WhatsApp and voice notes, reads Gujarati fluently, Hindi passably, English with difficulty. Wants to know what to weave next and whether there'll be money for his daughter's school fees this month. Does not want a chart. Trusts a printed card a field officer hands him more than an app he has to operate himself the first few times.

### Secondary — Priya, 29, cooperative field officer
Manages ~40 weavers across 2-3 clusters. Needs Admin Mode: comparative cluster view, accuracy numbers to defend to her supervisor, and the ability to print/send recommendation cards to weavers who won't open the app themselves. Comfortable with English and dashboards. Her success metric is "how many weavers actually acted on a recommendation," not model accuracy.

### Tertiary (narrative persona — informs copy and the pitch, not a separate screen)
A 24-year-old considering leaving the family loom for gig work in the city, because income feels too unpredictable to plan a life around. The product's real objective, stated plainly: make income predictable enough that this person doesn't have to choose between craft and stability. This is why the Financial Card (Section 7) matters as much as the Forecast screen.

---

## 3. Information Architecture

### Weaver mode (default on launch, after onboarding)
Bottom navigation, 5 tabs, icon + label, large touch targets (min 56×56dp):

| Tab | Icon | Purpose |
|---|---|---|
| Home | house | The weekly Action Card. Default landing screen. |
| AI Assistant | chat bubble w/ mic | Voice-first Q&A — explains, never forecasts. |
| Forecast | trend line | One graph, festival markers, "why" — technical detail gated behind a tap. |
| Orders | list/receipt | Upcoming and recent orders, plain-language payment status. |
| Profile | person | Language, cluster/product, text size, printable card, offline data. |

No hamburger menu. No settings buried three taps deep. If it doesn't fit one of these five tabs, it doesn't ship in Weaver mode.

### Admin mode
Separate entry point (distinct route, e.g. `/admin`, or a long-press on the Profile avatar with a PIN — pick one and be consistent), visually distinct chrome. Same color tokens as Weaver mode, but dashboard density is allowed here — this is the one place tables and multi-metric cards belong.

- Cluster comparison table
- Forecast analytics (MAPE, WAPE, pinball loss, confidence coverage — see 6.7)
- Feature importance, backtest results
- Bulk print / bulk send recommendation cards
- Credit-need queue (clusters flagged for follow-up, sorted by probability)

### First-run flow (once, persisted)
1. Language select (Gujarati / Hindi / English — large tap targets, native-script labels, no English header before a language is chosen; use a script/flag icon instead of an English prompt)
2. Name (optional, voice or type)
3. Cluster select (searchable list; default to nearest/most common if location permission granted, otherwise manual)
4. Primary product (defaults to the cluster's `product_specialty`)
5. Done → Home

Four taps minimum, skippable after step 1 with sensible defaults — a first-time user abandoning at step 3 is a real risk worth designing against.

### Wireframe reference — Home (illustrative, not pixel spec)
```
┌───────────────────────────────────┐
│ Good morning, Rameshbhai      🌐GU │
├───────────────────────────────────┤
│ ┌─────────────────────────────┐   │
│ │  WEAVE 6 PATOLA SAREES        │   │
│ │  Demand: HIGH                  │   │
│ │  Why: Raksha Bandhan rising    │   │
│ │  Buy: Silk this week           │   │
│ │  Sell by: 20–28 July            │   │
│ │  Confidence: High                │   │
│ │         [ View Details ]         │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ 🟡 Income: Watch this month    │   │
│ │ ₹3,200–₹4,800 expected this wk│   │
│ └─────────────────────────────┘   │
│ [Should I buy silk?] [Why this?]  │
├───────────────────────────────────┤
│  🏠     💬      📈     📦     👤  │
│ Home Assistant Forecast Orders Profile │
└───────────────────────────────────┘
```
Note the two cards are visually separate and never merged — this is deliberate (see Section 7).

---

## Open API Needs (flag here, don't invent backend behavior in this phase)
- `GET /api/weaver/summary?cluster_id&product_category` returning a **single, already-scoped, per-weaver payload** (see Section 7). If this doesn't exist yet, build against a typed mock matching this exact shape, and Phase 3/backend must produce exactly this shape — the frontend must never re-aggregate cluster-wide numbers itself.
- `GET /api/weaver/orders?cluster_id` returning plain-language status enums (`upcoming`, `in_production`, `awaiting_payment`, `paid`) rather than raw dates the UI has to interpret.

---

## 4. Design Tokens

### Colors
Grounded in real natural-dye tones, not generic warm-beige SaaS styling. Define as CSS custom properties / a `tokens.js` export — never hardcode hex values inline in components.

| Token | Hex | Use |
|---|---|---|
| `--color-cotton-50` | #FBF6EC | App background |
| `--color-cotton-100` | #F3EAD6 | Card background |
| `--color-cotton-300` | #E4D3B0 | Borders, dividers |
| `--color-ink-900` | #2B2420 | Primary text (warm charcoal, not pure black) |
| `--color-ink-600` | #5C5347 | Secondary text |
| `--color-indigo-700` | #26415E | Primary actions, active nav, headers |
| `--color-indigo-500` | #3E5E82 | Hover/pressed states, links |
| `--color-madder-600` | #B3462C | Primary CTA accent, "high demand" badge, errors |
| `--color-turmeric-500` | #D9A441 | Caution / yellow status, highlights |
| `--color-leaf-600` | #5C7A52 | Success / green status, positive confidence |
| `--color-madder-100` | #F1DCD3 | Red-tinted background |
| `--color-turmeric-100` | #F7EAD1 | Yellow-tinted background |
| `--color-leaf-100` | #DEE7DA | Green-tinted background |

Rule: **a status color always pairs a -600/700 token (icon/text) with its matching -100 token (background)** — never a raw saturated fill across a full card. This keeps the palette calm at scale instead of turning into a traffic-light circus.

### Typography
- UI/body: **Noto Sans**, with `Noto Sans Gujarati` / `Noto Sans Devanagari` as the font-stack fallback per active language — one harmonized family across all three scripts so nothing looks bolted-on.
- Display/headline (English only — Gujarati/Hindi headlines use Noto Sans Bold, since mature serif support is inconsistent across scripts): **Fraunces** or **Lora**, used sparingly — greeting text and the hero number on the Action Card only.

| Token | Size | Use |
|---|---|---|
| `--text-display` | 36px | "Weave 6 Patola Sarees" hero number |
| `--text-h1` | 24px | Screen titles |
| `--text-h2` | 20px | Card titles |
| `--text-body` | 16px | Default — never smaller in Weaver mode |
| `--text-caption` | 14px | Secondary labels, timestamps |

### Spacing, radius, shadow, motion
- Spacing scale: 4/8/12/16/24/32/48px, no arbitrary values.
- Radius: `--radius-card: 16px`, `--radius-button: 12px`, `--radius-chip: 999px`.
- Shadow: one soft elevation token only — `0 2px 12px rgba(43,36,32,0.08)` — no stacked drop-shadows.
- Motion: `--motion-fast: 120ms`, `--motion-base: 200ms`, easing `cubic-bezier(0.2,0.8,0.2,1)`. Respect `prefers-reduced-motion`; on low-end Android (`navigator.deviceMemory < 4` or an equivalent flag) skip decorative animation entirely and keep only functional transitions.

---

## 5. Component Library

Every component below must exist as a single reusable implementation. No screen may hand-roll its own card, button, or input — this discipline is what prevents the stray unstyled `<input>` regression.

### `<Button>`
Variants: `primary` (indigo fill), `accent` (madder fill — reserved for the single highest-priority action on a screen, e.g. "Weave now"), `secondary` (indigo outline), `ghost` (text-only, tertiary actions like "Skip"). Props: `size: 'lg' | 'md'` (default `lg` in Weaver mode, min height 48px), `icon?`, `fullWidth?`, `loading?`.

### `<ActionCard>`
The Home screen hero. Props:
```
ActionCard({
  greetingName,           // "Rameshbhai", optional
  product,                 // "Patola Saree"
  quantity,                 // 6 — point forecast, already scoped to ONE product/cluster
  quantityRangeLow,         // e.g. 0
  quantityRangeHigh,        // e.g. 15 — the conformal interval shown as a range, not two stray numbers
  demandLevel,              // 'low' | 'moderate' | 'high' — derived, not raw units
  reason,                    // one plain-language sentence
  buyGuidance,               // "Buy silk this week"
  sellingWindowStart, sellingWindowEnd,  // "20–28 July", never ISO strings
  confidenceLabel,           // 'High' | 'Medium' | 'Low' — never a raw percentage here
  onViewDetails,
})
```
No rupee figure lives on this card. Financial status is a separate card (Section 7) directly below, never merged into this one — the separation is deliberate and is what prevents the two numbers from being read as describing the same thing.

### `<FinancialTrafficLightCard>`
See Section 7 for its full data contract.

### `<ConfidenceBadge>`
Pill, three states only (`High`/`Medium`/`Low`). Never renders a raw percentage or interval width in Weaver mode — Admin mode has a separate `<ConfidenceDetail>` for the numeric interval.

### `<QuickChip>`
Pill button for AI Assistant suggested questions. Props: `label`, `onTap`. Horizontally scrollable row, max 4 visible without scrolling on a 360px-wide screen.

### `<VoiceInputButton>`
States: `idle` (mic icon, indigo), `listening` (pulsing ring, or a static filled ring if reduced-motion), `processing` (spinner), `error` (madder icon + localized "Didn't catch that — try again"). Always paired with a visible text-input fallback — never voice-only.

### `<PlainLanguageStatus>`
Maps backend order-status enums to phrases per language, e.g. `awaiting_payment` → "Payment is on its way." One central mapping table, not inline conditionals scattered across screens.

### `<PrintableCard>`
Print-CSS-only (`@media print`), single page, minimum 18px print font, high contrast — pure black text on white for print regardless of the cream background token (cream wastes toner and photocopies poorly). Contents: greeting, product + quantity + range, reason (1-2 lines max), selling window, financial status as a printed color swatch + one-line label (not a chart), and an optional QR code back to the app — only if a QR library is already a dependency, don't add one solely for this.

### State components
`<LoadingSkeleton>` (shimmer, or static gray blocks under reduced-motion), `<EmptyState>` (icon + one sentence + one action, e.g. "No orders yet. Ask the AI Assistant what to weave this week."), `<ErrorState>` (never a stack trace or raw error string to a weaver — one sentence + retry; Admin mode may show technical detail behind a collapsed "Details" toggle).

---

## 6. Screen Specifications

### 6.1 Home
1. Greeting bar: "Good morning, {greetingName}" + language icon (tap to switch, always accessible here, not only in Profile).
2. `<ActionCard>` — the single largest element on the screen.
3. `<FinancialTrafficLightCard>` — directly below, distinctly bordered so it reads as a second, separate fact.
4. A row of 3 `<QuickChip>`s pulled from the AI Assistant's suggested questions ("Should I buy silk?", "Why this number?", "Can I take a loan?") — tapping jumps into AI Assistant with that question pre-asked.
5. Nothing else. No secondary cards, no activity feed, no upsell — anything Priya needs belongs in Admin mode.

### 6.2 AI Assistant
- Chat-style vertical scroll; weaver's messages right-aligned in `--color-indigo-700`, assistant responses left-aligned in `--color-cotton-100` bubbles.
- Input row: `<VoiceInputButton>` (primary, left), text field (secondary), send.
- `<QuickChip>` row pinned above the input, contents dynamic based on current context (e.g. if credit-need risk is elevated this week, "Can I take a loan?" surfaces higher).
- Every response that references a number must cite where it came from in one trailing clause — e.g. "...based on last year's Raksha Bandhan and how orders have been coming in." Never a bare number with no grounding, even in casual chat.
- The explanation layer explains and translates; it must never independently generate a demand number. If asked about a window outside the current forecast horizon, the UI shows "I can help with this week and the next few weeks — let me check the Forecast screen for anything further out" rather than free-handing a guess.

### 6.3 Forecast
- One graph: weeks on X, units on Y, shaded confidence band, actual/predicted line, festival markers as small icons on the X-axis (not vertical lines cluttering the chart).
- Above the graph: one sentence restating the Action Card's guidance in context ("Demand rises before Raksha Bandhan on 20 July").
- Below the graph, collapsed by default: "View technical details" — expands to the numeric interval and Admin-equivalent data, but only on explicit request. Nothing technical is visible by default.
- Product/cluster switcher only renders if the weaver has more than one active product — most won't, so this control is conditional, not a permanent dropdown taking up space.

### 6.4 Orders
- List using `<PlainLanguageStatus>`, most urgent first.
- Each row: product, quantity, one status phrase, one relative date ("expected in 5 days," not an ISO date).
- Tap to expand: buyer type in plain language ("A shop order" / "A bulk order" / "An export order," not the raw enum) plus the same plain-status timeline.
- Empty state wires directly into the AI Assistant chip flow, not a dead end.

### 6.5 Profile
- Language switcher (same implementation as the Home greeting-bar icon, two entry points).
- Cluster / product settings.
- Text size toggle (Standard / Large) — explicit, not reliant on the weaver knowing an OS-level setting exists.
- "Print my card" → `<PrintableCard>`.
- "Offline data" indicator — last-synced timestamp; if stale beyond a threshold (e.g. 7 days), show a calm banner ("Showing last week's guidance — connect to update") rather than a blank/broken screen.

### 6.6 Onboarding
Covered in Section 3. Every string on this flow must exist in all three languages before it ships — this is the single most visible screen for a missing translation to damage first impressions.

### 6.7 Admin Mode
- Cluster comparison table: cluster, product, this-week forecast, confidence, financial status, credit-need probability — sortable, Priya's primary working view.
- Forecast analytics: MAPE, WAPE, pinball loss, 90% coverage — each paired with one line of plain interpretation, e.g. "WAPE 22.8% — typical for weekly demand at this volume; MAPE reads higher because low-volume weeks amplify percentage error, so lead with WAPE when explaining accuracy to judges or a supervisor." A raw metric with no framing is the same failure mode Weaver mode exists to avoid — Admin mode shouldn't reintroduce it just because the audience is technical.
- Feature importance, backtest chart, credit-need queue: dashboard density is fine here, but still uses the Section 4 tokens — same palette, same 14px type-size floor, not a separate visual system.
- Bulk print / bulk send: multi-select clusters → generate `<PrintableCard>` per selection → single PDF or individual print jobs.
